import { createIsoTimestamp } from "@/lib/date";
import {
  normalizeRelatedLinksForStorage,
  parseRelatedLinks,
} from "@/lib/relatedLinks";
import type {
  ActivityStatus,
  ActivitySynthesisStatus,
  AnalysisStatus,
  AnalysisApiResult,
  DailyLog,
  DailyLogInput,
  Experience,
  ExperienceAnalysis,
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
  return (
    activity.status === "active" &&
    date >= activity.startDate &&
    date <= getLocalDateString()
  );
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
    (recommendation) => recommendation.recommendedExperienceId !== id,
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

export function deleteRecommendationsByExperienceId(
  experienceId: string,
): void {
  const recommendations = readStoredRecommendations().filter(
    (recommendation) =>
      recommendation.recommendedExperienceId !== experienceId,
  );

  writeJson(STORAGE_KEYS.recommendations, recommendations);
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
  const activity: TrackedActivity = {
    id: createId("activity"),
    ...normalizedInput,
    status:
      normalizedInput.startDate > getLocalDateString() ? "planned" : "active",
    completedAt: "",
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
    (currentActivity.status === "active" &&
      normalizedInput.startDate > getLocalDateString()) ||
    (currentActivity.status === "completed" &&
      currentActivity.completedAt < normalizedInput.startDate)
  ) {
    return null;
  }

  const hasMetadataChange =
    currentActivity.title !== normalizedInput.title ||
    currentActivity.description !== normalizedInput.description ||
    currentActivity.startDate !== normalizedInput.startDate ||
    currentActivity.expectedEndDate !== normalizedInput.expectedEndDate;

  if (!hasMetadataChange) {
    return currentActivity;
  }

  const timestamp = createIsoTimestamp();
  const updatedActivity: TrackedActivity = {
    ...currentActivity,
    ...normalizedInput,
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

  if (
    currentActivity.status === "completed" &&
    status === "active" &&
    currentActivity.generatedExperienceId
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
      normalizedCompletedAt < currentActivity.startDate ||
      normalizedCompletedAt > getLocalDateString())
  ) {
    return null;
  }

  const updatedActivity: TrackedActivity = {
    ...currentActivity,
    status,
    completedAt: normalizedCompletedAt ?? "",
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

  if (!activities.some((activity) => activity.id === id)) {
    return false;
  }

  const nextActivities = activities.filter((activity) => activity.id !== id);
  const nextLogs = readStoredDailyLogs().filter((log) => log.activityId !== id);
  const nextDrafts = readStoredSynthesisDrafts();
  delete nextDrafts[id];

  return writeJsonTransaction([
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
    sourceActivity.status !== "active" ||
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

  if (!activity || activity.status !== "active") {
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
