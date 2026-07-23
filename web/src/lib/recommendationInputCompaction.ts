import type {
  Experience,
  ExperienceAnalysis,
  RecommendationPurpose,
} from "@/lib/types";

export const RECOMMENDATION_CONTEXT_REQUEST_BUDGET_BYTES = 72_000;
export const MAX_RECOMMENDATION_CONTEXT_EXPERIENCES = 18;

type CreateRecommendationRequestContextInput = {
  purpose: RecommendationPurpose;
  prompt: string;
  experiences: Experience[];
  analyses: ExperienceAnalysis[];
};

export type RecommendationRequestContextStats = {
  totalExperienceCount: number;
  selectedExperienceCount: number;
  omittedExperienceCount: number;
  totalAnalysisCount: number;
  selectedAnalysisCount: number;
  estimatedRequestBytes: number;
};

export type RecommendationRequestContext = {
  experiences: Experience[];
  analyses: ExperienceAnalysis[];
  stats: RecommendationRequestContextStats;
};

type ScoredExperience = {
  experience: Experience;
  analysis: ExperienceAnalysis | null;
  score: number;
  index: number;
  updatedAtMs: number;
};

const TERM_PATTERN = /[0-9a-z가-힣+#.]{2,}/gi;

const GENERIC_PROMPT_TERMS = new Set([
  "ai",
  "top",
  "가능",
  "관련",
  "구체",
  "기반",
  "나의",
  "대한",
  "대해",
  "본인",
  "사용",
  "설명",
  "위해",
  "이를",
  "작성",
  "저장",
  "질문",
  "추천",
  "통해",
  "활동",
  "해당",
]);

const PURPOSE_TERMS: Record<RecommendationPurpose, string[]> = {
  interview: [
    "면접",
    "질문",
    "역할",
    "문제",
    "해결",
    "기술",
    "협업",
    "판단",
    "학습",
    "성과",
  ],
  cover_letter: [
    "자기소개서",
    "문항",
    "역량",
    "성과",
    "배운",
    "협력",
    "문제",
    "개선",
    "도전",
    "실패",
  ],
  jd: [
    "jd",
    "job",
    "description",
    "채용",
    "업무",
    "자격요건",
    "우대사항",
    "기술",
    "스택",
    "협업",
    "api",
  ],
  other: [
    "포트폴리오",
    "지원서",
    "발표",
    "프로젝트",
    "성장",
    "성과",
    "협업",
    "문제",
    "개선",
  ],
};

const PROMPT_SIGNAL_GROUPS = [
  {
    triggers: ["실패", "기대한 결과", "얻지 못", "배운 점", "배운점"],
    evidence: [
      "실패",
      "기대",
      "얻지 못",
      "아쉬",
      "부족",
      "어려",
      "문제",
      "갈등",
      "실수",
      "개선",
      "배운",
      "회고",
      "재시도",
      "피드백",
      "원인",
      "대응",
    ],
  },
  {
    triggers: ["협력", "협업", "공동", "팀"],
    evidence: [
      "협력",
      "협업",
      "팀",
      "공동",
      "커뮤니케이션",
      "조율",
      "갈등",
      "역할",
      "기여",
    ],
  },
  {
    triggers: ["기술", "스택", "api", "개발", "구현"],
    evidence: [
      "기술",
      "스택",
      "api",
      "개발",
      "구현",
      "설계",
      "성능",
      "데이터",
      "자동화",
    ],
  },
  {
    triggers: ["도전", "목표", "성과", "성장"],
    evidence: [
      "도전",
      "목표",
      "성과",
      "성장",
      "완료",
      "달성",
      "개선",
      "변화",
      "결과",
    ],
  },
] as const;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number): string {
  const normalizedValue = normalizeWhitespace(value);
  const characters = Array.from(normalizedValue);

  if (characters.length <= maxLength) {
    return normalizedValue;
  }

  return `${characters.slice(0, Math.max(0, maxLength - 3)).join("")}...`;
}

