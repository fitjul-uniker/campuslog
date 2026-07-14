import { NextResponse } from "next/server";

import {
  ANALYSIS_EVIDENCE_SOURCES,
  ANALYSIS_PROMPT_VERSION,
  ANALYSIS_SCHEMA_VERSION,
  normalizeAnalysisEvidence,
  normalizeAnalysisEvidenceGaps,
  normalizeAnalysisStar,
  normalizeCompetencyEvidence,
  normalizeCoverLetterAngles,
  normalizeStringList,
} from "@/lib/analysisResult";
import {
  AI_API_REQUEST_LIMITS,
  consumeAiApiRateLimit,
  createAiApiErrorResponse as createErrorResponse,
  rejectTooLargeAiApiRequest,
  requireAuthenticatedAiApiUser,
} from "@/lib/aiApiProtection";
import {
  hasAnsweredFollowup,
  normalizeExperienceFollowup,
} from "@/lib/experienceFollowupResult";
import {
  MAX_RELATED_LINK_DESCRIPTION_LENGTH,
  MAX_RELATED_LINKS,
  MAX_RELATED_LINK_URL_LENGTH,
  parseRelatedLinks,
} from "@/lib/relatedLinks";
import type {
  AnalysisApiResult,
  AnalyzeRequest,
  AnalyzeResponse,
  RelatedLink,
  Experience,
  ExperienceFollowup,
} from "@/lib/types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const ANALYSIS_MODEL = "gpt-4.1-mini";
const OPENAI_REQUEST_TIMEOUT_MS =
  AI_API_REQUEST_LIMITS.analyze.openAiTimeoutMs;
const INSUFFICIENT_ANALYSIS_MESSAGE =
  "분석할 만한 경험 정보가 부족합니다. 활동 내용, 본인이 한 역할, 결과나 배운 점을 조금 더 구체적으로 작성해주세요.";
const MIN_ANALYSIS_TOTAL_CHAR_COUNT = 16;
const MIN_ANALYSIS_ACTION_CHAR_COUNT = 10;
const MIN_COMPETENCY_ACTION_CHAR_COUNT = 24;
const MAX_ID_LENGTH = 160;
const MAX_EXPERIENCE_TITLE_LENGTH = 200;
const MAX_EXPERIENCE_PERIOD_LENGTH = 120;
const MAX_EXPERIENCE_ROLE_LENGTH = 200;
const MAX_EXPERIENCE_DESCRIPTION_LENGTH = 8_000;
const MAX_EXPERIENCE_ACHIEVEMENTS_LENGTH = 4_000;
const MAX_TIMESTAMP_LENGTH = 100;
const MAX_ANALYSIS_FOLLOWUP_COUNT = 12;
const MAX_ANALYSIS_FOLLOWUP_ANSWER_COUNT = 24;
const MAX_ANALYSIS_FOLLOWUP_ANSWER_LENGTH = 1_600;
const MAX_SERIALIZED_FOLLOWUPS_LENGTH = 32_000;
const PLACEHOLDER_VALUES = new Set([
  "test",
  "tests",
  "testtest",
  "testest",
  "testing",
  "테스트",
  "asdf",
  "asdfasdf",
  "qwer",
  "qwerqwer",
  "dummy",
  "sample",
  "샘플",
  "예시",
  "없음",
  "없다",
  "없습니다",
  "해당없음",
  "내용없음",
  "기록없음",
  "몰라",
  "모름",
  "미정",
  "무",
  "none",
  "null",
  "undefined",
]);
const REPEATED_PLACEHOLDER_TOKENS = [
  "test",
  "테스트",
  "asdf",
  "qwer",
  "dummy",
  "sample",
  "샘플",
];

const analysisEvidenceItemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["source", "quote", "note"],
  properties: {
    source: {
      type: "string",
      enum: ANALYSIS_EVIDENCE_SOURCES,
      description: "quote가 나온 원본 입력 필드",
    },
    quote: {
      type: "string",
      description:
        "원본 입력에서 직접 확인되는 짧은 근거 문구. 원문에 없으면 만들지 않음",
    },
    note: {
      type: "string",
      description: "이 근거가 분석 결과와 연결되는 이유",
    },
  },
} as const;

const analysisResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "competencyTags",
    "achievements",
    "keywords",
    "star",
    "evidence",
    "evidenceGaps",
    "coverLetterAngles",
    "competencyEvidence",
  ],
  properties: {
    summary: {
      type: "string",
      description:
        "자기소개서, 포트폴리오, 면접 준비에 다시 활용하기 좋은 한국어 경험 요약",
    },
    competencyTags: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "string",
      },
      description:
        "경험에서 명시적 근거가 확인되는 핵심 역량 태그. 근거가 없으면 빈 배열",
    },
    achievements: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "string",
      },
      description:
        "경험에서 사용자가 실제로 기록한 주요 성과. 근거가 없으면 빈 배열",
    },
    keywords: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: {
        type: "string",
      },
      description:
        "포트폴리오, 자기소개서, 면접 준비에 활용 가능한 키워드. 근거가 없으면 빈 배열",
    },
    star: {
      type: "object",
      additionalProperties: false,
      required: ["situation", "task", "action", "result"],
      properties: {
        situation: {
          type: "string",
          description:
            "원본에서 확인되는 활동 배경이나 문제 상황. 불명확하면 빈 문자열",
        },
        task: {
          type: "string",
          description:
            "사용자가 맡은 과제나 목표. 원본에서 확인되지 않으면 빈 문자열",
        },
        action: {
          type: "string",
          description:
            "사용자가 직접 한 행동. 원본에서 확인되지 않으면 빈 문자열",
        },
        result: {
          type: "string",
          description:
            "원본에 기록된 결과, 성과, 배운 점. 확인되지 않으면 빈 문자열",
        },
      },
    },
    evidence: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: analysisEvidenceItemSchema,
      description:
        "분석에 사용한 원본 근거. quote는 입력 필드의 짧은 원문 문구여야 함",
    },
    evidenceGaps: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["topic", "reason", "question"],
        properties: {
          topic: {
            type: "string",
            description: "부족한 정보의 주제",
          },
          reason: {
            type: "string",
            description:
              "현재 기록만으로 사실처럼 말하기 어려운 이유",
          },
          question: {
            type: "string",
            description:
              "사용자가 다음에 보완하면 좋은 구체적인 질문",
          },
        },
      },
      description:
        "근거가 약하거나 원본에 없는 성과, 수치, 역할, 결과는 여기에 분리",
    },
    coverLetterAngles: {
      type: "array",
      minItems: 0,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "angle", "supportingEvidence", "caution"],
        properties: {
          title: {
            type: "string",
            description: "자기소개서 소재 각도의 짧은 제목",
          },
          angle: {
            type: "string",
            description:
              "자기소개서나 지원서에서 이 경험을 풀어낼 관점. 사실처럼 과장하지 않음",
          },
          supportingEvidence: {
            type: "array",
            minItems: 0,
            maxItems: 3,
            items: {
              type: "string",
            },
            description: "해당 각도를 뒷받침하는 원본 근거 문구",
          },
          caution: {
            type: "string",
            description:
              "과장하지 않기 위해 주의할 점. 없으면 빈 문자열",
          },
        },
      },
      description:
        "자기소개서에 바로 활용 가능한 소재 관점. 확인된 사실과 제안을 구분",
    },
    competencyEvidence: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["competency", "evidence", "explanation"],
        properties: {
          competency: {
            type: "string",
            description: "근거가 있는 역량 이름",
          },
          evidence: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: {
              type: "string",
            },
            description: "역량 판단에 사용한 원본 근거 문구",
          },
          explanation: {
            type: "string",
            description: "근거와 역량이 연결되는 이유",
          },
        },
      },
      description:
        "핵심 역량별 근거. 근거가 약하면 만들지 말고 evidenceGaps로 분리",
    },
  },
} as const;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasTextWithinLimit(value: unknown, maxLength: number): value is string {
  return hasText(value) && value.length <= maxLength;
}

