import type {
  ActiveAnswerDraftType,
  RecommendationPurpose,
} from "@/lib/types";

export const ACTIVE_RECOMMENDATION_PURPOSES = [
  "interview",
  "cover_letter",
  "jd",
  "other",
] as const satisfies readonly RecommendationPurpose[];

export const LEGACY_RECOMMENDATION_PURPOSES = [
  "portfolio",
  "activity_application",
] as const;

export type LegacyRecommendationPurpose =
  (typeof LEGACY_RECOMMENDATION_PURPOSES)[number];

export type RecommendationGenerationOption = {
  type: ActiveAnswerDraftType;
  label: string;
  description: string;
};

export type RecommendationPurposeConfig = {
  value: RecommendationPurpose;
  label: string;
  inputLabel: string;
  description: string;
  promptTitle: string;
  promptDescription: string;
  placeholder: string;
  examples: string[];
  generationOptions: RecommendationGenerationOption[];
  primaryActionLabel: string;
};

export const RECOMMENDATION_PURPOSE_CONFIGS: Record<
  RecommendationPurpose,
  RecommendationPurposeConfig
> = {
  interview: {
    value: "interview",
    label: "면접",
    inputLabel: "면접",
    description: "예상 면접 질문에 답하기 좋은 경험을 찾습니다.",
    promptTitle: "면접 질문을 입력해 주세요",
    promptDescription:
      "예상 면접 질문을 입력하면 저장된 경험 중 답변에 가장 적합한 경험을 추천합니다.",
    placeholder: "예: REST API를 설계하거나 개선한 경험을 설명해 주세요.",
    examples: [
      "REST API를 설계하거나 개선한 경험을 설명해 주세요.",
      "팀원과 갈등이 발생했을 때 어떻게 해결했나요?",
      "실패를 통해 문제를 개선한 경험이 있나요?",
      "여러 업무의 우선순위를 조정한 경험을 말해 주세요.",
      "본인이 주도적으로 문제를 발견하고 해결한 경험이 있나요?",
    ],
    generationOptions: [
      {
        type: "interview_30s",
        label: "30초 답변",
        description: "짧게 핵심을 말하는 답변",
      },
      {
        type: "interview_60s",
        label: "1분 이상 답변",
        description: "STAR 흐름을 더 충분히 담는 답변",
      },
      {
        type: "interview_followups",
        label: "예상 꼬리 질문",
        description: "면접관이 이어 물을 질문 후보",
      },
    ],
    primaryActionLabel: "선택한 경험으로 STAR 구조 이용해서 면접 답변 만들기",
  },
  cover_letter: {
    value: "cover_letter",
    label: "자기소개서",
    inputLabel: "자기소개서",
    description: "문항의 요구 역량과 맞는 경험을 찾습니다.",
    promptTitle: "자기소개서 문항을 입력해 주세요",
    promptDescription:
      "자기소개서 문항을 입력하면 요구 역량을 분석하고 적합한 경험을 추천합니다.",
    placeholder: "예: 지원 직무와 관련된 역량을 발휘한 경험을 작성해 주세요.",
    examples: [
      "지원 직무와 관련된 역량을 발휘한 경험을 작성해 주세요.",
      "공동의 목표를 달성하기 위해 협업한 경험을 작성해 주세요.",
      "어려운 목표를 설정하고 끝까지 달성한 경험을 작성해 주세요.",
      "기존 방식의 문제점을 발견하고 개선한 경험을 작성해 주세요.",
      "실패한 경험과 이를 통해 배운 점을 작성해 주세요.",
    ],
    generationOptions: [
      {
        type: "cover_letter_300",
        label: "300자",
        description: "약 260~290자",
      },
      {
        type: "cover_letter_500",
        label: "500자",
        description: "약 440~480자",
      },
      {
        type: "cover_letter_1000",
        label: "1000자",
        description: "약 880~950자",
      },
    ],
    primaryActionLabel: "선택한 경험으로 자기소개서 초안 만들기",
  },
  jd: {
    value: "jd",
    label: "JD 분석",
    inputLabel: "JD 분석 Job Description",
    description: "Job Description과 저장된 경험의 적합도를 비교합니다.",
    promptTitle: "채용공고 내용을 붙여 넣어 주세요",
    promptDescription:
      "채용공고 전체 또는 담당 업무, 자격요건, 우대사항을 붙여 넣으면 저장된 경험과 비교해 지원 적합도를 분석합니다.",
    placeholder:
      "지원하려는 채용공고의 담당 업무, 자격요건, 우대사항, 기술 스택 등을 붙여 넣어 주세요.",
    examples: [
      "이 JD에 현재 경험으로 지원할 만한가요?",
      "필수요건과 우대사항에 맞는 경험을 찾아주세요.",
      "부족한 역량과 보완할 부분을 알려주세요.",
      "자기소개서와 면접에서 강조할 경험을 추천해 주세요.",
    ],
    generationOptions: [
      {
        type: "jd_strategy",
        label: "지원 전략",
        description: "강조 경험, 보완점, 지원 판단 정리",
      },
    ],
    primaryActionLabel: "이 JD에 맞는 지원 전략 만들기",
  },
  other: {
    value: "other",
    label: "기타",
    inputLabel: "기타",
    description: "포트폴리오, 지원서, 발표 등 자유 목적에 맞춰 찾습니다.",
    promptTitle: "경험 활용 목적이나 질문을 입력해 주세요",
    promptDescription:
      "포트폴리오, 대외활동 지원서, 장학금, 발표, 블로그 등 자유로운 목적으로 활용할 경험을 추천합니다.",
    placeholder: "예: 포트폴리오에 넣을 백엔드 프로젝트를 추천해 주세요.",
    examples: [
      "포트폴리오에 넣을 백엔드 프로젝트를 추천해 주세요.",
      "대외활동 지원서에 활용할 리더십 경험을 찾아주세요.",
      "장학금 지원서에 사용할 성장 경험을 추천해 주세요.",
      "발표에서 협업 역량을 보여줄 사례를 추천해 주세요.",
      "블로그 회고에 활용할 경험을 추천해 주세요.",
      "내 성장 과정을 가장 잘 보여주는 경험은 무엇인가요?",
    ],
    generationOptions: [
      {
        type: "custom",
        label: "맞춤 결과",
        description: "질문에 맞는 형식으로 생성",
      },
    ],
    primaryActionLabel: "맞춤 결과 만들기",
  },
};