function truncateList(
  values: string[],
  maxItems: number,
  maxItemLength: number,
): string[] {
  return values
    .map((value) => truncateText(value, maxItemLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase("ko-KR");
}

function uniqueTerms(values: string[]): string[] {
  const seenTerms = new Set<string>();

  return values
    .map((value) => normalizeSearchText(value).trim())
    .filter((value) => value.length >= 2 && !GENERIC_PROMPT_TERMS.has(value))
    .filter((value) => {
      if (seenTerms.has(value)) {
        return false;
      }

      seenTerms.add(value);
      return true;
    });
}

function extractSearchTerms(value: string): string[] {
  return uniqueTerms(value.match(TERM_PATTERN) ?? []);
}

function getPromptSignalTerms(prompt: string): string[] {
  const normalizedPrompt = normalizeSearchText(prompt);

  return uniqueTerms(
    PROMPT_SIGNAL_GROUPS.flatMap((group) =>
      group.triggers.some((trigger) =>
        normalizedPrompt.includes(normalizeSearchText(trigger)),
      )
        ? group.evidence
        : [],
    ),
  );
}

function includesTerm(text: string, term: string): boolean {
  return text.includes(normalizeSearchText(term));
}

function addTermScore(text: string, terms: string[], weight: number): number {
  if (!text) {
    return 0;
  }

  const normalizedText = normalizeSearchText(text);

  return terms.reduce(
    (score, term) => score + (includesTerm(normalizedText, term) ? weight : 0),
    0,
  );
}

function getTimestampMs(value: string): number {
  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function scoreExperience(
  experience: Experience,
  analysis: ExperienceAnalysis | null,
  terms: string[],
  index: number,
): number {
  const starText = analysis ? Object.values(analysis.star).join(" ") : "";
  const gapAnswerText =
    analysis?.evidenceGaps
      .map((gap) => [gap.title, gap.reason, gap.question, gap.answer].join(" "))
      .join(" ") ?? "";
  const keywordText = analysis?.keywords.join(" ") ?? "";
  const recencyScore = Math.max(0, 4 - index * 0.2);

  return (
    addTermScore(experience.title, terms, 7) +
    addTermScore(experience.role, terms, 5) +
    addTermScore(experience.achievements, terms, 4) +
    addTermScore(experience.description, terms, 3) +
    addTermScore(analysis?.summary ?? "", terms, 3) +
    addTermScore(keywordText, terms, 6) +
    addTermScore(starText, terms, 2) +
    addTermScore(gapAnswerText, terms, 4) +
    (analysis ? 3 : 0) +
    (experience.analysisStatus === "analyzed" ? 2 : 0) +
    recencyScore
  );
}

function compactExperience(experience: Experience): Experience {
  return {
    ...experience,
    title: truncateText(experience.title, 120),
    period: truncateText(experience.period, 80),
    role: truncateText(experience.role, 120),
    description: truncateText(experience.description, 360),
    achievements: truncateText(experience.achievements, 180),
    relatedLinks: experience.relatedLinks
      .filter((link) => link.description.trim())
      .slice(0, 2)
      .map((link) => ({
        url: truncateText(link.url, 240),
        description: truncateText(link.description, 80),
      })),
  };
}

function compactAnalysis(analysis: ExperienceAnalysis): ExperienceAnalysis {
  return {
    ...analysis,
    summary: truncateText(analysis.summary, 160),
    competencyTags: [],
    achievements: truncateList(analysis.achievements, 3, 70),
    keywords: truncateList(analysis.keywords, 8, 24),
    star: {
      situation: truncateText(analysis.star.situation, 90),
      task: truncateText(analysis.star.task, 90),
      action: truncateText(analysis.star.action, 90),
      result: truncateText(analysis.star.result, 90),
    },
    evidence: [],
    evidenceGaps: analysis.evidenceGaps
      .filter(
        (gap) =>
          gap.answer.trim() ||
          gap.question.trim() ||
          gap.reason.trim() ||
          gap.title.trim(),
      )
      .slice(0, 2)
      .map((gap) => ({
        ...gap,
        category: truncateText(gap.category, 40),
        title: truncateText(gap.title, 40),
        topic: truncateText(gap.topic, 40),
        reason: truncateText(gap.reason, 70),
        question: truncateText(gap.question, 80),
        answer: truncateText(gap.answer, 130),
      })),
    coverLetterAngles: [],
    competencyEvidence: [],
  };
}

function estimateRequestBytes(input: {
  purpose: RecommendationPurpose;
  prompt: string;
  experiences: Experience[];
  analyses: ExperienceAnalysis[];
}): number {
  return new TextEncoder().encode(
    JSON.stringify({
      purpose: input.purpose,
      prompt: input.prompt,
      experiences: input.experiences,
      analyses: input.analyses,
      stream: true,
    }),
  ).length;
}

export function createRecommendationRequestContext({
  purpose,
  prompt,
  experiences,
  analyses,
}: CreateRecommendationRequestContextInput): RecommendationRequestContext {
  const analysesByExperienceId = new Map(
    analyses.map((analysis) => [analysis.experienceId, analysis]),
  );
  const terms = uniqueTerms([
    ...extractSearchTerms(prompt),
    ...PURPOSE_TERMS[purpose],
    ...getPromptSignalTerms(prompt),
  ]);
  const scoredExperiences = experiences
    .map<ScoredExperience>((experience, index) => {
      const analysis = analysesByExperienceId.get(experience.id) ?? null;

      return {
        experience,
        analysis,
        score: scoreExperience(experience, analysis, terms, index),
        index,
        updatedAtMs: getTimestampMs(experience.updatedAt),
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.updatedAtMs !== left.updatedAtMs) {
        return right.updatedAtMs - left.updatedAtMs;
      }

      return left.index - right.index;
    });
  const selectedExperiences: Experience[] = [];
  const selectedAnalyses: ExperienceAnalysis[] = [];

  for (const scoredExperience of scoredExperiences) {
    const nextExperience = compactExperience(scoredExperience.experience);
    const nextAnalysis = scoredExperience.analysis
      ? compactAnalysis(scoredExperience.analysis)
      : null;
    const nextExperiences = [...selectedExperiences, nextExperience];
    const nextAnalyses = nextAnalysis
      ? [...selectedAnalyses, nextAnalysis]
      : selectedAnalyses;
    const nextEstimatedBytes = estimateRequestBytes({
      purpose,
      prompt,
      experiences: nextExperiences,
      analyses: nextAnalyses,
    });

    if (
      nextEstimatedBytes <= RECOMMENDATION_CONTEXT_REQUEST_BUDGET_BYTES ||
      selectedExperiences.length === 0
    ) {
      selectedExperiences.push(nextExperience);

      if (nextAnalysis) {
        selectedAnalyses.push(nextAnalysis);
      }
    } else if (nextAnalysis) {
      const nextEstimatedBytesWithoutAnalysis = estimateRequestBytes({
        purpose,
        prompt,
        experiences: nextExperiences,
        analyses: selectedAnalyses,
      });

      if (
        nextEstimatedBytesWithoutAnalysis <=
        RECOMMENDATION_CONTEXT_REQUEST_BUDGET_BYTES
      ) {
        selectedExperiences.push(nextExperience);
      } else {
        break;
      }
    } else {
      break;
    }

    if (
      selectedExperiences.length >= MAX_RECOMMENDATION_CONTEXT_EXPERIENCES
    ) {
      break;
    }
  }

  const estimatedRequestBytes = estimateRequestBytes({
    purpose,
    prompt,
    experiences: selectedExperiences,
    analyses: selectedAnalyses,
  });

  return {
    experiences: selectedExperiences,
    analyses: selectedAnalyses,
    stats: {
      totalExperienceCount: experiences.length,
      selectedExperienceCount: selectedExperiences.length,
      omittedExperienceCount: Math.max(
        0,
        experiences.length - selectedExperiences.length,
      ),
      totalAnalysisCount: analyses.length,
      selectedAnalysisCount: selectedAnalyses.length,
      estimatedRequestBytes,
    },
  };
}