function isStringWithinLimit(
  value: unknown,
  maxLength: number,
  allowEmpty = false,
): value is string {
  return (
    typeof value === "string" &&
    value.length <= maxLength &&
    (allowEmpty || value.trim().length > 0)
  );
}

function isAnalysisStatus(value: unknown): value is Experience["analysisStatus"] {
  return (
    value === "unanalyzed" ||
    value === "analyzed" ||
    value === "needs_reanalysis"
  );
}

function areRelatedLinksWithinLimit(links: RelatedLink[]): boolean {
  return (
    links.length <= MAX_RELATED_LINKS &&
    links.every(
      (link) =>
        link.url.length <= MAX_RELATED_LINK_URL_LENGTH &&
        link.description.length <= MAX_RELATED_LINK_DESCRIPTION_LENGTH,
    )
  );
}

function compactMeaningfulText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ]+/gi, "");
}

function isRepeatedTokenValue(value: string, token: string): boolean {
  if (value.length <= token.length || value.length % token.length !== 0) {
    return false;
  }

  return token.repeat(value.length / token.length) === value;
}

function looksLikePlaceholder(value: string): boolean {
  const compactValue = compactMeaningfulText(value);

  if (!compactValue) {
    return true;
  }

  if (PLACEHOLDER_VALUES.has(compactValue)) {
    return true;
  }

  if (/^[tes]+$/i.test(compactValue) && compactValue.length <= 12) {
    return true;
  }

  if (/^\d+$/.test(compactValue) && compactValue.length <= 12) {
    return true;
  }

  if (
    compactValue.length >= 3 &&
    new Set(Array.from(compactValue)).size === 1
  ) {
    return true;
  }

  return REPEATED_PLACEHOLDER_TOKENS.some((token) =>
    isRepeatedTokenValue(compactValue, token),
  );
}

function getMeaningfulFieldText(value: string): string {
  return looksLikePlaceholder(value) ? "" : value.trim();
}

function countMeaningfulCharacters(values: string[]): number {
  return values.reduce((total, value) => {
    const meaningfulText = getMeaningfulFieldText(value);

    return total + compactMeaningfulText(meaningfulText).length;
  }, 0);
}

type FollowupAnswerContext = {
  followupId: string;
  questionId: string;
  question: string;
  answer: string;
};

function getFollowupAnswerContexts(
  followups: ExperienceFollowup[],
): FollowupAnswerContext[] {
  return followups.flatMap((followup) => {
    const questionsById = new Map(
      followup.questions.map((question) => [question.id, question]),
    );

    return followup.answers.flatMap((answer) => {
      const question = questionsById.get(answer.questionId);

      if (!question || !answer.answer.trim()) {
        return [];
      }

      return [
        {
          followupId: followup.id,
          questionId: answer.questionId,
          question: question.question,
          answer: answer.answer,
        },
      ];
    });
  });
}

function hasSufficientAnalysisInput(
  experience: Experience,
  followups: ExperienceFollowup[],
): boolean {
  const followupAnswers = getFollowupAnswerContexts(followups).map(
    (item) => item.answer,
  );
  const meaningfulFieldCount = [
    experience.title,
    experience.role,
    experience.description,
    experience.achievements,
    ...followupAnswers,
  ].filter((value) => compactMeaningfulText(getMeaningfulFieldText(value)).length >= 2)
    .length;
  const totalCharCount = countMeaningfulCharacters([
    experience.title,
    experience.role,
    experience.description,
    experience.achievements,
    ...followupAnswers,
  ]);
  const actionCharCount = countMeaningfulCharacters([
    experience.description,
    experience.achievements,
    ...followupAnswers,
  ]);

  return (
    meaningfulFieldCount >= 2 &&
    totalCharCount >= MIN_ANALYSIS_TOTAL_CHAR_COUNT &&
    actionCharCount >= MIN_ANALYSIS_ACTION_CHAR_COUNT
  );
}

function hasSufficientCompetencyEvidence(
  experience: Experience,
  followups: ExperienceFollowup[],
): boolean {
  return (
    countMeaningfulCharacters([
      experience.description,
      experience.achievements,
      ...getFollowupAnswerContexts(followups).map((item) => item.answer),
    ]) >= MIN_COMPETENCY_ACTION_CHAR_COUNT
  );
}

