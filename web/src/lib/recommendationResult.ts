import type {
  JdFinalVerdict,
  JdRequirementCategory,
  JdRequirementStatus,
  RecommendationApiResult,
  RecommendationExtractedRequirements,
  RecommendationFitLevel,
  RecommendationJdAnalysis,
  RecommendationJdRequirementMatch,
  RecommendationMatch,
  RecommendationResult,
  RecommendationSchemaVersion,
} from "@/lib/types";
import { normalizeRecommendationPurpose } from "@/lib/recommendationPurposeConfig";

export const RECOMMENDATION_SCHEMA_VERSION = "v2" as const;
export const RECOMMENDATION_PROMPT_VERSION = "recommendation-v2.0";

export const DEFAULT_RECOMMENDATION_REQUIREMENTS: RecommendationExtractedRequirements =
  {
    requiredCompetencies: [],
    preferredCompetencies: [],
    keywords: [],
    intent: "",
    constraints: [],
  };

export const DEFAULT_RECOMMENDATION_JD_ANALYSIS: RecommendationJdAnalysis = {
  summary: "",
  responsibilities: [],
  requiredQualifications: [],
  preferredQualifications: [],
  techStack: [],
  requiredExperience: [],
  requirementMatches: [],
  emphasisPoints: [],
  gaps: [],
  overclaimRisks: [],
  finalVerdict: "needs_improvement",
  finalVerdictReason: "",
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeScore(value: unknown): number {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(numericValue)));
}

export function getRecommendationFitLevelFromScore(
  score: number,
): RecommendationFitLevel {
  if (score >= 75) {
    return "high";
  }

  if (score >= 45) {
    return "medium";
  }

  return "low";
}

function normalizeStringList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeJdRequirementCategory(
  value: unknown,
): JdRequirementCategory {
  if (
    value === "responsibility" ||
    value === "required_qualification" ||
    value === "preferred_qualification" ||
    value === "tech_stack" ||
    value === "required_experience"
  ) {
    return value;
  }

  return "required_experience";
}

function normalizeJdRequirementStatus(value: unknown): JdRequirementStatus {
  if (
    value === "met" ||
    value === "partially_met" ||
    value === "insufficient_evidence" ||
    value === "not_met"
  ) {
    return value;
  }

  return "insufficient_evidence";
}

function normalizeJdFinalVerdict(value: unknown): JdFinalVerdict {
  if (
    value === "recommended" ||
    value === "challenge_possible" ||
    value === "needs_improvement"
  ) {
    return value;
  }

  return "needs_improvement";
}

function normalizeJdRequirementMatch(
  value: unknown,
): RecommendationJdRequirementMatch | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const requirement = normalizeText(candidate.requirement);

  if (!requirement) {
    return null;
  }

  return {
    category: normalizeJdRequirementCategory(candidate.category),
    requirement,
    status: normalizeJdRequirementStatus(candidate.status),
    matchedExperienceIds: normalizeStringList(candidate.matchedExperienceIds, 6),
    evidence: normalizeStringList(candidate.evidence, 6),
    missingEvidence: normalizeText(candidate.missingEvidence),
  };
}

export function normalizeRecommendationJdAnalysis(
  value: unknown,
): RecommendationJdAnalysis | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const summary = normalizeText(candidate.summary);
  const finalVerdictReason = normalizeText(candidate.finalVerdictReason);
  const requirementMatches = Array.isArray(candidate.requirementMatches)
    ? candidate.requirementMatches
        .map(normalizeJdRequirementMatch)
        .filter(
          (
            match,
          ): match is RecommendationJdRequirementMatch => match !== null,
        )
        .slice(0, 24)
    : [];

  if (!summary && requirementMatches.length === 0 && !finalVerdictReason) {
    return null;
  }

  return {
    summary,
    responsibilities: normalizeStringList(candidate.responsibilities, 12),
    requiredQualifications: normalizeStringList(
      candidate.requiredQualifications,
      12,
    ),
    preferredQualifications: normalizeStringList(
      candidate.preferredQualifications,
      12,
    ),
    techStack: normalizeStringList(candidate.techStack, 16),
    requiredExperience: normalizeStringList(candidate.requiredExperience, 12),
    requirementMatches,
    emphasisPoints: normalizeStringList(candidate.emphasisPoints, 10),
    gaps: normalizeStringList(candidate.gaps, 10),
    overclaimRisks: normalizeStringList(candidate.overclaimRisks, 10),
    finalVerdict: normalizeJdFinalVerdict(candidate.finalVerdict),
    finalVerdictReason,
  };
}

export function normalizeRecommendationRequirements(
  value: unknown,
): RecommendationExtractedRequirements {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_RECOMMENDATION_REQUIREMENTS };
  }

  const candidate = value as Record<string, unknown>;

  return {
    requiredCompetencies: normalizeStringList(
      candidate.requiredCompetencies,
      10,
    ),
    preferredCompetencies: normalizeStringList(
      candidate.preferredCompetencies,
      10,
    ),
    keywords: normalizeStringList(candidate.keywords, 16),
    intent: normalizeText(candidate.intent),
    constraints: normalizeStringList(candidate.constraints, 10),
  };
}

