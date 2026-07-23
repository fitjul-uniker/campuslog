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

export type RecommendationExample =
  | string
  | {
      label: string;
      input: string;
    };

export type RecommendationPurposeConfig = {
  value: RecommendationPurpose;
  label: string;
  inputLabel: string;
  description: string;
  promptTitle: string;
  promptDescription: string;
  placeholder: string;
  examples: RecommendationExample[];
  generationOptions: RecommendationGenerationOption[];
  primaryActionLabel: string;
};

const BACKEND_DEVELOPER_JD_SAMPLE = `백엔드 개발자 채용공고

주요 업무
- 사용자 활동 데이터와 추천 결과를 안정적으로 저장하고 조회하는 API를 설계 및 개발합니다.
- 서비스 핵심 기능의 성능 병목을 분석하고 데이터베이스 쿼리와 서버 로직을 개선합니다.
- 프론트엔드, 기획, 디자인 팀과 협업해 요구사항을 API 스펙과 데이터 모델로 구체화합니다.

자격요건
- Node.js, TypeScript 또는 이에 준하는 백엔드 개발 경험
- REST API 설계 및 관계형 데이터베이스를 활용한 프로젝트 경험
- Git 기반 협업과 코드 리뷰 경험
- 문제 원인을 로그, 지표, 재현 과정을 통해 분석하고 개선한 경험

우대사항
- Supabase, PostgreSQL, Next.js Route Handler 사용 경험
- 인증, 권한, 사용자별 데이터 분리 구조를 구현한 경험
- AI API 연동 또는 비동기 작업 처리 경험`;

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
      "실제 면접 질문을 입력하면 답변에 활용할 경험과 강조할 근거를 추천합니다.",
    placeholder: "예: REST API를 설계하거나 개선한 경험을 설명해 주세요.",
    examples: [
      "이전 프로젝트에서 본인이 맡았던 역할과 가장 의미 있었던 성과를 설명해 주세요.",
      "팀 프로젝트를 진행하면서 가장 어려웠던 문제는 무엇이었고, 이를 어떻게 해결했나요?",
      "프로젝트에서 사용한 기술 스택을 선택한 이유와 다른 대안 대비 장단점을 설명해 주세요.",
      "새로운 기술을 빠르게 학습해 실제 프로젝트에 적용한 경험이 있나요?",
      "본인의 기술적 판단이 틀렸던 경험과 이후 어떻게 대응했는지 설명해 주세요.",
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
      "기업의 자기소개서 문항을 입력하면 적합한 경험과 활용 방향을 추천합니다.",
    placeholder: "예: 지원 직무와 관련된 역량을 발휘한 경험을 작성해 주세요.",
    examples: [
      "지원 직무와 관련된 역량을 발휘하여 구체적인 결과를 만든 경험을 작성해 주세요.",
      "공동의 목표를 달성하기 위해 다른 사람들과 협력한 경험과 본인의 기여를 작성해 주세요.",
      "기존 방식의 문제점을 발견하고 새로운 방법으로 개선한 경험을 작성해 주세요.",
      "도전적인 목표를 스스로 설정하고 끝까지 실행한 경험을 작성해 주세요.",
      "실패하거나 기대한 결과를 얻지 못했던 경험과, 이를 통해 배운 점을 작성해 주세요.",
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
      "채용공고의 주요 업무, 자격요건, 우대사항을 붙여넣으면 근거가 있는 경험과 부족한 부분을 분석합니다.",
    placeholder:
      "지원하려는 채용공고의 담당 업무, 자격요건, 우대사항, 기술 스택 등을 붙여 넣어 주세요.",
    examples: [
      {
        label: "채용공고의 주요 업무, 자격요건, 우대사항을 그대로 붙여넣어 주세요.",
        input: BACKEND_DEVELOPER_JD_SAMPLE,
      },
      "JD의 필수요건별로 근거가 있는 경험과 부족한 부분을 분석해 주세요.",
      "이 JD에 맞는 경험 Top 3와 자기소개서·면접 활용 방향을 정리해 주세요.",
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
      "포트폴리오, 대외활동, 장학금, 발표 등 다양한 목적에 활용할 경험을 추천합니다.",
    placeholder: "예: 포트폴리오에 넣을 백엔드 프로젝트를 추천해 주세요.",
    examples: [
      "백엔드 개발자 포트폴리오에서 대표 프로젝트로 보여줄 경험 3개를 추천해 주세요.",
      "생성형 AI 대외활동 지원서에서 지원 동기와 활동 역량을 보여줄 경험을 추천해 주세요.",
      "대외활동 지원서의 ‘팀에 어떻게 기여할 수 있는가’ 문항에 활용할 경험을 추천해 주세요.",
      "장학금 지원서에서 자기주도적인 성장과 학업 외 활동을 보여줄 경험을 추천해 주세요.",
      "5분 프로젝트 발표에서 문제 발견부터 결과물 완성까지 설명하기 좋은 경험을 추천해 주세요.",
      "처음 시작했을 때보다 가장 크게 성장한 과정을 보여주는 경험 3개를 시간순으로 추천해 주세요.",
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