function parseExperienceForAnalysis(value: unknown): Experience | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const relatedLinks = parseRelatedLinks(candidate.relatedLinks);

  if (
    hasTextWithinLimit(candidate.id, MAX_ID_LENGTH) &&
    hasTextWithinLimit(candidate.title, MAX_EXPERIENCE_TITLE_LENGTH) &&
    hasTextWithinLimit(candidate.period, MAX_EXPERIENCE_PERIOD_LENGTH) &&
    hasTextWithinLimit(candidate.role, MAX_EXPERIENCE_ROLE_LENGTH) &&
    hasTextWithinLimit(
      candidate.description,
      MAX_EXPERIENCE_DESCRIPTION_LENGTH,
    ) &&
    isStringWithinLimit(
      candidate.achievements,
      MAX_EXPERIENCE_ACHIEVEMENTS_LENGTH,
      true,
    ) &&
    relatedLinks !== null &&
    areRelatedLinksWithinLimit(relatedLinks) &&
    hasTextWithinLimit(candidate.createdAt, MAX_TIMESTAMP_LENGTH) &&
    hasTextWithinLimit(candidate.updatedAt, MAX_TIMESTAMP_LENGTH) &&
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

function parseFollowupsForAnalysis(
  value: unknown,
  experienceId: string,
): ExperienceFollowup[] {
  if (typeof value === "undefined" || value === null) {
    return [];
  }

  if (!Array.isArray(value) || value.length > MAX_ANALYSIS_FOLLOWUP_COUNT) {
    return [];
  }

  const serializedValue = JSON.stringify(value);

  if (serializedValue.length > MAX_SERIALIZED_FOLLOWUPS_LENGTH) {
    return [];
  }

  const answerCount = value.reduce((count, item) => {
    const candidate = normalizeExperienceFollowup(item);

    return count + (candidate?.answers.length ?? 0);
  }, 0);

  if (answerCount > MAX_ANALYSIS_FOLLOWUP_ANSWER_COUNT) {
    return [];
  }

  return value
    .map(normalizeExperienceFollowup)
    .filter(
      (followup): followup is ExperienceFollowup =>
        followup !== null &&
        followup.experienceId === experienceId &&
        followup.status !== "dismissed" &&
        hasAnsweredFollowup(followup) &&
        followup.answers.every(
          (answer) => answer.answer.length <= MAX_ANALYSIS_FOLLOWUP_ANSWER_LENGTH,
        ),
    )
    .slice(0, MAX_ANALYSIS_FOLLOWUP_COUNT);
}

function createPrompt(
  experience: Experience,
  followups: ExperienceFollowup[],
): string {
  const followupAnswers = getFollowupAnswerContexts(followups);

  return JSON.stringify(
    {
      instruction:
        "아래 대학생 활동 경험과 사용자가 별도로 답한 보완 답변을 분석해 자기소개서, 포트폴리오, 면접 준비에 다시 활용하기 좋은 v2 구조로 정리해주세요. 입력되지 않은 성과, 수치, 역할, 협업 여부를 과장하거나 꾸며내지 말고, 사용자가 기록한 내용에서 확인되는 범위만 사용하세요.",
      qualityRules: [
        "핵심 역량 태그는 사용자의 실제 행동, 문제 해결, 협업, 성과가 원문에 드러날 때만 생성합니다.",
        "활동명, 기간, 역할명만으로 역량 태그를 추정하지 않습니다.",
        "test, testtest, asdf, 없음처럼 의미 없는 입력은 분석 근거로 사용하지 않습니다.",
        "원문에 없는 성과, 수치, 협업 여부, 리더십을 사실처럼 만들지 않습니다.",
        "STAR 항목 중 원본에서 구분하기 어려운 부분은 빈 문자열로 두고 evidenceGaps에 무엇이 부족한지 적습니다.",
        "evidence.quote, coverLetterAngles.supportingEvidence, competencyEvidence.evidence는 원본 입력에 있는 짧은 문구를 사용합니다.",
        "보완 답변을 근거로 사용했다면 evidence.source는 followupAnswers를 사용하고, quote는 보완 답변 안에 실제로 있는 문구만 사용합니다.",
        "원본 경험과 보완 답변은 출처가 다릅니다. 보완 답변을 원본 description이나 achievements에 원래 있던 내용처럼 표현하지 않습니다.",
        "근거가 약한 성과나 자소서 소재는 확정 사실처럼 쓰지 말고 caution 또는 evidenceGaps로 분리합니다.",
        "자기소개서 소재 각도는 제안으로 작성하되, 원문에 없는 결과를 달성한 것처럼 표현하지 않습니다.",
        "관련 링크의 설명은 사용자가 적은 참고 정보이며, 링크 내용을 직접 열람하거나 검증했다고 가정하지 않습니다.",
      ],
      outputGuidelines: {
        summary: "2~3문장 한국어 요약",
        competencyTags:
          "0~5개. 문제 해결력, 협업/커뮤니케이션, 실행력/주도성, 분석력/데이터 활용력처럼 넓은 역량 범주 중심. 근거가 없으면 빈 배열",
        achievements: "0~5개. 동사와 결과가 보이는 주요 성과. 근거가 없으면 빈 배열",
        keywords:
          "0~8개. 구체 기술, 활동 방식, 산출물, 준비 상황에 재사용할 키워드. 근거가 없으면 빈 배열",
        star:
          "situation, task, action, result 각각 0~2문장. 확인되지 않는 필드는 빈 문자열",
        evidence:
          "0~8개. 분석에 직접 사용한 원본 근거. source는 title/period/role/description/achievements/relatedLinks 중 하나",
        evidenceGaps:
          "0~5개. 성과 수치, 사용자의 구체 행동, 결과, 협업 맥락처럼 원본에 부족한 정보와 보완 질문",
        coverLetterAngles:
          "0~3개. 자기소개서나 지원서에서 풀어낼 관점. supportingEvidence는 원본 근거 문구, caution은 과장 주의점",
        competencyEvidence:
          "0~5개. competencyTags와 연결되는 역량별 근거. 근거 문구가 없으면 만들지 않음",
      },
      experience: {
        title: experience.title,
        period: experience.period,
        role: experience.role,
        description: experience.description,
        achievements: experience.achievements,
        relatedLinks: experience.relatedLinks,
      },
      followupAnswers: followupAnswers.map((item) => ({
        followupId: item.followupId,
        questionId: item.questionId,
        question: item.question,
        answer: item.answer,
      })),
    },
    null,
    2,
  );
}

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as {
    output_text?: unknown;
    output?: unknown;
  };

  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  if (!Array.isArray(response.output)) {
    return null;
  }

  for (const item of response.output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = (item as { content?: unknown }).content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const contentItem of content) {
      if (!contentItem || typeof contentItem !== "object") {
        continue;
      }

      const text = (contentItem as { text?: unknown }).text;

      if (typeof text === "string" && text.trim()) {
        return text;
      }
    }
  }

  return null;
}

