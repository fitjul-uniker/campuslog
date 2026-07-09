import { createIsoTimestamp } from "@/lib/date";
import type {
  AnalysisStatus,
  Experience,
  ExperienceAnalysis,
  ExperienceFormInput,
  RecommendationResult,
} from "@/lib/types";

export const STORAGE_KEYS = {
  experiences: "campuslog:v1:experiences",
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

function writeJson(key: string, value: unknown): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
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

function isExperience(value: unknown): value is Experience {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.period === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.achievements === "string" &&
    isStringArray(candidate.relatedLinks) &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    isAnalysisStatus(candidate.analysisStatus)
  );
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
    typeof candidate.purpose === "string" &&
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

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(isExperience);
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

function normalizeLinks(relatedLinksText: string): string[] {
  return relatedLinksText
    .split(/\r?\n/)
    .map((link) => link.trim())
    .filter(Boolean);
}

function normalizeInput(input: ExperienceFormInput) {
  return {
    title: input.title.trim(),
    period: input.period.trim(),
    role: input.role.trim(),
    description: input.description.trim(),
    achievements: input.achievements.trim(),
    relatedLinks: normalizeLinks(input.relatedLinksText),
  };
}

function hasRequiredFields(input: ReturnType<typeof normalizeInput>): boolean {
  return Boolean(input.title && input.period && input.role && input.description);
}

function saveExperiences(experiences: Experience[]): void {
  writeJson(STORAGE_KEYS.experiences, sortByUpdatedDesc(experiences));
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

  const recommendations = readStoredRecommendations().filter(
    (recommendation) => recommendation.recommendedExperienceId !== id,
  );

  saveExperiences(nextExperiences);
  writeJson(STORAGE_KEYS.analyses, analyses);
  writeJson(STORAGE_KEYS.recommendations, recommendations);

  return true;
}

export function getAnalysisByExperienceId(
  experienceId: string,
): ExperienceAnalysis | null {
  return readStoredAnalyses()[experienceId] ?? null;
}

export function saveAnalysisResult(result: ExperienceAnalysis): ExperienceAnalysis {
  const analyses = readStoredAnalyses();
  analyses[result.experienceId] = result;
  writeJson(STORAGE_KEYS.analyses, analyses);

  const experiences = readStoredExperiences();
  saveExperiences(
    experiences.map((experience) =>
      experience.id === result.experienceId
        ? { ...experience, analysisStatus: "analyzed" }
        : experience,
    ),
  );

  return result;
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