export function normalizeRecommendationMatch(
  value: unknown,
): RecommendationMatch | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const experienceId = normalizeText(candidate.experienceId);
  const experienceTitle = normalizeText(candidate.experienceTitle);
  const rank =
    typeof candidate.rank === "number" && Number.isFinite(candidate.rank)
      ? Math.max(1, Math.round(candidate.rank))
      : 1;
  const score = normalizeScore(candidate.score);
  const matchReason = normalizeText(candidate.matchReason);
  const suggestedAngle = normalizeText(candidate.suggestedAngle);

  if (!experienceId || !experienceTitle || !matchReason || !suggestedAngle) {
    return null;
  }

  return {
    experienceId,
    experienceTitle,
    rank,
    score,
    fitLevel: getRecommendationFitLevelFromScore(score),
    matchReason,
    matchedEvidence: normalizeStringList(candidate.matchedEvidence, 6),
    missingEvidence: normalizeStringList(candidate.missingEvidence, 6),
    overclaimRisks: normalizeStringList(candidate.overclaimRisks, 6),
    suggestedAngle,
    relatedCompetencies: normalizeStringList(candidate.relatedCompetencies, 8),
  };
}

function normalizeRecommendationMatches(value: unknown): RecommendationMatch[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenExperienceIds = new Set<string>();

  return value
    .map(normalizeRecommendationMatch)
    .filter((match): match is RecommendationMatch => {
      if (!match || seenExperienceIds.has(match.experienceId)) {
        return false;
      }

      seenExperienceIds.add(match.experienceId);
      return true;
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map((match, index) => ({
      ...match,
      rank: index + 1,
    }));
}

function createLegacyMatch(
  candidate: Record<string, unknown>,
): RecommendationMatch | null {
  const experienceId = normalizeText(candidate.recommendedExperienceId);
  const experienceTitle = normalizeText(candidate.recommendedExperienceTitle);
  const reason = normalizeText(candidate.reason);
  const usageDirection = normalizeText(candidate.usageDirection);

  if (!experienceId || !experienceTitle || !reason || !usageDirection) {
    return null;
  }

  const highlightedAchievement = normalizeText(
    candidate.highlightedAchievement,
  );

  return {
    experienceId,
    experienceTitle,
    rank: 1,
    score: 100,
    fitLevel: "high",
    matchReason: reason,
    matchedEvidence: highlightedAchievement ? [highlightedAchievement] : [],
    missingEvidence: [],
    overclaimRisks: [],
    suggestedAngle: usageDirection,
    relatedCompetencies: normalizeStringList(candidate.relatedTags, 8),
  };
}

export function normalizeRecommendationResult(
  value: unknown,
): RecommendationResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const id = normalizeText(candidate.id);
  const purpose = normalizeRecommendationPurpose(candidate.purpose);
  const prompt = normalizeText(candidate.prompt);
  const recommendedExperienceId = normalizeText(
    candidate.recommendedExperienceId,
  );
  const recommendedExperienceTitle = normalizeText(
    candidate.recommendedExperienceTitle,
  );
  const reason = normalizeText(candidate.reason);
  const highlightedAchievement = normalizeText(
    candidate.highlightedAchievement,
  );
  const usageDirection = normalizeText(candidate.usageDirection);
  const draftSentence = normalizeText(candidate.draftSentence);
  const generatedAt = normalizeText(candidate.generatedAt);

  if (
    !id ||
    !purpose ||
    !prompt ||
    !recommendedExperienceId ||
    !recommendedExperienceTitle ||
    !reason ||
    !generatedAt
  ) {
    return null;
  }

  const schemaVersion: RecommendationSchemaVersion =
    candidate.schemaVersion === "v2" ? "v2" : "v1";
  const parsedMatches = normalizeRecommendationMatches(candidate.matches);
  const legacyMatch = createLegacyMatch(candidate);
  const matches = parsedMatches.length > 0
    ? parsedMatches
    : legacyMatch
      ? [legacyMatch]
      : [];

  return {
    id,
    purpose,
    prompt,
    schemaVersion,
    promptVersion: normalizeText(candidate.promptVersion),
    model: normalizeText(candidate.model),
    extractedRequirements: normalizeRecommendationRequirements(
      candidate.extractedRequirements,
    ),
    jdAnalysis: normalizeRecommendationJdAnalysis(candidate.jdAnalysis),
    matches,
    recommendedExperienceId,
    recommendedExperienceTitle,
    reason,
    relatedTags: normalizeStringList(candidate.relatedTags, 8),
    highlightedAchievement: highlightedAchievement || reason,
    usageDirection: usageDirection || reason,
    draftSentence: draftSentence || reason,
    generatedAt,
  };
}

export function normalizeRecommendationApiResult(
  value: unknown,
): RecommendationApiResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const normalized = normalizeRecommendationResult({
    ...(value as Record<string, unknown>),
    id: "api-recommendation",
    purpose: "other",
    prompt: "api-recommendation",
    schemaVersion:
      (value as Record<string, unknown>).schemaVersion === "v2" ? "v2" : "v1",
    generatedAt: "1970-01-01T00:00:00.000Z",
  });

  if (!normalized) {
    return null;
  }

  return {
    schemaVersion: normalized.schemaVersion,
    promptVersion: normalized.promptVersion,
    model: normalized.model,
    extractedRequirements: normalized.extractedRequirements,
    jdAnalysis: normalized.jdAnalysis,
    matches: normalized.matches,
    recommendedExperienceId: normalized.recommendedExperienceId,
    recommendedExperienceTitle: normalized.recommendedExperienceTitle,
    reason: normalized.reason,
    relatedTags: normalized.relatedTags,
    highlightedAchievement: normalized.highlightedAchievement,
    usageDirection: normalized.usageDirection,
    draftSentence: normalized.draftSentence,
  };
}
