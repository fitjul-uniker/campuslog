import {
  createDailyLog,
  createExperience,
  createExperienceFromActivity,
  createTrackedActivity,
  deleteDailyLog,
  deleteExperience,
  deleteRecommendationsByExperienceId,
  deleteSynthesisDraft,
  deleteTrackedActivity,
  getAnswerDraftResult,
  getAnswerDraftResultsByRecommendationId,
  getAnalysisByExperienceId,
  getDailyLogs,
  getDailyLogsByActivityId,
  getDailyLogsByDate,
  getExperienceById,
  getExperiences,
  getRecommendationResults,
  getSynthesisDraftByActivityId,
  getTrackedActivities,
  getTrackedActivityById,
  linkGeneratedExperience,
  saveAnalysisResult,
  saveAnswerDraftResult,
  saveRecommendationResult,
  saveSynthesisDraft,
  setActivitySynthesisStatus,
  setTrackedActivityStatus,
  updateDailyLog,
  updateExperience,
  updateTrackedActivity,
} from "@/lib/storage";
import {
  mergeAnswerDraftResults,
  normalizeAnswerDraftResult,
} from "@/lib/answerDraftResult";
import { normalizeExperienceAnalysis } from "@/lib/analysisResult";
import { normalizeRecommendationResult } from "@/lib/recommendationResult";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type {
  ActivityStatus,
  ActivitySynthesisStatus,
  AnalysisApiResult,
  AnswerDraftResult,
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

export type CampusLogRepositorySource = "localStorage" | "supabase";
type SupabaseClient = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

type RepositoryError = {
  message?: string;
};

type ExperienceRow = {
  id: string;
  title: string;
  period: string;
  role: string;
  description: string;
  achievements: string;
  related_links: Experience["relatedLinks"];
  analysis_status: Experience["analysisStatus"];
  created_at: string;
  updated_at: string;
};

type TrackedActivityRow = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  expected_end_date: string | null;
  status: TrackedActivity["status"];
  completed_at: string | null;
  generated_experience_id: string | null;
  synthesis_status: TrackedActivity["synthesisStatus"];
  created_at: string;
  updated_at: string;
};