function stripJsonFence(value: string): string {
  const match = value.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (match?.[1] ?? value).trim();
}

function getEvidenceSourceText(
  experience: Experience,
  source: (typeof ANALYSIS_EVIDENCE_SOURCES)[number],
  followups: ExperienceFollowup[],
): string {
  switch (source) {
    case "title":
      return experience.title;
    case "period":
      return experience.period;
    case "role":
      return experience.role;
    case "description":
      return experience.description;
    case "achievements":
      return experience.achievements;
    case "relatedLinks":
      return experience.relatedLinks
        .map((link) => `${link.url} ${link.description}`)
        .join("\n");
    case "followupAnswers":
      return getFollowupAnswerContexts(followups)
        .map((item) => item.answer)
        .join("\n");
  }
}

function isGroundedInSource(quote: string, sourceText: string): boolean {
  const compactQuote = compactMeaningfulText(quote);
  const compactSource = compactMeaningfulText(sourceText);

  return compactQuote.length >= 2 && compactSource.includes(compactQuote);
}

function normalizeGroundedEvidence(
  value: unknown,
  experience: Experience,
  followups: ExperienceFollowup[],
) {
  return normalizeAnalysisEvidence(value, 8).filter((item) =>
    isGroundedInSource(
      item.quote,
      getEvidenceSourceText(experience, item.source, followups),
    ),
  );
}

