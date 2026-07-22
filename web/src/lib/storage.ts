import { createIsoTimestamp } from "@/lib/date";
import { normalizeExperienceAnalysis } from "@/lib/analysisResult";
import {
  mergeAnswerDraftResults,
  normalizeAnswerDraftResult,
} from "@/lib/answerDraftResult";
import {
  getFollowupStatus,
  normalizeExperienceFollowup,
} from "@/lib/experienceFollowupResult";
import { normalizeRecommendationResult } from "@/lib/recommendationResult";
import {
  normalizeRelatedLinksForStorage,
  parseRelatedLinks,
} from "@/lib/relatedLinks";
import type {
  ActivityStatus,
  ActivitySynthesisStatus,
  AnalysisStatus,
  AnalysisApiResult,
  AnswerDraftResult,
  DailyLog,
  DailyLogInput,
  Experience,
  ExperienceAnalysis,
  ExperienceFollowup,
  ExperienceFormInput,
  ExperienceSynthesisDraft,
  RecommendationResult,
  TrackedActivity,
  TrackedActivityInput,
} from "@/lib/types";

export const STORAGE_KEYS = {
  experiences: "campuslog:v2:experiences",
  legacyExperiences: "campuslog:v1:experiences",
  experienceMigration: "campuslog:v2:experiences:migrated",
  analyses: "campuslog:v1:analyses",
  recommendations: "campuslog:v1:recommendations",
  answerDrafts: "campuslog:v1:answer-drafts",
  experienceFollowups: "campuslog:v1:experience-followups",
  trackedActivities: "campuslog:v1:tracked-activities",
  dailyLogs: "campuslog:v1:daily-logs",
  synthesisDrafts: "campuslog:v1:synthesis-drafts",
} as const;

type StoredAnalyses = Record<string, ExperienceAnalysis>;
type StoredSynthesisDrafts = Record<string, ExperienceSynthesisDraft>;

const blockedStorageKeys = new Set<string>();

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson(key: string): unknown {
  if (!canUseLocalStorage()) {
    return undefined;
  }

  let rawValue: string | null;

  try {
    rawValue = window.localStorage.getItem(key);
  } catch {
    blockedStorageKeys.add(key);
    return undefined;
  }

  if (rawValue === null) {
    blockedStorageKeys.delete(key);
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawValue);
    blockedStorageKeys.delete(key);
    return parsed;
  } catch {
    blockedStorageKeys.add(key);
    return undefined;
  }
}

function writeJson(key: string, value: unknown): boolean {
  if (!canUseLocalStorage() || blockedStorageKeys.has(key)) {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function writeJsonTransaction(
  updates: ReadonlyArray<readonly [key: string, value: unknown]>,
): boolean {
  if (
    !canUseLocalStorage() ||
    updates.some(([key]) => blockedStorageKeys.has(key))
  ) {
    return false;
  }

  let serializedUpdates: Array<readonly [string, string]>;

  try {
    serializedUpdates = updates.map(([key, value]) => {
      const serializedValue = JSON.stringify(value);

      if (typeof serializedValue !== "string") {
        throw new TypeError("Storage values must be JSON serializable.");
      }

      return [key, serializedValue] as const;
    });
  } catch {
    return false;
  }

  const snapshots: Array<readonly [string, string | null]> = [];

  for (const [key] of updates) {
    try {
      snapshots.push([key, window.localStorage.getItem(key)]);
    } catch {
      blockedStorageKeys.add(key);
      return false;
    }
  }

  try {
    serializedUpdates.forEach(([key, value]) => {
      window.localStorage.setItem(key, value);
    });
    return true;
  } catch {
    try {
      snapshots.forEach(([key, value]) => {
        if (value === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, value);
        }
      });
    } catch {
      // Best-effort rollback: callers still receive false and keep their UI state.
    }

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

function isActivityStatus(value: unknown): value is ActivityStatus {
  return value === "planned" || value === "active" || value === "completed";
}

function isActivitySynthesisStatus(
  value: unknown,
): value is ActivitySynthesisStatus {
  return (
    value === "idle" ||
    value === "processing" ||
    value === "draft_ready" ||
    value === "failed" ||
    value === "saved"
  );
}

function isLocalDateString(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day <= daysInMonth[month - 1];
}

function normalizeCompletedDate(value: string): string | null {
  const normalizedValue = value.trim();

  if (isLocalDateString(normalizedValue)) {
    return normalizedValue;
  }

  const isIsoDateTime =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      normalizedValue,
    );

  if (!isIsoDateTime) {
    return null;
  }

  const parsedDate = new Date(normalizedValue);

  return Number.isNaN(parsedDate.getTime())
    ? null
    : getLocalDateString(parsedDate);
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

function parseTrackedActivity(value: unknown): TrackedActivity | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const description =
    typeof candidate.description === "string" &&
    candidate.description.trim().length > 0
      ? candidate.description
      : typeof candidate.role === "string"
        ? candidate.role
        : null;
  const completedAt =
    typeof candidate.completedAt === "string" && candidate.completedAt
      ? normalizeCompletedDate(candidate.completedAt)
      : "";

  if (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof description === "string" &&
    description.trim().length > 0 &&
    isLocalDateString(candidate.startDate) &&
    (candidate.expectedEndDate === "" ||
      (isLocalDateString(candidate.expectedEndDate) &&
        candidate.expectedEndDate >= candidate.startDate)) &&
    isActivityStatus(candidate.status) &&
    completedAt !== null &&
    ((candidate.status === "completed" && completedAt !== "") ||
      (candidate.status !== "completed" && completedAt === "")) &&
    typeof candidate.generatedExperienceId === "string" &&
    isActivitySynthesisStatus(candidate.synthesisStatus) &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  ) {
    return {
      id: candidate.id,
      title: candidate.title,
      description: description.trim(),
      startDate: candidate.startDate,
      expectedEndDate: candidate.expectedEndDate,
      status: candidate.status,
      completedAt,
      generatedExperienceId: candidate.generatedExperienceId,
      synthesisStatus: candidate.synthesisStatus,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    };
  }

  return null;
}

function parseDailyLog(value: unknown): DailyLog | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.id === "string" &&
    typeof candidate.activityId === "string" &&
    isLocalDateString(candidate.date) &&
    typeof candidate.content === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  ) {
    return {
      id: candidate.id,
      activityId: candidate.activityId,
      date: candidate.date,
      content: candidate.content,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    };
  }

  return null;
}