type DailyLogRow = {
  id: string;
  activity_id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type ExperienceAnalysisRow = {
  id: string;
  experience_id: string;
  schema_version?: ExperienceAnalysis["schemaVersion"];
  prompt_version?: string | null;
  model?: string | null;
  summary: string;
  competency_tags: string[];
  achievements: string[];
  keywords: string[];
  star?: unknown;
  evidence?: unknown;
  evidence_gaps?: unknown;
  cover_letter_angles?: unknown;
  competency_evidence?: unknown;
  generated_at: string;
  source_experience_updated_at: string;
};

type RecommendationRow = {
  id: string;
  purpose: RecommendationResult["purpose"];
  prompt: string;
  schema_version?: RecommendationResult["schemaVersion"];
  prompt_version?: string | null;
  model?: string | null;
  extracted_requirements?: unknown;
  matches?: unknown;
  recommended_experience_id: string;
  recommended_experience_title: string;
  reason: string;
  related_tags: string[];
  highlighted_achievement: string;
  usage_direction: string;
  draft_sentence: string;
  generated_at: string;
};

type AnswerDraftRow = {
  recommendation_id: string;
  experience_id: string;
  schema_version?: AnswerDraftResult["schemaVersion"];
  prompt_version?: string | null;
  model?: string | null;
  source_match_rank: number;
  drafts: unknown;
  generated_at: string;
};

type SynthesisDraftRow = {
  activity_id: string;
  description: string;
  achievements: string[];
  used_log_ids: string[];
  evidence_gaps: string[];
  generated_at: string;
};

export type CampusLogRepository = {
  source: CampusLogRepositorySource;
  experiences: {
    list(): Promise<Experience[]>;
    getById(id: string): Promise<Experience | null>;
    create(input: ExperienceFormInput): Promise<Experience | null>;
    update(
      id: string,
      input: ExperienceFormInput,
    ): Promise<Experience | null>;
    delete(id: string): Promise<boolean>;
    createFromActivity(
      activityId: string,
      input: ExperienceFormInput,
    ): Promise<Experience | null>;
  };
  analyses: {
    getByExperienceId(experienceId: string): Promise<ExperienceAnalysis | null>;
    save(result: AnalysisApiResult): Promise<ExperienceAnalysis | null>;
  };
  recommendations: {
    list(): Promise<RecommendationResult[]>;
    save(result: RecommendationResult): Promise<RecommendationResult | null>;
    deleteByExperienceId(experienceId: string): Promise<void>;
  };
  answerDrafts: {
    getByRecommendationAndExperience(
      recommendationId: string,
      experienceId: string,
    ): Promise<AnswerDraftResult | null>;
    listByRecommendationId(
      recommendationId: string,
    ): Promise<AnswerDraftResult[]>;
    save(result: AnswerDraftResult): Promise<AnswerDraftResult | null>;
  };
  trackedActivities: {
    list(): Promise<TrackedActivity[]>;
    getById(id: string): Promise<TrackedActivity | null>;
    create(input: TrackedActivityInput): Promise<TrackedActivity | null>;
    update(
      id: string,
      input: TrackedActivityInput,
    ): Promise<TrackedActivity | null>;
    setStatus(
      id: string,
      status: ActivityStatus,
      completedAt?: string,
    ): Promise<TrackedActivity | null>;
    setSynthesisStatus(
      id: string,
      status: ActivitySynthesisStatus,
    ): Promise<TrackedActivity | null>;
    linkGeneratedExperience(
      activityId: string,
      experienceId: string,
    ): Promise<TrackedActivity | null>;
    delete(id: string): Promise<boolean>;
  };
  dailyLogs: {
    list(): Promise<DailyLog[]>;
    listByActivityId(activityId: string): Promise<DailyLog[]>;
    listByDate(date: string): Promise<DailyLog[]>;
    create(input: DailyLogInput): Promise<DailyLog | null>;
    update(id: string, input: DailyLogInput): Promise<DailyLog | null>;
    delete(id: string): Promise<boolean>;
  };
  synthesisDrafts: {
    getByActivityId(activityId: string): Promise<ExperienceSynthesisDraft | null>;
    save(
      draft: ExperienceSynthesisDraft,
    ): Promise<ExperienceSynthesisDraft | null>;
    delete(activityId: string): Promise<boolean>;
  };
};

function createId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function throwIfError(error: RepositoryError | null) {
  if (error) {
    throw new Error(error.message ?? "CampusLog repository request failed.");
  }
}

function toExperience(row: ExperienceRow): Experience {
  return {
    id: row.id,
    title: row.title,
    period: row.period,
    role: row.role,
    description: row.description,
    achievements: row.achievements,
    relatedLinks: Array.isArray(row.related_links) ? row.related_links : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    analysisStatus: row.analysis_status,
  };
}

function toTrackedActivity(row: TrackedActivityRow): TrackedActivity {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    expectedEndDate: row.expected_end_date ?? "",
    status: row.status,
    completedAt: row.completed_at ?? "",
    generatedExperienceId: row.generated_experience_id ?? "",
    synthesisStatus: row.synthesis_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDailyLog(row: DailyLogRow): DailyLog {
  return {
    id: row.id,
    activityId: row.activity_id,
    date: row.date,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAnalysis(row: ExperienceAnalysisRow): ExperienceAnalysis {
  const analysis = normalizeExperienceAnalysis({
    id: row.id,
    experienceId: row.experience_id,
    schemaVersion: row.schema_version,
    promptVersion: row.prompt_version ?? "",
    model: row.model ?? "",
    summary: row.summary,
    competencyTags: row.competency_tags,
    achievements: row.achievements,
    keywords: row.keywords,
    star: row.star,
    evidence: row.evidence,
    evidenceGaps: row.evidence_gaps,
    coverLetterAngles: row.cover_letter_angles,
    competencyEvidence: row.competency_evidence,
    generatedAt: row.generated_at,
    sourceExperienceUpdatedAt: row.source_experience_updated_at,
  });

  if (!analysis) {
    throw new Error("CampusLog analysis row is invalid.");
  }

  return analysis;
}

function toRecommendation(row: RecommendationRow): RecommendationResult {
  const recommendation = normalizeRecommendationResult({
    id: row.id,
    purpose: row.purpose,
    prompt: row.prompt,
    schemaVersion: row.schema_version,
    promptVersion: row.prompt_version ?? "",
    model: row.model ?? "",
    extractedRequirements: row.extracted_requirements,
    matches: row.matches,
    recommendedExperienceId: row.recommended_experience_id,
    recommendedExperienceTitle: row.recommended_experience_title,
    reason: row.reason,
    relatedTags: row.related_tags,
    highlightedAchievement: row.highlighted_achievement,
    usageDirection: row.usage_direction,
    draftSentence: row.draft_sentence,
    generatedAt: row.generated_at,
  });

  if (!recommendation) {
    throw new Error("CampusLog recommendation row is invalid.");
  }

  return recommendation;
}

function toAnswerDraft(row: AnswerDraftRow): AnswerDraftResult {
  const answerDraft = normalizeAnswerDraftResult({
    schemaVersion: row.schema_version,
    promptVersion: row.prompt_version ?? "",
    model: row.model ?? "",
    recommendationId: row.recommendation_id,
    experienceId: row.experience_id,
    sourceMatchRank: row.source_match_rank,
    drafts: row.drafts,
    generatedAt: row.generated_at,
  });

  if (!answerDraft) {
    throw new Error("CampusLog answer draft row is invalid.");
  }

  return answerDraft;
}

function toSynthesisDraft(row: SynthesisDraftRow): ExperienceSynthesisDraft {
  return {
    activityId: row.activity_id,
    description: row.description,
    achievements: row.achievements,
    usedLogIds: row.used_log_ids,
    evidenceGaps: row.evidence_gaps,
    generatedAt: row.generated_at,
  };
}

function normalizeDate(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)
    ? trimmedValue
    : new Date(trimmedValue).toISOString().slice(0, 10);

  return date;
}

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeExperienceInput(input: ExperienceFormInput) {
  return {
    title: input.title.trim(),
    period: input.period.trim(),
    role: input.role.trim(),
    description: input.description.trim(),
    achievements: input.achievements.trim(),
    related_links: input.relatedLinks,
  };
}

function normalizeActivityInput(input: TrackedActivityInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    start_date: input.startDate.trim(),
    expected_end_date: input.expectedEndDate.trim() || null,
  };
}

function normalizeDailyLogInput(input: DailyLogInput) {
  return {
    activity_id: input.activityId.trim(),
    date: input.date.trim(),
    content: input.content.trim(),
  };
}

async function refreshActivitySynthesisAfterLogChange(
  supabase: SupabaseClient,
  activityIds: string[],
) {
  const uniqueActivityIds = Array.from(new Set(activityIds.filter(Boolean)));

  if (uniqueActivityIds.length === 0) {
    return;
  }

  const { error: draftError } = await supabase
    .from("experience_synthesis_drafts")
    .delete()
    .in("activity_id", uniqueActivityIds);
  throwIfError(draftError);

  const { error: activityError } = await supabase
    .from("tracked_activities")
    .update({ synthesis_status: "idle" })
    .in("id", uniqueActivityIds)
    .is("generated_experience_id", null);
  throwIfError(activityError);
}

function createSupabaseCampusLogRepository(
  supabase: SupabaseClient,
): CampusLogRepository {
  return {
    source: "supabase",
    experiences: {
      async list() {
        const { data, error } = await supabase
          .from("experiences")
          .select("*")
          .order("updated_at", { ascending: false });
        throwIfError(error);
        return ((data ?? []) as ExperienceRow[]).map(toExperience);
      },
      async getById(id) {
        const { data, error } = await supabase
          .from("experiences")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        throwIfError(error);
        return data ? toExperience(data as ExperienceRow) : null;
      },
      async create(input) {
        const normalizedInput = normalizeExperienceInput(input);

        if (
          !normalizedInput.title ||
          !normalizedInput.period ||
          !normalizedInput.role ||
          !normalizedInput.description
        ) {
          return null;
        }

        const { data, error } = await supabase
          .from("experiences")
          .insert({
            id: createId("experience"),
            ...normalizedInput,
            analysis_status: "unanalyzed",
          })
          .select("*")
          .single();
        throwIfError(error);
        return toExperience(data as ExperienceRow);
      },
      async update(id, input) {
        const normalizedInput = normalizeExperienceInput(input);

        if (
          !normalizedInput.title ||
          !normalizedInput.period ||
          !normalizedInput.role ||
          !normalizedInput.description
        ) {
          return null;
        }

        const currentExperience = await this.getById(id);

        if (!currentExperience) {
          return null;
        }

        const existingAnalysis =
          await createSupabaseCampusLogRepository(supabase).analyses.getByExperienceId(
            id,
          );
        const analysisStatus = existingAnalysis
          ? "needs_reanalysis"
          : currentExperience.analysisStatus;

        const { data, error } = await supabase
          .from("experiences")
          .update({
            ...normalizedInput,
            analysis_status: analysisStatus,
          })
          .eq("id", id)
          .select("*")
          .single();
        throwIfError(error);
        return toExperience(data as ExperienceRow);
      },
      async delete(id) {
        const { error: activityError } = await supabase
          .from("tracked_activities")
          .update({
            generated_experience_id: null,
            synthesis_status: "failed",
          })
          .eq("generated_experience_id", id);
        throwIfError(activityError);

        const { error } = await supabase.from("experiences").delete().eq("id", id);
        throwIfError(error);
        return true;
      },
      async createFromActivity(activityId, input) {
        const repository = createSupabaseCampusLogRepository(supabase);
        const activity = await repository.trackedActivities.getById(activityId);

        if (!activity || activity.status !== "completed") {
          return null;
        }

        if (activity.generatedExperienceId) {
          return repository.experiences.getById(activity.generatedExperienceId);
        }

        const createdExperience = await repository.experiences.create(input);

        if (!createdExperience) {
          return null;
        }

        const linkedActivity =
          await repository.trackedActivities.linkGeneratedExperience(
            activityId,
            createdExperience.id,
          );

        if (!linkedActivity) {
          await repository.experiences.delete(createdExperience.id);
          return null;
        }

        await repository.synthesisDrafts.delete(activityId);
        return createdExperience;
      },
    },
    analyses: {
      async getByExperienceId(experienceId) {
        const { data, error } = await supabase
          .from("experience_analyses")
          .select("*")
          .eq("experience_id", experienceId)
          .maybeSingle();
        throwIfError(error);
        return data ? toAnalysis(data as ExperienceAnalysisRow) : null;
      },
      async save(result) {
        const repository = createSupabaseCampusLogRepository(supabase);
        const sourceExperience = await repository.experiences.getById(
          result.experienceId,
        );

        if (!sourceExperience) {
          return null;
        }

        const existingAnalysis = await this.getByExperienceId(
          result.experienceId,
        );
        const { data: updatedExperienceData, error: experienceError } =
          await supabase
            .from("experiences")
            .update({ analysis_status: "analyzed" })
            .eq("id", result.experienceId)
            .select("*")
            .single();
        throwIfError(experienceError);

        const updatedExperience = toExperience(
          updatedExperienceData as ExperienceRow,
        );
        const analysisPayload = {
          id: existingAnalysis?.id ?? createId("analysis"),
          experience_id: result.experienceId,
          schema_version: result.schemaVersion,
          prompt_version: result.promptVersion,
          model: result.model,
          summary: result.summary,
          competency_tags: result.competencyTags,
          achievements: result.achievements,
          keywords: result.keywords,
          star: result.star,
          evidence: result.evidence,
          evidence_gaps: result.evidenceGaps,
          cover_letter_angles: result.coverLetterAngles,
          competency_evidence: result.competencyEvidence,
          generated_at: new Date().toISOString(),
          source_experience_updated_at: updatedExperience.updatedAt,
        };
        const query = existingAnalysis
          ? supabase
              .from("experience_analyses")
              .update(analysisPayload)
              .eq("id", existingAnalysis.id)
          : supabase.from("experience_analyses").insert(analysisPayload);
        const { data, error } = await query.select("*").single();
        throwIfError(error);

        return toAnalysis(data as ExperienceAnalysisRow);
      },
    },
    recommendations: {
      async list() {
        const { data, error } = await supabase
          .from("recommendations")
          .select("*")
          .order("generated_at", { ascending: false });
        throwIfError(error);
        return ((data ?? []) as RecommendationRow[]).map(toRecommendation);
      },
      async save(result) {
        const { data, error } = await supabase
          .from("recommendations")
          .upsert({
            id: result.id,
            purpose: result.purpose,
            prompt: result.prompt,
            schema_version: result.schemaVersion,
            prompt_version: result.promptVersion,
            model: result.model,
            extracted_requirements: result.extractedRequirements,
            matches: result.matches,
            recommended_experience_id: result.recommendedExperienceId,
            recommended_experience_title: result.recommendedExperienceTitle,
            reason: result.reason,
            related_tags: result.relatedTags,
            highlighted_achievement: result.highlightedAchievement,
            usage_direction: result.usageDirection,
            draft_sentence: result.draftSentence,
            generated_at: result.generatedAt,
          })
          .select("*")
          .single();
        throwIfError(error);
        return toRecommendation(data as RecommendationRow);
      },
      async deleteByExperienceId(experienceId) {
        const { error } = await supabase
          .from("recommendations")
          .delete()
          .eq("recommended_experience_id", experienceId);
        throwIfError(error);
      },
    },
    answerDrafts: {
      async getByRecommendationAndExperience(recommendationId, experienceId) {
        const { data, error } = await supabase
          .from("answer_drafts")
          .select("*")
          .eq("recommendation_id", recommendationId)
          .eq("experience_id", experienceId)
          .maybeSingle();
        throwIfError(error);
        return data ? toAnswerDraft(data as AnswerDraftRow) : null;
      },
      async listByRecommendationId(recommendationId) {
        const { data, error } = await supabase
          .from("answer_drafts")
          .select("*")
          .eq("recommendation_id", recommendationId)
          .order("generated_at", { ascending: false });
        throwIfError(error);
        return ((data ?? []) as AnswerDraftRow[]).map(toAnswerDraft);
      },
      async save(result) {
        const existingAnswerDraft =
          await this.getByRecommendationAndExperience(
            result.recommendationId,
            result.experienceId,
          );
        const nextAnswerDraft = mergeAnswerDraftResults(
          existingAnswerDraft,
          result,
        );
        const { data, error } = await supabase
          .from("answer_drafts")
          .upsert({
            recommendation_id: nextAnswerDraft.recommendationId,
            experience_id: nextAnswerDraft.experienceId,
            schema_version: nextAnswerDraft.schemaVersion,
            prompt_version: nextAnswerDraft.promptVersion,
            model: nextAnswerDraft.model,
            source_match_rank: nextAnswerDraft.sourceMatchRank,
            drafts: nextAnswerDraft.drafts,
            generated_at: nextAnswerDraft.generatedAt,
          })
          .select("*")
          .single();
        throwIfError(error);
        return toAnswerDraft(data as AnswerDraftRow);
      },
    },
    trackedActivities: {
      async list() {
        const { data, error } = await supabase
          .from("tracked_activities")
          .select("*")
          .order("updated_at", { ascending: false });
        throwIfError(error);
        return ((data ?? []) as TrackedActivityRow[]).map(toTrackedActivity);
      },
      async getById(id) {
        const { data, error } = await supabase
          .from("tracked_activities")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        throwIfError(error);
        return data ? toTrackedActivity(data as TrackedActivityRow) : null;
      },
      async create(input) {
        const normalizedInput = normalizeActivityInput(input);

        if (
          !normalizedInput.title ||
          !normalizedInput.description ||
          !normalizedInput.start_date ||
          (normalizedInput.expected_end_date &&
            normalizedInput.expected_end_date < normalizedInput.start_date)
        ) {
          return null;
        }

        const today = getLocalDateString();
        const { data, error } = await supabase
          .from("tracked_activities")
          .insert({
            id: createId("activity"),
            ...normalizedInput,
            status: normalizedInput.start_date > today ? "planned" : "active",
            completed_at: null,
            generated_experience_id: null,
            synthesis_status: "idle",
          })
          .select("*")
          .single();
        throwIfError(error);
        return toTrackedActivity(data as TrackedActivityRow);
      },
      async update(id, input) {
        const normalizedInput = normalizeActivityInput(input);

        if (
          !normalizedInput.title ||
          !normalizedInput.description ||
          !normalizedInput.start_date ||
          (normalizedInput.expected_end_date &&
            normalizedInput.expected_end_date < normalizedInput.start_date)
        ) {
          return null;
        }

        const { data, error } = await supabase
          .from("tracked_activities")
          .update(normalizedInput)
          .eq("id", id)
          .select("*")
          .single();
        throwIfError(error);

        const activity = toTrackedActivity(data as TrackedActivityRow);

        if (!activity.generatedExperienceId) {
          await refreshActivitySynthesisAfterLogChange(supabase, [activity.id]);
          return this.getById(activity.id);
        }

        return activity;
      },
      async setStatus(id, status, completedAt) {
        const currentActivity = await this.getById(id);

        if (!currentActivity) {
          return null;
        }

        if (currentActivity.status === status) {
          return currentActivity;
        }

        if (
          currentActivity.status === "completed" &&
          status === "active" &&
          currentActivity.generatedExperienceId
        ) {
          return null;
        }

        const completedDate =
          status === "completed"
            ? normalizeDate(completedAt?.trim() || getLocalDateString())
            : null;

        if (
          status === "completed" &&
          (!completedDate || completedDate < currentActivity.startDate)
        ) {
          return null;
        }

        const { data, error } = await supabase
          .from("tracked_activities")
          .update({
            status,
            completed_at: completedDate,
            synthesis_status:
              currentActivity.status === "completed" && status === "active"
                ? "idle"
                : currentActivity.synthesisStatus,
          })
          .eq("id", id)
          .select("*")
          .single();
        throwIfError(error);

        if (currentActivity.status === "completed" && status === "active") {
          await createSupabaseCampusLogRepository(supabase).synthesisDrafts.delete(
            id,
          );
        }

        return toTrackedActivity(data as TrackedActivityRow);
      },
      async setSynthesisStatus(id, status) {
        const { data, error } = await supabase
          .from("tracked_activities")
          .update({ synthesis_status: status })
          .eq("id", id)
          .select("*")
          .single();
        throwIfError(error);
        return toTrackedActivity(data as TrackedActivityRow);
      },
      async linkGeneratedExperience(activityId, experienceId) {
        const activity = await this.getById(activityId);

        if (!activity || activity.status !== "completed") {
          return null;
        }

        if (activity.generatedExperienceId) {
          return activity.generatedExperienceId === experienceId ? activity : null;
        }

        const { data, error } = await supabase
          .from("tracked_activities")
          .update({
            generated_experience_id: experienceId,
            synthesis_status: "saved",
          })
          .eq("id", activityId)
          .select("*")
          .single();
        throwIfError(error);
        return toTrackedActivity(data as TrackedActivityRow);
      },
      async delete(id) {
        const { error } = await supabase
          .from("tracked_activities")
          .delete()
          .eq("id", id);
        throwIfError(error);
        return true;
      },
    },
    dailyLogs: {
      async list() {
        const { data, error } = await supabase
          .from("daily_logs")
          .select("*")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false });
        throwIfError(error);
        return ((data ?? []) as DailyLogRow[]).map(toDailyLog);
      },
      async listByActivityId(activityId) {
        const { data, error } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("activity_id", activityId)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false });
        throwIfError(error);
        return ((data ?? []) as DailyLogRow[]).map(toDailyLog);
      },
      async listByDate(date) {
        const { data, error } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("date", date)
          .order("created_at", { ascending: false });
        throwIfError(error);
        return ((data ?? []) as DailyLogRow[]).map(toDailyLog);
      },
      async create(input) {
        const normalizedInput = normalizeDailyLogInput(input);

        if (
          !normalizedInput.activity_id ||
          !normalizedInput.date ||
          !normalizedInput.content
        ) {
          return null;
        }

        const { data, error } = await supabase
          .from("daily_logs")
          .insert({
            id: createId("daily-log"),
            ...normalizedInput,
          })
          .select("*")
          .single();
        throwIfError(error);
        await refreshActivitySynthesisAfterLogChange(supabase, [
          normalizedInput.activity_id,
        ]);
        return toDailyLog(data as DailyLogRow);
      },
      async update(id, input) {
        const normalizedInput = normalizeDailyLogInput(input);

        if (
          !normalizedInput.activity_id ||
          !normalizedInput.date ||
          !normalizedInput.content
        ) {
          return null;
        }

        const { data: currentData, error: currentError } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        throwIfError(currentError);

        if (!currentData) {
          return null;
        }

        const currentLog = toDailyLog(currentData as DailyLogRow);
        const { data, error } = await supabase
          .from("daily_logs")
          .update(normalizedInput)
          .eq("id", id)
          .select("*")
          .single();
        throwIfError(error);
        await refreshActivitySynthesisAfterLogChange(supabase, [
          currentLog.activityId,
          normalizedInput.activity_id,
        ]);
        return toDailyLog(data as DailyLogRow);
      },
      async delete(id) {
        const { data: currentData, error: currentError } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        throwIfError(currentError);

        if (!currentData) {
          return false;
        }

        const currentLog = toDailyLog(currentData as DailyLogRow);
        const { error } = await supabase.from("daily_logs").delete().eq("id", id);
        throwIfError(error);
        await refreshActivitySynthesisAfterLogChange(supabase, [
          currentLog.activityId,
        ]);
        return true;
      },
    },
    synthesisDrafts: {
      async getByActivityId(activityId) {
        const { data, error } = await supabase
          .from("experience_synthesis_drafts")
          .select("*")
          .eq("activity_id", activityId)
          .maybeSingle();
        throwIfError(error);
        return data ? toSynthesisDraft(data as SynthesisDraftRow) : null;
      },
      async save(draft) {
        const repository = createSupabaseCampusLogRepository(supabase);
        const activity = await repository.trackedActivities.getById(
          draft.activityId,
        );

        if (
          !activity ||
          activity.status !== "completed" ||
          activity.generatedExperienceId
        ) {
          return null;
        }

        const logs = await repository.dailyLogs.listByActivityId(draft.activityId);
        const logIds = new Set(logs.map((log) => log.id));

        if (draft.usedLogIds.some((logId) => !logIds.has(logId))) {
          return null;
        }

        const { data, error } = await supabase
          .from("experience_synthesis_drafts")
          .upsert({
            activity_id: draft.activityId,
            description: draft.description,
            achievements: draft.achievements,
            used_log_ids: draft.usedLogIds,
            evidence_gaps: draft.evidenceGaps,
            generated_at: draft.generatedAt,
          })
          .select("*")
          .single();
        throwIfError(error);
        return toSynthesisDraft(data as SynthesisDraftRow);
      },
      async delete(activityId) {
        const { error } = await supabase
          .from("experience_synthesis_drafts")
          .delete()
          .eq("activity_id", activityId);
        throwIfError(error);
        return true;
      },
    },
  };
}

