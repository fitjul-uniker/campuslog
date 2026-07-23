export type AnalysisStatus = "unanalyzed" | "analyzed" | "needs_reanalysis";

export type RecommendationPurpose =
  | "cover_letter"
  | "interview"
  | "jd"
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

export type ExperienceAnalysisSchemaVersion = "v1" | "v2";

export type ExperienceAnalysisStar = {
  situation: string;
  task: string;
  action: string;
  result: string;
};

export type ExperienceAnalysisEvidenceSource =
  | "title"
  | "period"
  | "role"
  | "description"
  | "achievements"
  | "relatedLinks"
  | "followupAnswers";

export type ExperienceAnalysisEvidence = {
  source: ExperienceAnalysisEvidenceSource;
  quote: string;
  note: string;
};

export type ExperienceAnalysisEvidenceGap = {
  id: string;
  category: string;
  title: string;
  topic: string;
  reason: string;
  question: string;
  answer: string;
  answeredAt?: string;
  updatedAt?: string;
};

export type ExperienceAnalysisCoverLetterAngle = {
  title: string;
  angle: string;
  supportingEvidence: string[];
  caution: string;
};

export type ExperienceAnalysisCompetencyEvidence = {
  competency: string;
  evidence: string[];
  explanation: string;
};

export type ExperienceAnalysis = {
  id: string;
  experienceId: string;
  schemaVersion: ExperienceAnalysisSchemaVersion;
  promptVersion: string;
  model: string;
  summary: string;
  competencyTags: string[];
  achievements: string[];
  keywords: string[];
  star: ExperienceAnalysisStar;
  evidence: ExperienceAnalysisEvidence[];
  evidenceGaps: ExperienceAnalysisEvidenceGap[];
  coverLetterAngles: ExperienceAnalysisCoverLetterAngle[];
  competencyEvidence: ExperienceAnalysisCompetencyEvidence[];
  generatedAt: string;
  sourceExperienceUpdatedAt: string;
};

export type AnalysisApiResult = Omit<
  ExperienceAnalysis,
  "id" | "generatedAt" | "sourceExperienceUpdatedAt"
>;

export type AnalyzeRequest = {
  experience: Experience;
  followups?: ExperienceFollowup[];
};

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "CONFIGURATION_MISSING"
  | "SESSION_REQUIRED"
  | "INSUFFICIENT_INPUT"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "OPENAI_API_ERROR"
  | "MISSING_API_KEY"
  | "UNKNOWN_ERROR";

export type ApiErrorResponse = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    retryAfter?: number;
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

export type RecommendationSchemaVersion = "v1" | "v2";

export type RecommendationFitLevel = "high" | "medium" | "low";

export type RecommendationExtractedRequirements = {
  requiredCompetencies: string[];
  preferredCompetencies: string[];
  keywords: string[];
  intent: string;
  constraints: string[];
};

export type JdRequirementCategory =
  | "responsibility"
  | "required_qualification"
  | "preferred_qualification"
  | "tech_stack"
  | "required_experience";

export type JdRequirementStatus =
  | "met"
  | "partially_met"
  | "insufficient_evidence"
  | "not_met";

export type JdFinalVerdict =
  | "recommended"
  | "challenge_possible"
  | "needs_improvement";

export type RecommendationJdRequirementMatch = {
  category: JdRequirementCategory;
  requirement: string;
  status: JdRequirementStatus;
  matchedExperienceIds: string[];
  evidence: string[];
  missingEvidence: string;
};

export type RecommendationJdAnalysis = {
  summary: string;
  responsibilities: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  techStack: string[];
  requiredExperience: string[];
  requirementMatches: RecommendationJdRequirementMatch[];
  emphasisPoints: string[];
  gaps: string[];
  overclaimRisks: string[];
  finalVerdict: JdFinalVerdict;
  finalVerdictReason: string;
};