function parseExperienceSynthesisDraft(
  value: unknown,
): ExperienceSynthesisDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.activityId === "string" &&
    typeof candidate.description === "string" &&
    isStringArray(candidate.achievements) &&
    isStringArray(candidate.usedLogIds) &&
    isStringArray(candidate.evidenceGaps) &&
    typeof candidate.generatedAt === "string"
  ) {
    return {
      activityId: candidate.activityId,
      description: candidate.description,
      achievements: candidate.achievements,
      usedLogIds: candidate.usedLogIds,
      evidenceGaps: candidate.evidenceGaps,
      generatedAt: candidate.generatedAt,
    };
  }

  return null;
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
    const analysis = normalizeExperienceAnalysis(value);

    if (analysis) {
      analyses[analysis.experienceId] = analysis;
    }

    return analyses;
  }, {});
}

function readStoredRecommendations(): RecommendationResult[] {
  const parsed = readJson(STORAGE_KEYS.recommendations);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map(normalizeRecommendationResult)
    .filter(
      (recommendation): recommendation is RecommendationResult =>
        recommendation !== null,
    );
}

function readStoredAnswerDrafts(): AnswerDraftResult[] {
  const parsed = readJson(STORAGE_KEYS.answerDrafts);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map(normalizeAnswerDraftResult)
    .filter((draft): draft is AnswerDraftResult => draft !== null);
}

function readStoredExperienceFollowups(): ExperienceFollowup[] {
  const parsed = readJson(STORAGE_KEYS.experienceFollowups);

  if (!Array.isArray(parsed)) {
    return [];
  }

  const experienceIds = new Set(
    readStoredExperiences().map((experience) => experience.id),
  );

  return parsed
    .map(normalizeExperienceFollowup)
    .filter(
      (followup): followup is ExperienceFollowup =>
        followup !== null && experienceIds.has(followup.experienceId),
    );
}

function readStoredTrackedActivities(): TrackedActivity[] {
  const parsed = readJson(STORAGE_KEYS.trackedActivities);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map(parseTrackedActivity)
    .filter((activity): activity is TrackedActivity => activity !== null);
}

function readStoredDailyLogs(): DailyLog[] {
  const parsed = readJson(STORAGE_KEYS.dailyLogs);

  if (!Array.isArray(parsed)) {
    return [];
  }

  const activitiesById = new Map(
    readStoredTrackedActivities().map((activity) => [activity.id, activity]),
  );
  const today = getLocalDateString();

  return parsed
    .map(parseDailyLog)
    .filter((log): log is DailyLog => {
      if (!log) {
        return false;
      }

      const activity = activitiesById.get(log.activityId);

      return Boolean(
        activity &&
          activity.status !== "planned" &&
          log.date >= activity.startDate &&
          log.date <= today,
      );
    });
}