function isGroundedEvidenceReference(
  value: string,
  experience: Experience,
  followups: ExperienceFollowup[],
  evidence: ReturnType<typeof normalizeGroundedEvidence>,
): boolean {
  const compactValue = compactMeaningfulText(value);

  if (compactValue.length < 2) {
    return false;
  }

  if (
    evidence.some((item) => {
      const compactQuote = compactMeaningfulText(item.quote);

      if (compactQuote.length < 2) {
        return false;
      }

      return (
        compactQuote.includes(compactValue) ||
        compactValue.includes(compactQuote)
      );
    })
  ) {
    return true;
  }

  return ANALYSIS_EVIDENCE_SOURCES.some((source) =>
    isGroundedInSource(value, getEvidenceSourceText(experience, source, followups)),
  );
}

function normalizeGroundedReferences(
  values: string[],
  experience: Experience,
  followups: ExperienceFollowup[],
  evidence: ReturnType<typeof normalizeGroundedEvidence>,
): string[] {
  return values.filter((value) =>
    isGroundedEvidenceReference(value, experience, followups, evidence),
  );
}

function hasStarContent(star: ReturnType<typeof normalizeAnalysisStar>): boolean {
  return Object.values(star).some(Boolean);
}

function parseAnalysisResult(
  rawOutput: string,
  experience: Experience,
  followups: ExperienceFollowup[],
): AnalysisApiResult | null {
  try {
    const parsed = JSON.parse(stripJsonFence(rawOutput)) as Record<
      string,
      unknown
    >;

    const summary =
      typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const evidence = normalizeGroundedEvidence(
      parsed.evidence,
      experience,
      followups,
    );
    const star = normalizeAnalysisStar(parsed.star);
    const competencyEvidence = hasSufficientCompetencyEvidence(
      experience,
      followups,
    )
      ? normalizeCompetencyEvidence(parsed.competencyEvidence, 5)
          .map((item) => ({
            ...item,
            evidence: normalizeGroundedReferences(
              item.evidence,
              experience,
              followups,
              evidence,
            ),
          }))
          .filter((item) => item.evidence.length > 0)
      : [];
    const rawCompetencyTags = hasSufficientCompetencyEvidence(
      experience,
      followups,
    )
      ? normalizeStringList(parsed.competencyTags, 5)
      : [];
    const competencyTags =
      rawCompetencyTags.length > 0
        ? rawCompetencyTags
        : competencyEvidence.map((item) => item.competency).slice(0, 5);
    const achievements = normalizeStringList(parsed.achievements, 5);
    const keywords = normalizeStringList(parsed.keywords, 8);
    const evidenceGaps = normalizeAnalysisEvidenceGaps(
      parsed.evidenceGaps,
      5,
    );
    const coverLetterAngles = normalizeCoverLetterAngles(
      parsed.coverLetterAngles,
      3,
    ).map((item) => ({
      ...item,
      supportingEvidence: normalizeGroundedReferences(
        item.supportingEvidence,
        experience,
        followups,
        evidence,
      ),
    }));

    if (
      !summary ||
      (competencyTags.length === 0 &&
        achievements.length === 0 &&
        keywords.length === 0 &&
        evidence.length === 0 &&
        evidenceGaps.length === 0 &&
        coverLetterAngles.length === 0 &&
        competencyEvidence.length === 0 &&
        !hasStarContent(star))
    ) {
      return null;
    }

    return {
      experienceId: experience.id,
      schemaVersion: ANALYSIS_SCHEMA_VERSION,
      promptVersion: ANALYSIS_PROMPT_VERSION,
      model: ANALYSIS_MODEL,
      summary,
      competencyTags,
      achievements,
      keywords,
      star,
      evidence,
      evidenceGaps,
      coverLetterAngles,
      competencyEvidence,
    };
  } catch {
    return null;
  }
}