export type RecommendationMatch = {
  experienceId: string;
  experienceTitle: string;
  rank: number;
  score: number;
  fitLevel: RecommendationFitLevel;
  matchReason: string;
  matchedEvidence: string[];
  missingEvidence: string[];
  overclaimRisks: string[];
  suggestedAngle: string;
  relatedCompetencies: string[];
};

export type RecommendationResult = {
  id: string;
  purpose: RecommendationPurpose;
  prompt: string;
  schemaVersion: RecommendationSchemaVersion;
  promptVersion: string;
  model: string;
  extractedRequirements: RecommendationExtractedRequirements;
  jdAnalysis: RecommendationJdAnalysis | null;
  matches: RecommendationMatch[];
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

export type AnswerDraftSchemaVersion = "v1";

export type AnswerDraftType =
  | "cover_letter_300"
  | "cover_letter_500"
  | "cover_letter_1000"
  | "interview_30s"
  | "interview_60s"
  | "interview_followups"
  | "jd_strategy"
  | "custom"
  | "cover_letter_800"
  | "interview"
  | "portfolio";

export type ActiveAnswerDraftType =
  | "cover_letter_300"
  | "cover_letter_500"
  | "cover_letter_1000"
  | "interview_30s"
  | "interview_60s"
  | "interview_followups"
  | "jd_strategy"
  | "custom";

export type LegacyAnswerDraftType =
  | "cover_letter_800"
  | "interview"
  | "portfolio";

export type AnswerDraft = {
  type: AnswerDraftType;
  title: string;
  content: string;
  targetGuide: string;
  usedEvidence: string[];
  missingEvidenceNotes: string[];
  cautions: string[];
};

export type AnswerDraftResult = {
  schemaVersion: AnswerDraftSchemaVersion;
  promptVersion: string;
  model: string;
  recommendationId: string;
  experienceId: string;
  sourceMatchRank: number;
  drafts: AnswerDraft[];
  generatedAt: string;
};

export type AnswerDraftsRequest = {
  draftType: ActiveAnswerDraftType;
  recommendation: RecommendationResult;
  match: RecommendationMatch;
  experience: Experience;
  analysis: ExperienceAnalysis | null;
};

export type AnswerDraftsResponse =
  | {
      ok: true;
      answerDrafts: AnswerDraftResult;
    }
  | ApiErrorResponse;

export type ExperienceFollowupSchemaVersion = "v1";

export type ExperienceFollowupSource =
  | "analysis_gap"
  | "recommendation_missing_evidence"
  | "recommendation_overclaim_risk"
  | "answer_draft_missing_evidence"
  | "answer_draft_caution"
  | "manual";

export type ExperienceFollowupTargetEvidenceType =
  | "result_metric"
  | "role_scope"
  | "collaboration_scope"
  | "technical_detail"
  | "process_detail"
  | "decision_reason"
  | "learning"
  | "other";

export type ExperienceFollowupStatus = "open" | "answered" | "dismissed";

export type ExperienceFollowupQuestion = {
  id: string;
  question: string;
  reason: string;
  targetEvidenceType: ExperienceFollowupTargetEvidenceType;
  caution: string;
};

export type ExperienceFollowupAnswer = {
  questionId: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
};

export type ExperienceFollowup = {
  id: string;
  schemaVersion: ExperienceFollowupSchemaVersion;
  experienceId: string;
  source: ExperienceFollowupSource;
  sourceRecommendationId?: string;
  sourceAnswerDraftType?: AnswerDraftType;
  questions: ExperienceFollowupQuestion[];
  answers: ExperienceFollowupAnswer[];
  status: ExperienceFollowupStatus;
  generatedAt: string;
  updatedAt: string;
};

export type EvidenceFollowupsRequest = {
  experience: Experience;
  source: ExperienceFollowupSource;
  analysis?: ExperienceAnalysis | null;
  recommendation?: RecommendationResult | null;
  match?: RecommendationMatch | null;
  answerDraft?: AnswerDraft | null;
};

export type EvidenceFollowupsResponse =
  | {
      ok: true;
      followup: ExperienceFollowup;
    }
  | ApiErrorResponse;
