import type {
  ExperienceAnalysis,
  ExperienceAnalysisCoverLetterAngle,
  ExperienceAnalysisEvidence,
  ExperienceAnalysisEvidenceGap,
  ExperienceAnalysisEvidenceSource,
  ExperienceAnalysisStar,
  ExperienceAnalysisCompetencyEvidence,
} from "@/lib/types";

export const ANALYSIS_SCHEMA_VERSION = "v2" as const;
export const ANALYSIS_PROMPT_VERSION = "analysis-v2.1";

export const ANALYSIS_EVIDENCE_SOURCES = [
  "title",
  "period",
  "role",
  "description",
  "achievements",
  "relatedLinks",
  "followupAnswers",
] as const satisfies readonly ExperienceAnalysisEvidenceSource[];

export const DEFAULT_ANALYSIS_STAR: ExperienceAnalysisStar = {
  situation: "",
  task: "",
  action: "",
  result: "",
};

export function isAnalysisEvidenceSource(
  value: unknown,
): value is ExperienceAnalysisEvidenceSource {
  return ANALYSIS_EVIDENCE_SOURCES.includes(
    value as ExperienceAnalysisEvidenceSource,
  );
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hashText(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(36);
}

function createStableGapId(
  candidate: Record<string, unknown>,
  index: number,
): string {
  const explicitId = normalizeText(candidate.id);

  if (explicitId) {
    return explicitId.slice(0, 96);
  }

  const seed = [
    normalizeText(candidate.category),
    normalizeText(candidate.title),
    normalizeText(candidate.topic),
    normalizeText(candidate.question),
  ]
    .filter(Boolean)
    .join(":");

  return `gap-${index + 1}-${hashText(seed || String(index))}`;
}

export function normalizeStringList(
  value: unknown,
  maxItems: number,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

export function normalizeAnalysisStar(
  value: unknown,
): ExperienceAnalysisStar {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_ANALYSIS_STAR };
  }

  const candidate = value as Record<string, unknown>;

  return {
    situation: normalizeText(candidate.situation),
    task: normalizeText(candidate.task),
    action: normalizeText(candidate.action),
    result: normalizeText(candidate.result),
  };
}

export function normalizeAnalysisEvidence(
  value: unknown,
  maxItems: number,
): ExperienceAnalysisEvidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const source = candidate.source;
      const quote = normalizeText(candidate.quote);
      const note = normalizeText(candidate.note);

      if (!isAnalysisEvidenceSource(source) || !quote || !note) {
        return null;
      }

      return {
        source,
        quote,
        note,
      } satisfies ExperienceAnalysisEvidence;
    })
    .filter((item): item is ExperienceAnalysisEvidence => item !== null)
    .slice(0, maxItems);
}

export function normalizeAnalysisEvidenceGaps(
  value: unknown,
  maxItems: number,
): ExperienceAnalysisEvidenceGap[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const category =
        normalizeText(candidate.category) ||
        normalizeText(candidate.targetEvidenceType) ||
        normalizeText(candidate.topic) ||
        "other";
      const title =
        normalizeText(candidate.title) ||
        normalizeText(candidate.topic) ||
        category;
      const topic = normalizeText(candidate.topic) || title;
      const reason = normalizeText(candidate.reason);
      const question = normalizeText(candidate.question);
      const answer = normalizeText(candidate.answer);
      const answeredAt = normalizeText(candidate.answeredAt);
      const updatedAt = normalizeText(candidate.updatedAt);

      if (!title || !reason || !question) {
        return null;
      }

      const gap: ExperienceAnalysisEvidenceGap = {
        id: createStableGapId(candidate, index),
        category,
        title,
        topic,
        reason,
        question,
        answer,
        updatedAt,
      };

      if (answeredAt) {
        gap.answeredAt = answeredAt;
      }

      return gap;
    })
    .filter((item): item is ExperienceAnalysisEvidenceGap => item !== null)
    .slice(0, maxItems);
}

export function normalizeCoverLetterAngles(
  value: unknown,
  maxItems: number,
): ExperienceAnalysisCoverLetterAngle[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const title = normalizeText(candidate.title);
      const angle = normalizeText(candidate.angle);
      const supportingEvidence = normalizeStringList(
        candidate.supportingEvidence,
        4,
      );
      const caution = normalizeText(candidate.caution);

      if (!title || !angle) {
        return null;
      }

      return {
        title,
        angle,
        supportingEvidence,
        caution,
      } satisfies ExperienceAnalysisCoverLetterAngle;
    })
    .filter(
      (item): item is ExperienceAnalysisCoverLetterAngle => item !== null,
    )
    .slice(0, maxItems);
}

export function normalizeCompetencyEvidence(
  value: unknown,
  maxItems: number,
): ExperienceAnalysisCompetencyEvidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const competency = normalizeText(candidate.competency);
      const evidence = normalizeStringList(candidate.evidence, 4);
      const explanation = normalizeText(candidate.explanation);

      if (!competency || evidence.length === 0 || !explanation) {
        return null;
      }

      return {
        competency,
        evidence,
        explanation,
      } satisfies ExperienceAnalysisCompetencyEvidence;
    })
    .filter(
      (item): item is ExperienceAnalysisCompetencyEvidence => item !== null,
    )
    .slice(0, maxItems);
}

export function normalizeExperienceAnalysis(
  value: unknown,
): ExperienceAnalysis | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const schemaVersion =
    candidate.schemaVersion === "v2" || candidate.schemaVersion === "v1"
      ? candidate.schemaVersion
      : "v1";
  const id = normalizeText(candidate.id);
  const experienceId = normalizeText(candidate.experienceId);
  const summary = normalizeText(candidate.summary);
  const generatedAt = normalizeText(candidate.generatedAt);
  const sourceExperienceUpdatedAt = normalizeText(
    candidate.sourceExperienceUpdatedAt,
  );

  if (!id || !experienceId || !summary || !generatedAt || !sourceExperienceUpdatedAt) {
    return null;
  }

  return {
    id,
    experienceId,
    schemaVersion,
    promptVersion: normalizeText(candidate.promptVersion),
    model: normalizeText(candidate.model),
    summary,
    competencyTags: normalizeStringList(candidate.competencyTags, 12),
    achievements: normalizeStringList(candidate.achievements, 12),
    keywords: normalizeStringList(candidate.keywords, 20),
    star: normalizeAnalysisStar(candidate.star),
    evidence: normalizeAnalysisEvidence(candidate.evidence, 12),
    evidenceGaps: normalizeAnalysisEvidenceGaps(candidate.evidenceGaps, 8),
    coverLetterAngles: normalizeCoverLetterAngles(
      candidate.coverLetterAngles,
      6,
    ),
    competencyEvidence: normalizeCompetencyEvidence(
      candidate.competencyEvidence,
      8,
    ),
    generatedAt,
    sourceExperienceUpdatedAt,
  };
}
