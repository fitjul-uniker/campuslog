import { createIsoTimestamp } from "@/lib/date";
import {
  normalizeRelatedLinksForStorage,
  parseRelatedLinks,
} from "@/lib/relatedLinks";
import type {
  AnalysisStatus,
  AnalysisApiResult,
  Experience,
  ExperienceAnalysis,
  ExperienceFormInput,
  RecommendationResult,
} from "@/lib/types";

export const STORAGE_KEYS = {
  experiences: "campuslog:v2:experiences",
  legacyExperiences: "campuslog:v1:experiences",
  experienceMigration: "campuslog:v2:experiences:migrated",
  analyses: "campuslog:v1:analyses",
  recommendations: "campuslog:v1:recommendations",
} as const;

type StoredAnalyses = Record<string, ExperienceAnalysis>;

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson(key: string): unknown {
  if (!canUseLocalStorage()) {
    return undefined;
  }

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return undefined;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return undefined;
  }
}

function writeJson(key: string, value: unknown): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAnalysisStatus(value: unknown): value is AnalysisStatus {
  return (
    value === "unanalyzed" ||
    value === "analyzed" ||
    value === "needs_reanalysis"
  );
}

function isRecommendationPurpose(
  value: unknown,
): value is RecommendationResult["purpose"] {
  return (
    value === "cover_letter" ||
    value === "portfolio" ||
    value === "interview" ||
    value === "activity_application" ||
    value === "other"
  );
}

function parseExperience(value: unknown): Experience | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const relatedLinks = parseRelatedLinks(candidate.relatedLinks);

  if (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.period === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.achievements === "string" &&
    relatedLinks !== null &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    isAnalysisStatus(candidate.analysisStatus)
  ) {
    return {
      id: candidate.id,
      title: candidate.title,
      period: candidate.period,
      role: candidate.role,
      description: candidate.description,
      achievements: candidate.achievements,
      relatedLinks,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
      analysisStatus: candidate.analysisStatus,
    };
  }

  return null;
}

function isExperienceAnalysis(value: unknown): value is ExperienceAnalysis {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.experienceId === "string" &&
    typeof candidate.summary === "string" &&
    isStringArray(candidate.competencyTags) &&
    isStringArray(candidate.achievements) &&
    isStringArray(candidate.keywords) &&
    typeof candidate.generatedAt === "string" &&
    typeof candidate.sourceExperienceUpdatedAt === "string"
  );
}

function isRecommendationResult(value: unknown): value is RecommendationResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    isRecommendationPurpose(candidate.purpose) &&
    typeof candidate.prompt === "string" &&
    typeof candidate.recommendedExperienceId === "string" &&
    typeof candidate.recommendedExperienceTitle === "string" &&
    typeof candidate.reason === "string" &&
    isStringArray(candidate.relatedTags) &&
    typeof candidate.highlightedAchievement === "string" &&
    typeof candidate.usageDirection === "string" &&
    typeof candidate.draftSentence === "string" &&
    typeof candidate.generatedAt === "string"
  );
}

function readStoredExperiences(): Experience[] {
  const parsed = readJson(STORAGE_KEYS.experiences);

  if (Array.isArray(parsed)) {
    if (readJson(STORAGE_KEYS.experienceMigration) !== true) {
      writeJson(STORAGE_KEYS.experienceMigration, true);
    }

    return parsed
      .map(parseExperience)
      .filter((experience): experience is Experience => experience !== null);
  }

  if (readJson(STORAGE_KEYS.experienceMigration) === true) {
    return [];
  }

  const legacyParsed = readJson(STORAGE_KEYS.legacyExperiences);

  if (!Array.isArray(legacyParsed)) {
    return [];
  }

  const migratedExperiences = legacyParsed
    .map(parseExperience)
    .filter((experience): experience is Experience => experience !== null);

  if (writeJson(STORAGE_KEYS.experiences, migratedExperiences)) {
    writeJson(STORAGE_KEYS.experienceMigration, true);
  }

  return migratedExperiences;
}

function readStoredAnalyses(): StoredAnalyses {
  const parsed = readJson(STORAGE_KEYS.analyses);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return Object.values(parsed).reduce<StoredAnalyses>((analyses, value) => {
    if (isExperienceAnalysis(value)) {
      analyses[value.experienceId] = value;
    }

    return analyses;
  }, {});
}

function readStoredRecommendations(): RecommendationResult[] {
  const parsed = readJson(STORAGE_KEYS.recommendations);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(isRecommendationResult);
}

function sortByUpdatedDesc(experiences: Experience[]): Experience[] {
  return [...experiences].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt);
    const bTime = Date.parse(b.updatedAt);

    if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
      return 0;
    }

    if (Number.isNaN(aTime)) {
      return 1;
    }

    if (Number.isNaN(bTime)) {
      return -1;
    }

    return bTime - aTime;
  });
}