async function readRequestBody(request: Request): Promise<AnalyzeRequest | null> {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return null;
    }

    const experience = parseExperienceForAnalysis(
      (body as { experience?: unknown }).experience,
    );

    if (!experience) {
      return null;
    }

    const followups = parseFollowupsForAnalysis(
      (body as { followups?: unknown }).followups,
      experience.id,
    );

    return { experience, followups };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedAiApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const rateLimitResponse = consumeAiApiRateLimit(auth.userId, "analyze");

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const requestSizeResponse = rejectTooLargeAiApiRequest(request, "analyze");

  if (requestSizeResponse) {
    return requestSizeResponse;
  }

  const body = await readRequestBody(request);

  if (!body) {
    return createErrorResponse(
      "BAD_REQUEST",
      "분석할 경험 데이터가 올바르지 않습니다.",
      400,
    );
  }

  const followups = body.followups ?? [];

  if (!hasSufficientAnalysisInput(body.experience, followups)) {
    return createErrorResponse(
      "INSUFFICIENT_INPUT",
      INSUFFICIENT_ANALYSIS_MESSAGE,
      422,
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey?.trim()) {
    return createErrorResponse(
      "MISSING_API_KEY",
      "서버에 OPENAI_API_KEY가 설정되어 있지 않습니다.",
      500,
    );
  }

  const openAiAbortController = new AbortController();
  let didOpenAiRequestTimeOut = false;
  const openAiTimeoutId = setTimeout(() => {
    didOpenAiRequestTimeOut = true;
    openAiAbortController.abort();
  }, OPENAI_REQUEST_TIMEOUT_MS);

  try {
    const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      signal: openAiAbortController.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        input: [
          {
            role: "system",
            content:
              "당신은 CampusLog의 AI 경험 분석 도우미입니다. 대학생 활동 경험을 과장 없이 분석하고, 원본 근거와 부족한 정보를 구분해 한국어로 재사용 가능한 결과만 제공합니다.",
          },
          {
            role: "user",
            content: createPrompt(body.experience, followups),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "campuslog_experience_analysis_v2",
            strict: true,
            schema: analysisResponseSchema,
          },
        },
        max_output_tokens: 2200,
        store: false,
      }),
    });

    if (!openAiResponse.ok) {
      try {
        const errorPayload = (await openAiResponse.json()) as {
          error?: {
            code?: unknown;
            type?: unknown;
          };
        };

        console.warn("CampusLog analyze OpenAI request failed", {
          status: openAiResponse.status,
          code: errorPayload.error?.code,
          type: errorPayload.error?.type,
        });
      } catch {
        console.warn("CampusLog analyze OpenAI request failed", {
          status: openAiResponse.status,
        });
      }

      return createErrorResponse(
        "OPENAI_API_ERROR",
        "AI 분석 요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
        502,
      );
    }

    const openAiPayload = (await openAiResponse.json()) as unknown;
    const outputText = extractOutputText(openAiPayload);

    if (!outputText) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "AI 분석 응답을 해석하지 못했습니다. 다시 시도해주세요.",
        502,
      );
    }

    const analysis = parseAnalysisResult(
      outputText,
      body.experience,
      followups,
    );

    if (!analysis) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "입력된 경험에서 분석에 필요한 단서를 충분히 찾지 못했습니다. 활동에서 맡은 일, 직접 한 행동, 결과나 배운 점을 조금 더 구체적으로 기록한 뒤 다시 요청해주세요.",
        502,
      );
    }

    return NextResponse.json<AnalyzeResponse>({
      ok: true,
      analysis,
    });
  } catch {
    if (didOpenAiRequestTimeOut) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "AI 분석 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        504,
      );
    }

    return createErrorResponse(
      "UNKNOWN_ERROR",
      "알 수 없는 오류로 AI 분석을 완료하지 못했습니다.",
      500,
    );
  } finally {
    clearTimeout(openAiTimeoutId);
  }
}