export function normalizeRecommendationPurpose(
  value: unknown,
): RecommendationPurpose | null {
  if (
    value === "interview" ||
    value === "cover_letter" ||
    value === "jd" ||
    value === "other"
  ) {
    return value;
  }

  if (value === "portfolio" || value === "activity_application") {
    return "other";
  }

  return null;
}

export function getRecommendationPurposeConfig(
  purpose: RecommendationPurpose,
): RecommendationPurposeConfig {
  return RECOMMENDATION_PURPOSE_CONFIGS[purpose];
}

export function getGenerationOptionsForPurpose(
  purpose: RecommendationPurpose,
): RecommendationGenerationOption[] {
  return RECOMMENDATION_PURPOSE_CONFIGS[purpose].generationOptions;
}

export function getAnswerDraftPurpose(
  type: ActiveAnswerDraftType,
): RecommendationPurpose {
  if (type.startsWith("cover_letter_")) {
    return "cover_letter";
  }

  if (type.startsWith("interview_")) {
    return "interview";
  }

  if (type === "jd_strategy") {
    return "jd";
  }

  return "other";
}

export function isActiveAnswerDraftType(
  value: unknown,
): value is ActiveAnswerDraftType {
  return ACTIVE_RECOMMENDATION_PURPOSES.some((purpose) =>
    RECOMMENDATION_PURPOSE_CONFIGS[purpose].generationOptions.some(
      (option) => option.type === value,
    ),
  );
}

export function isDraftTypeAllowedForPurpose(
  purpose: RecommendationPurpose,
  type: ActiveAnswerDraftType,
): boolean {
  return RECOMMENDATION_PURPOSE_CONFIGS[purpose].generationOptions.some(
    (option) => option.type === type,
  );
}