export function getCampusLogRepository(): CampusLogRepository {
  const supabase = createSupabaseBrowserClient();

  if (!supabase) {
    return localCampusLogRepository;
  }

  return createSupabaseCampusLogRepository(supabase);
}

export function createLocalCampusLogRepository(): CampusLogRepository {
  return {
    source: "localStorage",
    experiences: {
      list: async () => getExperiences(),
      getById: async (id) => getExperienceById(id),
      create: async (input) => createExperience(input),
      update: async (id, input) => updateExperience(id, input),
      delete: async (id) => deleteExperience(id),
      createFromActivity: async (activityId, input) =>
        createExperienceFromActivity(activityId, input),
    },
    analyses: {
      getByExperienceId: async (experienceId) =>
        getAnalysisByExperienceId(experienceId),
      save: async (result) => saveAnalysisResult(result),
    },
    recommendations: {
      list: async () => getRecommendationResults(),
      save: async (result) => saveRecommendationResult(result),
      deleteByExperienceId: async (experienceId) => {
        deleteRecommendationsByExperienceId(experienceId);
      },
    },
    answerDrafts: {
      getByRecommendationAndExperience: async (
        recommendationId,
        experienceId,
      ) => getAnswerDraftResult(recommendationId, experienceId),
      listByRecommendationId: async (recommendationId) =>
        getAnswerDraftResultsByRecommendationId(recommendationId),
      save: async (result) => saveAnswerDraftResult(result),
    },
    trackedActivities: {
      list: async () => getTrackedActivities(),
      getById: async (id) => getTrackedActivityById(id),
      create: async (input) => createTrackedActivity(input),
      update: async (id, input) => updateTrackedActivity(id, input),
      setStatus: async (id, status, completedAt) =>
        setTrackedActivityStatus(id, status, completedAt),
      setSynthesisStatus: async (id, status) =>
        setActivitySynthesisStatus(id, status),
      linkGeneratedExperience: async (activityId, experienceId) =>
        linkGeneratedExperience(activityId, experienceId),
      delete: async (id) => deleteTrackedActivity(id),
    },
    dailyLogs: {
      list: async () => getDailyLogs(),
      listByActivityId: async (activityId) =>
        getDailyLogsByActivityId(activityId),
      listByDate: async (date) => getDailyLogsByDate(date),
      create: async (input) => createDailyLog(input),
      update: async (id, input) => updateDailyLog(id, input),
      delete: async (id) => deleteDailyLog(id),
    },
    synthesisDrafts: {
      getByActivityId: async (activityId) =>
        getSynthesisDraftByActivityId(activityId),
      save: async (draft) => saveSynthesisDraft(draft),
      delete: async (activityId) => deleteSynthesisDraft(activityId),
    },
  };
}

export const localCampusLogRepository = createLocalCampusLogRepository();
