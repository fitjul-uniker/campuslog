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

export type Experience = {
  id: string;
  title: string;
  period: string;
  role: string;
  description: string;
  achievements: string;
  relatedLinks: string[];
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
  relatedLinksText: string;
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