function readStoredSynthesisDrafts(): StoredSynthesisDrafts {
  const parsed = readJson(STORAGE_KEYS.synthesisDrafts);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  const activityIds = new Set(
    readStoredTrackedActivities().map((activity) => activity.id),
  );

  return Object.values(parsed).reduce<StoredSynthesisDrafts>((drafts, value) => {
    const draft = parseExperienceSynthesisDraft(value);

    if (draft && activityIds.has(draft.activityId)) {
      drafts[draft.activityId] = draft;
    }

    return drafts;
  }, {});
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

function sortActivitiesByUpdatedDesc(
  activities: TrackedActivity[],
): TrackedActivity[] {
  return [...activities].sort((a, b) => {
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

function sortDailyLogs(logs: DailyLog[]): DailyLog[] {
  return [...logs].sort((a, b) => {
    const dateComparison = b.date.localeCompare(a.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    const aTime = Date.parse(a.createdAt);
    const bTime = Date.parse(b.createdAt);

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

function normalizeTrackedActivityInput(input: TrackedActivityInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    startDate: input.startDate.trim(),
    expectedEndDate: input.expectedEndDate.trim(),
  };
}

function normalizeDailyLogInput(input: DailyLogInput) {
  return {
    activityId: input.activityId.trim(),
    date: input.date.trim(),
    content: input.content.trim(),
  };
}

function hasRequiredFields(input: ReturnType<typeof normalizeInput>): boolean {
  return Boolean(input.title && input.period && input.role && input.description);
}

function isValidTrackedActivityInput(
  input: ReturnType<typeof normalizeTrackedActivityInput>,
): boolean {
  return Boolean(
    input.title &&
      input.description &&
      isLocalDateString(input.startDate) &&
      (input.expectedEndDate === "" ||
        (isLocalDateString(input.expectedEndDate) &&
          input.expectedEndDate >= input.startDate)),
  );
}

function isValidDailyLogInput(
  input: ReturnType<typeof normalizeDailyLogInput>,
): boolean {
  return Boolean(
    input.activityId && input.content && isLocalDateString(input.date),
  );
}

function canWriteDailyLogForActivity(
  activity: TrackedActivity,
  date: string,
): boolean {
  if (date < activity.startDate || date > getLocalDateString()) {
    return false;
  }

  if (activity.status === "planned") {
    return false;
  }

  if (activity.status === "completed") {
    if (date >= getLocalDateString()) {
      return false;
    }

    const completedDate = activity.completedAt
      ? normalizeCompletedDate(activity.completedAt)
      : activity.expectedEndDate;

    return completedDate !== null && completedDate !== "" && date <= completedDate;
  }

  return !activity.expectedEndDate || date <= activity.expectedEndDate;
}

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function saveExperiences(experiences: Experience[]): boolean {
  return writeJsonTransaction([
    [STORAGE_KEYS.experiences, sortByUpdatedDesc(experiences)],
    [STORAGE_KEYS.experienceMigration, true],
  ]);
}

function saveTrackedActivities(activities: TrackedActivity[]): boolean {
  return writeJson(
    STORAGE_KEYS.trackedActivities,
    sortActivitiesByUpdatedDesc(activities),
  );
}

function invalidateSynthesisForActivities(
  activities: TrackedActivity[],
  drafts: StoredSynthesisDrafts,
  activityIds: Iterable<string>,
  timestamp: string,
): {
  activities: TrackedActivity[];
  drafts: StoredSynthesisDrafts;
} {
  const invalidatedIds = new Set(activityIds);
  const nextDrafts = { ...drafts };

  invalidatedIds.forEach((activityId) => {
    delete nextDrafts[activityId];
  });

  return {
    activities: activities.map((activity) =>
      invalidatedIds.has(activity.id) && !activity.generatedExperienceId
        ? {
            ...activity,
            synthesisStatus: "idle",
            updatedAt: timestamp,
          }
        : activity,
    ),
    drafts: nextDrafts,
  };
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

  return saveExperiences([experience, ...readStoredExperiences()])
    ? experience
    : null;
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

  const didSave = saveExperiences(
    experiences.map((experience) =>
      experience.id === id ? updatedExperience : experience,
    ),
  );

  return didSave ? updatedExperience : null;
}

export function deleteExperience(id: string): boolean {
  const experiences = readStoredExperiences();
  const nextExperiences = experiences.filter((experience) => experience.id !== id);

  if (nextExperiences.length === experiences.length) {
    return false;
  }

  const analyses = readStoredAnalyses();
  delete analyses[id];
  const nextRecommendations = readStoredRecommendations().filter(
    (recommendation) =>
      recommendation.recommendedExperienceId !== id &&
      !recommendation.matches.some((match) => match.experienceId === id),
  );
  const nextRecommendationIds = new Set(
    nextRecommendations.map((recommendation) => recommendation.id),
  );
  const nextAnswerDrafts = readStoredAnswerDrafts().filter(
    (draft) =>
      draft.experienceId !== id &&
      nextRecommendationIds.has(draft.recommendationId),
  );
  const nextFollowups = readStoredExperienceFollowups().filter(
    (followup) => followup.experienceId !== id,
  );
  const timestamp = createIsoTimestamp();
  const nextActivities = readStoredTrackedActivities().map((activity) =>
    activity.generatedExperienceId === id
      ? {
          ...activity,
          generatedExperienceId: "",
          synthesisStatus: "failed" as const,
          updatedAt: timestamp,
        }
      : activity,
  );

  return writeJsonTransaction([
    [STORAGE_KEYS.experiences, sortByUpdatedDesc(nextExperiences)],
    [STORAGE_KEYS.experienceMigration, true],
    [STORAGE_KEYS.analyses, analyses],
    [STORAGE_KEYS.recommendations, nextRecommendations],
    [STORAGE_KEYS.answerDrafts, nextAnswerDrafts],
    [STORAGE_KEYS.experienceFollowups, nextFollowups],
    [STORAGE_KEYS.trackedActivities, sortActivitiesByUpdatedDesc(nextActivities)],
  ]);
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
  const nextExperiences = experiences.map((experience) =>
    experience.id === result.experienceId
      ? ({ ...experience, analysisStatus: "analyzed" } satisfies Experience)
      : experience,
  );

  return writeJsonTransaction([
    [STORAGE_KEYS.analyses, analyses],
    [STORAGE_KEYS.experiences, sortByUpdatedDesc(nextExperiences)],
    [STORAGE_KEYS.experienceMigration, true],
  ])
    ? analysis
    : null;
}

export function getRecommendationResults(): RecommendationResult[] {
  return readStoredRecommendations();
}

export function saveRecommendationResult(
  result: RecommendationResult,
): RecommendationResult | null {
  const recommendations = readStoredRecommendations().filter(
    (recommendation) => recommendation.id !== result.id,
  );

  return writeJson(STORAGE_KEYS.recommendations, [result, ...recommendations])
    ? result
    : null;
}

export function getAnswerDraftResult(
  recommendationId: string,
  experienceId: string,
): AnswerDraftResult | null {
  return (
    readStoredAnswerDrafts().find(
      (draft) =>
        draft.recommendationId === recommendationId &&
        draft.experienceId === experienceId,
    ) ?? null
  );
}

export function getAnswerDraftResultsByRecommendationId(
  recommendationId: string,
): AnswerDraftResult[] {
  return readStoredAnswerDrafts().filter(
    (draft) => draft.recommendationId === recommendationId,
  );
}

export function saveAnswerDraftResult(
  result: AnswerDraftResult,
): AnswerDraftResult | null {
  const recommendations = readStoredRecommendations();
  const recommendation = recommendations.find(
    (item) => item.id === result.recommendationId,
  );
  const experience = readStoredExperiences().find(
    (item) => item.id === result.experienceId,
  );

  if (
    !recommendation ||
    !experience ||
    !recommendation.matches.some(
      (match) => match.experienceId === result.experienceId,
    )
  ) {
    return null;
  }

  const storedAnswerDrafts = readStoredAnswerDrafts();
  const existingAnswerDraft =
    storedAnswerDrafts.find(
      (draft) =>
        draft.recommendationId === result.recommendationId &&
        draft.experienceId === result.experienceId,
    ) ?? null;
  const nextAnswerDraft = mergeAnswerDraftResults(existingAnswerDraft, result);
  const answerDrafts = storedAnswerDrafts.filter(
    (draft) =>
      draft.recommendationId !== result.recommendationId ||
      draft.experienceId !== result.experienceId,
  );

  return writeJson(STORAGE_KEYS.answerDrafts, [nextAnswerDraft, ...answerDrafts])
    ? nextAnswerDraft
    : null;
}

export function deleteRecommendationsByExperienceId(
  experienceId: string,
): void {
  const recommendations = readStoredRecommendations().filter(
    (recommendation) =>
      recommendation.recommendedExperienceId !== experienceId &&
      !recommendation.matches.some(
        (match) => match.experienceId === experienceId,
      ),
  );
  const recommendationIds = new Set(
    recommendations.map((recommendation) => recommendation.id),
  );
  const answerDrafts = readStoredAnswerDrafts().filter(
    (draft) =>
      draft.experienceId !== experienceId &&
      recommendationIds.has(draft.recommendationId),
  );

  writeJsonTransaction([
    [STORAGE_KEYS.recommendations, recommendations],
    [STORAGE_KEYS.answerDrafts, answerDrafts],
  ]);
}

export function getExperienceFollowups(
  experienceId: string,
): ExperienceFollowup[] {
  return readStoredExperienceFollowups()
    .filter((followup) => followup.experienceId === experienceId)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function saveExperienceFollowup(
  followup: ExperienceFollowup,
): ExperienceFollowup | null {
  const normalizedFollowup = normalizeExperienceFollowup(followup);

  if (!normalizedFollowup) {
    return null;
  }

  const experience = readStoredExperiences().find(
    (item) => item.id === normalizedFollowup.experienceId,
  );

  if (!experience) {
    return null;
  }

  const followups = readStoredExperienceFollowups().filter(
    (item) => item.id !== normalizedFollowup.id,
  );

  return writeJson(STORAGE_KEYS.experienceFollowups, [
    normalizedFollowup,
    ...followups,
  ])
    ? normalizedFollowup
    : null;
}

export function answerExperienceFollowupQuestion(
  followupId: string,
  questionId: string,
  answer: string,
): ExperienceFollowup | null {
  const normalizedAnswer = answer.trim();

  if (!normalizedAnswer) {
    return null;
  }

  const followups = readStoredExperienceFollowups();
  const currentFollowup = followups.find((followup) => followup.id === followupId);

  if (
    !currentFollowup ||
    currentFollowup.status === "dismissed" ||
    !currentFollowup.questions.some((question) => question.id === questionId)
  ) {
    return null;
  }

  const timestamp = createIsoTimestamp();
  const existingAnswer = currentFollowup.answers.find(
    (item) => item.questionId === questionId,
  );
  const nextAnswers = [
    ...currentFollowup.answers.filter((item) => item.questionId !== questionId),
    {
      questionId,
      answer: normalizedAnswer,
      createdAt: existingAnswer?.createdAt ?? timestamp,
      updatedAt: timestamp,
    },
  ];
  const updatedFollowup: ExperienceFollowup = {
    ...currentFollowup,
    answers: nextAnswers,
    status: getFollowupStatus(currentFollowup.questions, nextAnswers, "open"),
    updatedAt: timestamp,
  };
  const experiences = readStoredExperiences();
  const analyses = readStoredAnalyses();
  const nextExperiences = experiences.map((experience) => {
    if (experience.id !== currentFollowup.experienceId) {
      return experience;
    }

    const hasExistingAnalysis =
      Boolean(analyses[experience.id]) ||
      experience.analysisStatus === "analyzed" ||
      experience.analysisStatus === "needs_reanalysis";

    return hasExistingAnalysis
      ? {
          ...experience,
          analysisStatus: "needs_reanalysis" as const,
        }
      : experience;
  });
  const nextFollowups = followups.map((followup) =>
    followup.id === currentFollowup.id ? updatedFollowup : followup,
  );

  return writeJsonTransaction([
    [STORAGE_KEYS.experienceFollowups, nextFollowups],
    [STORAGE_KEYS.experiences, sortByUpdatedDesc(nextExperiences)],
    [STORAGE_KEYS.experienceMigration, true],
  ])
    ? updatedFollowup
    : null;
}

export function dismissExperienceFollowup(
  followupId: string,
): ExperienceFollowup | null {
  const followups = readStoredExperienceFollowups();
  const currentFollowup = followups.find((followup) => followup.id === followupId);

  if (!currentFollowup) {
    return null;
  }

  const updatedFollowup: ExperienceFollowup = {
    ...currentFollowup,
    status: "dismissed",
    updatedAt: createIsoTimestamp(),
  };

  return writeJson(
    STORAGE_KEYS.experienceFollowups,
    followups.map((followup) =>
      followup.id === followupId ? updatedFollowup : followup,
    ),
  )
    ? updatedFollowup
    : null;
}

export function restoreExperienceFollowup(
  followupId: string,
): ExperienceFollowup | null {
  const followups = readStoredExperienceFollowups();
  const currentFollowup = followups.find((followup) => followup.id === followupId);

  if (!currentFollowup) {
    return null;
  }

  const updatedFollowup: ExperienceFollowup = {
    ...currentFollowup,
    status: getFollowupStatus(
      currentFollowup.questions,
      currentFollowup.answers,
      "open",
    ),
    updatedAt: createIsoTimestamp(),
  };

  return writeJson(
    STORAGE_KEYS.experienceFollowups,
    followups.map((followup) =>
      followup.id === followupId ? updatedFollowup : followup,
    ),
  )
    ? updatedFollowup
    : null;
}

export function getTrackedActivities(): TrackedActivity[] {
  return sortActivitiesByUpdatedDesc(readStoredTrackedActivities());
}

export function getTrackedActivityById(id: string): TrackedActivity | null {
  return (
    readStoredTrackedActivities().find((activity) => activity.id === id) ?? null
  );
}

export function createTrackedActivity(
  input: TrackedActivityInput,
): TrackedActivity | null {
  const normalizedInput = normalizeTrackedActivityInput(input);

  if (!isValidTrackedActivityInput(normalizedInput)) {
    return null;
  }

  const timestamp = createIsoTimestamp();
  const today = getLocalDateString();
  const isPastEndedActivity =
    normalizedInput.expectedEndDate !== "" && normalizedInput.expectedEndDate < today;
  const status: ActivityStatus = isPastEndedActivity
    ? "completed"
    : normalizedInput.startDate > today
      ? "planned"
      : "active";
  const activity: TrackedActivity = {
    id: createId("activity"),
    ...normalizedInput,
    status,
    completedAt: isPastEndedActivity ? normalizedInput.expectedEndDate : "",
    generatedExperienceId: "",
    synthesisStatus: "idle",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return saveTrackedActivities([activity, ...readStoredTrackedActivities()])
    ? activity
    : null;
}

export function updateTrackedActivity(
  id: string,
  input: TrackedActivityInput,
): TrackedActivity | null {
  const normalizedInput = normalizeTrackedActivityInput(input);

  if (!isValidTrackedActivityInput(normalizedInput)) {
    return null;
  }

  const activities = readStoredTrackedActivities();
  const currentActivity = activities.find((activity) => activity.id === id);

  if (!currentActivity) {
    return null;
  }

  const activityLogs = readStoredDailyLogs().filter(
    (log) => log.activityId === currentActivity.id,
  );

  if (
    activityLogs.some((log) => log.date < normalizedInput.startDate) ||
    (currentActivity.status === "completed" &&
      (!normalizedInput.expectedEndDate ||
        activityLogs.some((log) => log.date > normalizedInput.expectedEndDate))) ||
    (currentActivity.status === "active" &&
      normalizedInput.startDate > getLocalDateString()) ||
    (currentActivity.status === "completed" &&
      normalizedInput.expectedEndDate < normalizedInput.startDate)
  ) {
    return null;
  }

  const hasMetadataChange =
    currentActivity.title !== normalizedInput.title ||
    currentActivity.description !== normalizedInput.description ||
    currentActivity.startDate !== normalizedInput.startDate ||
    currentActivity.expectedEndDate !== normalizedInput.expectedEndDate ||
    (currentActivity.status === "completed" &&
      currentActivity.completedAt !== normalizedInput.expectedEndDate);

  if (!hasMetadataChange) {
    return currentActivity;
  }

  const timestamp = createIsoTimestamp();
  const updatedActivity: TrackedActivity = {
    ...currentActivity,
    ...normalizedInput,
    completedAt:
      currentActivity.status === "completed"
        ? normalizedInput.expectedEndDate
        : currentActivity.completedAt,
    updatedAt: timestamp,
  };
  const nextActivities = activities.map((activity) =>
    activity.id === id ? updatedActivity : activity,
  );
  const shouldInvalidateSynthesis =
    !currentActivity.generatedExperienceId &&
    (currentActivity.status === "active" ||
      currentActivity.status === "completed");

  if (!shouldInvalidateSynthesis) {
    return saveTrackedActivities(nextActivities) ? updatedActivity : null;
  }

  const invalidatedState = invalidateSynthesisForActivities(
    nextActivities,
    readStoredSynthesisDrafts(),
    [id],
    timestamp,
  );
  const didSave = writeJsonTransaction([
    [
      STORAGE_KEYS.trackedActivities,
      sortActivitiesByUpdatedDesc(invalidatedState.activities),
    ],
    [STORAGE_KEYS.synthesisDrafts, invalidatedState.drafts],
  ]);

  return didSave
    ? (invalidatedState.activities.find((activity) => activity.id === id) ??
        null)
    : null;
}

export function setTrackedActivityStatus(
  id: string,
  status: ActivityStatus,
  completedAt?: string,
): TrackedActivity | null {
  if (!isActivityStatus(status)) {
    return null;
  }

  const activities = readStoredTrackedActivities();
  const currentActivity = activities.find((activity) => activity.id === id);

  if (!currentActivity) {
    return null;
  }

  if (currentActivity.status === status) {
    return currentActivity;
  }

  const isAllowedTransition =
    (currentActivity.status === "planned" && status === "active") ||
    (currentActivity.status === "active" && status === "completed") ||
    (currentActivity.status === "completed" && status === "active");

  if (!isAllowedTransition) {
    return null;
  }

  if (
    currentActivity.status === "planned" &&
    status === "active" &&
    currentActivity.startDate > getLocalDateString()
  ) {
    return null;
  }

  const timestamp = createIsoTimestamp();
  const normalizedCompletedAt =
    status === "completed"
      ? normalizeCompletedDate(completedAt?.trim() || getLocalDateString())
      : "";

  if (
    status === "completed" &&
    (!normalizedCompletedAt ||
      normalizedCompletedAt < currentActivity.startDate)
  ) {
    return null;
  }

  const updatedActivity: TrackedActivity = {
    ...currentActivity,
    status,
    completedAt: normalizedCompletedAt ?? "",
    generatedExperienceId:
      currentActivity.status === "completed" && status === "active"
        ? ""
        : currentActivity.generatedExperienceId,
    synthesisStatus:
      currentActivity.status === "completed" && status === "active"
        ? "idle"
        : currentActivity.synthesisStatus,
    updatedAt: timestamp,
  };
  const nextActivities = activities.map((activity) =>
    activity.id === id ? updatedActivity : activity,
  );

  if (currentActivity.status !== "completed" || status !== "active") {
    return saveTrackedActivities(nextActivities) ? updatedActivity : null;
  }

  const drafts = readStoredSynthesisDrafts();
  delete drafts[id];

  return writeJsonTransaction([
    [STORAGE_KEYS.trackedActivities, sortActivitiesByUpdatedDesc(nextActivities)],
    [STORAGE_KEYS.synthesisDrafts, drafts],
  ])
    ? updatedActivity
    : null;
}

export function setActivitySynthesisStatus(
  id: string,
  status: ActivitySynthesisStatus,
): TrackedActivity | null {
  if (!isActivitySynthesisStatus(status)) {
    return null;
  }

  const activities = readStoredTrackedActivities();
  const currentActivity = activities.find((activity) => activity.id === id);

  if (!currentActivity) {
    return null;
  }

  const updatedActivity: TrackedActivity = {
    ...currentActivity,
    synthesisStatus: status,
    updatedAt: createIsoTimestamp(),
  };

  return saveTrackedActivities(
    activities.map((activity) =>
      activity.id === id ? updatedActivity : activity,
    ),
  )
    ? updatedActivity
    : null;
}

export function linkGeneratedExperience(
  activityId: string,
  experienceId: string,
): TrackedActivity | null {
  const normalizedExperienceId = experienceId.trim();

  if (!normalizedExperienceId) {
    return null;
  }

  const activities = readStoredTrackedActivities();
  const currentActivity = activities.find(
    (activity) => activity.id === activityId,
  );

  if (!currentActivity || currentActivity.status !== "completed") {
    return null;
  }

  if (currentActivity.generatedExperienceId) {
    return currentActivity.generatedExperienceId === normalizedExperienceId &&
      readStoredExperiences().some(
        (experience) => experience.id === normalizedExperienceId,
      )
      ? currentActivity
      : null;
  }

  if (
    !readStoredExperiences().some(
      (experience) => experience.id === normalizedExperienceId,
    )
  ) {
    return null;
  }

  const updatedActivity: TrackedActivity = {
    ...currentActivity,
    generatedExperienceId: normalizedExperienceId,
    synthesisStatus: "saved",
    updatedAt: createIsoTimestamp(),
  };

  return saveTrackedActivities(
    activities.map((activity) =>
      activity.id === activityId ? updatedActivity : activity,
    ),
  )
    ? updatedActivity
    : null;
}

export function createExperienceFromActivity(
  activityId: string,
  input: ExperienceFormInput,
): Experience | null {
  const activities = readStoredTrackedActivities();
  const currentActivity = activities.find(
    (activity) => activity.id === activityId,
  );

  if (!currentActivity || currentActivity.status !== "completed") {
    return null;
  }

  const experiences = readStoredExperiences();

  if (currentActivity.generatedExperienceId) {
    const existingExperience = experiences.find(
      (experience) =>
        experience.id === currentActivity.generatedExperienceId,
    );

    if (existingExperience) {
      return existingExperience;
    }
  }

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
  const linkedActivity: TrackedActivity = {
    ...currentActivity,
    generatedExperienceId: experience.id,
    synthesisStatus: "saved",
    updatedAt: timestamp,
  };
  const nextActivities = activities.map((activity) =>
    activity.id === activityId ? linkedActivity : activity,
  );

  return writeJsonTransaction([
    [STORAGE_KEYS.experiences, sortByUpdatedDesc([experience, ...experiences])],
    [STORAGE_KEYS.experienceMigration, true],
    [STORAGE_KEYS.trackedActivities, sortActivitiesByUpdatedDesc(nextActivities)],
  ])
    ? experience
    : null;
}

export function deleteTrackedActivity(id: string): boolean {
  const activities = readStoredTrackedActivities();
  const activityToDelete = activities.find((activity) => activity.id === id);

  if (!activityToDelete) {
    return false;
  }

  const nextActivities = activities.filter((activity) => activity.id !== id);
  const nextLogs = readStoredDailyLogs().filter((log) => log.activityId !== id);
  const nextDrafts = readStoredSynthesisDrafts();
  const generatedExperienceId = activityToDelete.generatedExperienceId;
  delete nextDrafts[id];

  if (!generatedExperienceId) {
    return writeJsonTransaction([
      [STORAGE_KEYS.trackedActivities, sortActivitiesByUpdatedDesc(nextActivities)],
      [STORAGE_KEYS.dailyLogs, sortDailyLogs(nextLogs)],
      [STORAGE_KEYS.synthesisDrafts, nextDrafts],
    ]);
  }

  const analyses = readStoredAnalyses();
  delete analyses[generatedExperienceId];
  const nextExperiences = readStoredExperiences().filter(
    (experience) => experience.id !== generatedExperienceId,
  );
  const nextRecommendations = readStoredRecommendations().filter(
    (recommendation) =>
      recommendation.recommendedExperienceId !== generatedExperienceId &&
      !recommendation.matches.some(
        (match) => match.experienceId === generatedExperienceId,
      ),
  );
  const nextRecommendationIds = new Set(
    nextRecommendations.map((recommendation) => recommendation.id),
  );
  const nextAnswerDrafts = readStoredAnswerDrafts().filter(
    (draft) =>
      draft.experienceId !== generatedExperienceId &&
      nextRecommendationIds.has(draft.recommendationId),
  );
  const nextFollowups = readStoredExperienceFollowups().filter(
    (followup) => followup.experienceId !== generatedExperienceId,
  );

  return writeJsonTransaction([
    [STORAGE_KEYS.experiences, sortByUpdatedDesc(nextExperiences)],
    [STORAGE_KEYS.experienceMigration, true],
    [STORAGE_KEYS.analyses, analyses],
    [STORAGE_KEYS.recommendations, nextRecommendations],
    [STORAGE_KEYS.answerDrafts, nextAnswerDrafts],
    [STORAGE_KEYS.experienceFollowups, nextFollowups],
    [STORAGE_KEYS.trackedActivities, sortActivitiesByUpdatedDesc(nextActivities)],
    [STORAGE_KEYS.dailyLogs, sortDailyLogs(nextLogs)],
    [STORAGE_KEYS.synthesisDrafts, nextDrafts],
  ]);
}

export function getDailyLogs(): DailyLog[] {
  return sortDailyLogs(readStoredDailyLogs());
}

export function getDailyLogsByActivityId(activityId: string): DailyLog[] {
  return sortDailyLogs(
    readStoredDailyLogs().filter((log) => log.activityId === activityId),
  );
}

export function getDailyLogsByDate(date: string): DailyLog[] {
  if (!isLocalDateString(date)) {
    return [];
  }

  return sortDailyLogs(readStoredDailyLogs().filter((log) => log.date === date));
}

export function createDailyLog(input: DailyLogInput): DailyLog | null {
  const normalizedInput = normalizeDailyLogInput(input);

  if (!isValidDailyLogInput(normalizedInput)) {
    return null;
  }

  const activities = readStoredTrackedActivities();
  const activity = activities.find(
    (candidate) => candidate.id === normalizedInput.activityId,
  );

  if (!activity || !canWriteDailyLogForActivity(activity, normalizedInput.date)) {
    return null;
  }

  const timestamp = createIsoTimestamp();
  const dailyLog: DailyLog = {
    id: createId("daily-log"),
    ...normalizedInput,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const nextLogs = [dailyLog, ...readStoredDailyLogs()];
  const invalidatedState = invalidateSynthesisForActivities(
    activities,
    readStoredSynthesisDrafts(),
    [activity.id],
    timestamp,
  );

  return writeJsonTransaction([
    [STORAGE_KEYS.dailyLogs, sortDailyLogs(nextLogs)],
    [
      STORAGE_KEYS.trackedActivities,
      sortActivitiesByUpdatedDesc(invalidatedState.activities),
    ],
    [STORAGE_KEYS.synthesisDrafts, invalidatedState.drafts],
  ])
    ? dailyLog
    : null;
}

export function updateDailyLog(
  id: string,
  input: DailyLogInput,
): DailyLog | null {
  const normalizedInput = normalizeDailyLogInput(input);

  if (!isValidDailyLogInput(normalizedInput)) {
    return null;
  }

  const logs = readStoredDailyLogs();
  const currentLog = logs.find((log) => log.id === id);

  if (!currentLog) {
    return null;
  }

  const activities = readStoredTrackedActivities();
  const sourceActivity = activities.find(
    (activity) => activity.id === currentLog.activityId,
  );
  const targetActivity = activities.find(
    (activity) => activity.id === normalizedInput.activityId,
  );

  if (
    !sourceActivity ||
    !canWriteDailyLogForActivity(sourceActivity, currentLog.date) ||
    !targetActivity ||
    !canWriteDailyLogForActivity(targetActivity, normalizedInput.date)
  ) {
    return null;
  }

  const hasChange =
    currentLog.activityId !== normalizedInput.activityId ||
    currentLog.date !== normalizedInput.date ||
    currentLog.content !== normalizedInput.content;

  if (!hasChange) {
    return currentLog;
  }

  const timestamp = createIsoTimestamp();
  const updatedLog: DailyLog = {
    ...currentLog,
    ...normalizedInput,
    updatedAt: timestamp,
  };
  const nextLogs = logs.map((log) => (log.id === id ? updatedLog : log));
  const invalidatedState = invalidateSynthesisForActivities(
    activities,
    readStoredSynthesisDrafts(),
    [sourceActivity.id, targetActivity.id],
    timestamp,
  );

  return writeJsonTransaction([
    [STORAGE_KEYS.dailyLogs, sortDailyLogs(nextLogs)],
    [
      STORAGE_KEYS.trackedActivities,
      sortActivitiesByUpdatedDesc(invalidatedState.activities),
    ],
    [STORAGE_KEYS.synthesisDrafts, invalidatedState.drafts],
  ])
    ? updatedLog
    : null;
}

export function deleteDailyLog(id: string): boolean {
  const logs = readStoredDailyLogs();
  const currentLog = logs.find((log) => log.id === id);

  if (!currentLog) {
    return false;
  }

  const activities = readStoredTrackedActivities();
  const activity = activities.find(
    (candidate) => candidate.id === currentLog.activityId,
  );

  if (!activity || !canWriteDailyLogForActivity(activity, currentLog.date)) {
    return false;
  }

  const timestamp = createIsoTimestamp();
  const invalidatedState = invalidateSynthesisForActivities(
    activities,
    readStoredSynthesisDrafts(),
    [activity.id],
    timestamp,
  );

  return writeJsonTransaction([
    [STORAGE_KEYS.dailyLogs, sortDailyLogs(logs.filter((log) => log.id !== id))],
    [
      STORAGE_KEYS.trackedActivities,
      sortActivitiesByUpdatedDesc(invalidatedState.activities),
    ],
    [STORAGE_KEYS.synthesisDrafts, invalidatedState.drafts],
  ]);
}

export function getSynthesisDraftByActivityId(
  activityId: string,
): ExperienceSynthesisDraft | null {
  return readStoredSynthesisDrafts()[activityId] ?? null;
}

export function saveSynthesisDraft(
  draft: ExperienceSynthesisDraft,
): ExperienceSynthesisDraft | null {
  const parsedDraft = parseExperienceSynthesisDraft(draft);
  const activity = parsedDraft
    ? readStoredTrackedActivities().find(
        (candidate) => candidate.id === parsedDraft.activityId,
      )
    : null;

  if (
    !parsedDraft ||
    !activity ||
    activity.status !== "completed" ||
    Boolean(activity.generatedExperienceId)
  ) {
    return null;
  }

  const activityLogIds = new Set(
    readStoredDailyLogs()
      .filter((log) => log.activityId === parsedDraft.activityId)
      .map((log) => log.id),
  );

  if (parsedDraft.usedLogIds.some((logId) => !activityLogIds.has(logId))) {
    return null;
  }

  const drafts = readStoredSynthesisDrafts();
  drafts[parsedDraft.activityId] = parsedDraft;

  return writeJson(STORAGE_KEYS.synthesisDrafts, drafts) ? parsedDraft : null;
}

export function deleteSynthesisDraft(activityId: string): boolean {
  const drafts = readStoredSynthesisDrafts();

  if (!drafts[activityId]) {
    return false;
  }

  delete drafts[activityId];
  return writeJson(STORAGE_KEYS.synthesisDrafts, drafts);
}
