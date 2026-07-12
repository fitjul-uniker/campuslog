export type AnalysisStatus = "unanalyzed" | "analyzed" | "needs_reanalysis";

export type RecommendationPurpose =
  | "cover_letter"
  | "portfolio"
  | "interview"
  | "activity_application"
  | "other";

export type SortOption = "updated_desc" | "created_asc" | "period_desc";

export type FilterOption =
  | "all"
  | "unanalyzed"
  | "analyzed"
  | "needs_reanalysis"
  | string;

export type RelatedLink = {
  url: string;
  description: string;
};

export type Experience = {
  id: string;
  title: string;
  period: string;
  role: string;
  description: string;
  achievements: string;
  relatedLinks: RelatedLink[];
  createdAt: string;
  updatedAt: string;
  analysisStatus: AnalysisStatus;
};

export type ExperienceFormInput = {
  title: string;
  period: string;
  role: string;
  description: string;
  achievements: string;
  relatedLinks: RelatedLink[];
};

export type ActivityStatus = "planned" | "active" | "completed";

export type ActivitySynthesisStatus =
  | "idle"
  | "processing"
  | "draft_ready"
  | "failed"
  | "saved";

export type TrackedActivity = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  expectedEndDate: string;
  status: ActivityStatus;
  /** Empty until completion; stored as the browser-local YYYY-MM-DD date. */
  completedAt: string;
  generatedExperienceId: string;
  synthesisStatus: ActivitySynthesisStatus;
  createdAt: string;
  updatedAt: string;
};

export type TrackedActivityInput = Pick<
  TrackedActivity,
  "title" | "description" | "startDate" | "expectedEndDate"
>;

export type DailyLog = {
  id: string;
  activityId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyLogInput = Pick<
  DailyLog,
  "activityId" | "date" | "content"
>;

export type ActivitySynthesisApiResult = {
  description: string;
  achievements: string[];
  usedLogIds: string[];
  evidenceGaps: string[];
};

export type ExperienceSynthesisDraft = ActivitySynthesisApiResult & {
  activityId: string;
  generatedAt: string;
};

export type ExperienceAnalysis = {
  id: string;
  experienceId: string;
  summary: string;
  competencyTags: string[];
  achievements: string[];
  keywords: string[];
  generatedAt: string;
  sourceExperienceUpdatedAt: string;
};

export type AnalysisApiResult = Pick<
  ExperienceAnalysis,
  "experienceId" | "summary" | "competencyTags" | "achievements" | "keywords"
>;

export type AnalyzeRequest = {
  experience: Experience;
};

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "INSUFFICIENT_INPUT"
  | "OPENAI_API_ERROR"
  | "MISSING_API_KEY"
  | "UNKNOWN_ERROR";

export type ApiErrorResponse = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type AnalyzeResponse =
  | {
      ok: true;
      analysis: AnalysisApiResult;
    }
  | ApiErrorResponse;

export type SynthesizeActivityRequest = {
  activity: TrackedActivity;
  dailyLogs: DailyLog[];
};

export type SynthesizeActivityResponse =
  | {
      ok: true;
      synthesis: ActivitySynthesisApiResult;
    }
  | ApiErrorResponse;

export type RecommendationResult = {
  id: string;
  purpose: RecommendationPurpose;
  prompt: string;
  recommendedExperienceId: string;
  recommendedExperienceTitle: string;
  reason: string;
  relatedTags: string[];
  highlightedAchievement: string;
  usageDirection: string;
  draftSentence: string;
  generatedAt: string;
};

export type RecommendationApiResult = Omit<
  RecommendationResult,
  "id" | "generatedAt" | "purpose" | "prompt"
>;

export type RecommendRequest = {
  purpose: RecommendationPurpose;
  prompt: string;
  experiences: Experience[];
  analyses: ExperienceAnalysis[];
};

export type RecommendResponse =
  | {
      ok: true;
      recommendation: RecommendationApiResult;
    }
  | ApiErrorResponse;