function createId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeInput(input: ExperienceFormInput) {
  return {
    title: input.title.trim(),
    period: input.period.trim(),
    role: input.role.trim(),
    description: input.description.trim(),
    achievements: input.achievements.trim(),
    relatedLinks: normalizeRelatedLinksForStorage(input.relatedLinks),
  };
}

function hasRequiredFields(input: ReturnType<typeof normalizeInput>): boolean {
  return Boolean(input.title && input.period && input.role && input.description);
}

function saveExperiences(experiences: Experience[]): void {
  if (
    writeJson(STORAGE_KEYS.experiences, sortByUpdatedDesc(experiences))
  ) {
    writeJson(STORAGE_KEYS.experienceMigration, true);
  }
}

export function getExperiences(): Experience[] {
  return sortByUpdatedDesc(readStoredExperiences());
}

export function getExperienceById(id: string): Experience | null {
  return readStoredExperiences().find((experience) => experience.id === id) ?? null;
}

export function createExperience(input: ExperienceFormInput): Experience | null {
  const normalizedInput = normalizeInput(input);

  if (!hasRequiredFields(normalizedInput)) {
    return null;
  }

  const timestamp = createIsoTimestamp();
  const experience: Experience = {
    id: createId("experience"),
    ...normalizedInput,
    createdAt: timestamp,
    updatedAt: timestamp,
    analysisStatus: "unanalyzed",
  };

  saveExperiences([experience, ...readStoredExperiences()]);

  return experience;
}

export function updateExperience(
  id: string,
  input: ExperienceFormInput,
): Experience | null {
  const normalizedInput = normalizeInput(input);

  if (!hasRequiredFields(normalizedInput)) {
    return null;
  }

  const experiences = readStoredExperiences();
  const currentExperience = experiences.find((experience) => experience.id === id);

  if (!currentExperience) {
    return null;
  }

  const analyses = readStoredAnalyses();
  const hasExistingAnalysis =
    Boolean(analyses[id]) || currentExperience.analysisStatus === "analyzed";

  const updatedExperience: Experience = {
    ...currentExperience,
    ...normalizedInput,
    updatedAt: createIsoTimestamp(),
    analysisStatus: hasExistingAnalysis
      ? "needs_reanalysis"
      : currentExperience.analysisStatus,
  };

  saveExperiences(
    experiences.map((experience) =>
      experience.id === id ? updatedExperience : experience,
    ),
  );

  return updatedExperience;
}

export function deleteExperience(id: string): boolean {
  const experiences = readStoredExperiences();
  const nextExperiences = experiences.filter((experience) => experience.id !== id);

  if (nextExperiences.length === experiences.length) {
    return false;
  }

  const analyses = readStoredAnalyses();
  delete analyses[id];

  saveExperiences(nextExperiences);
  writeJson(STORAGE_KEYS.analyses, analyses);
  deleteRecommendationsByExperienceId(id);

  return true;
}

export function getAnalysisByExperienceId(
  experienceId: string,
): ExperienceAnalysis | null {
  return readStoredAnalyses()[experienceId] ?? null;
}

export function saveAnalysisResult(
  result: AnalysisApiResult,
): ExperienceAnalysis | null {
  const experiences = readStoredExperiences();
  const sourceExperience = experiences.find(
    (experience) => experience.id === result.experienceId,
  );

  if (!sourceExperience) {
    return null;
  }

  const timestamp = createIsoTimestamp();
  const analysis: ExperienceAnalysis = {
    id: createId("analysis"),
    ...result,
    generatedAt: timestamp,
    sourceExperienceUpdatedAt: sourceExperience.updatedAt,
  };

  const analyses = readStoredAnalyses();
  analyses[result.experienceId] = analysis;
  writeJson(STORAGE_KEYS.analyses, analyses);

  saveExperiences(
    experiences.map((experience) =>
      experience.id === result.experienceId
        ? { ...experience, analysisStatus: "analyzed" }
        : experience,
    ),
  );

  return analysis;
}

export function getRecommendationResults(): RecommendationResult[] {
  return readStoredRecommendations();
}

export function saveRecommendationResult(
  result: RecommendationResult,
): RecommendationResult {
  const recommendations = readStoredRecommendations().filter(
    (recommendation) => recommendation.id !== result.id,
  );

  writeJson(STORAGE_KEYS.recommendations, [result, ...recommendations]);

  return result;
}

export function deleteRecommendationsByExperienceId(
  experienceId: string,
): void {
  const recommendations = readStoredRecommendations().filter(
    (recommendation) =>
      recommendation.recommendedExperienceId !== experienceId,
  );

  writeJson(STORAGE_KEYS.recommendations, recommendations);
}
