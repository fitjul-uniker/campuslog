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

const PLATFORM_PAYMENT_SERVER_JD_SAMPLE = `플랫폼·결제 서비스 서버 개발 채용공고

주요 역할
- 결제·송금·자산·광고·중계·플랫폼 등 핵심 서비스 로직을 설계하고 개발합니다.
- 대용량 트래픽과 데이터를 고려해 확장 가능하고 견고한 아키텍처를 설계합니다.
- 모니터링, 장애 대응, 복구 체계, 보안 강화를 통해 서비스 성능과 안정성을 높입니다.
- 기획, 디자인, 데이터 등 다양한 직군과 협업하고 코드 리뷰와 지식 공유로 팀의 성장을 이끕니다.

지원자격·우대사항
- Java 또는 Kotlin, Spring, RDBMS를 활용한 서버 개발 경험
- 객체지향과 함수형 프로그래밍의 장점을 이해하고 상황에 맞게 적용한 경험
- Docker, Kubernetes, MSA, 대용량 데이터 처리 경험
- WebFlux 또는 Coroutine을 활용한 비동기·반응형 서버 개발 경험
- 데이터 적재·서빙, 기술 문서 작성, 발표와 지식 공유 경험

면접 관점
- 승인·정산·취소·환불 등 실시간 결제 흐름과 재고·잔액 동시성 처리
- 타임아웃, 중복 요청, 처리 지연 상황의 데이터 정합성과 복구 방법
- Saga, Outbox 등 이벤트 기반 설계와 분산 트레이싱을 활용한 원인 분석
- WebFlux 또는 Coroutine으로 리소스 효율을 개선한 사례

이 JD와 제 경험을 비교해 적합한 경험, 부족한 역량, 예상 면접 질문을 분석해 주세요.`;

const COMMERCE_BACKEND_JD_SAMPLE = `커머스 백엔드 개발 채용공고

주요 역할
- 상품, 주문, 결제, 재고, 회원, 프로모션 등 커머스 핵심 서비스를 개발하고 운영합니다.
- 트래픽 증가에 대응할 수 있는 서버와 데이터 구조를 설계합니다.
- 데이터 정합성, 응답 성능, 장애 대응 체계를 지속적으로 개선합니다.
- 여러 직군과 요구사항을 조율하고 안정적인 배포와 운영을 함께 책임집니다.

지원자격·우대사항
- Java와 Spring Framework 또는 Spring Boot 기반 서버 개발 경험
- Oracle, MySQL, PostgreSQL 등 RDBMS와 Redis 활용 경험
- 대규모 트래픽이나 대용량 데이터를 처리한 경험
- AWS, Kubernetes, CI/CD 환경에서 서비스를 개발하거나 운영한 경험

면접 관점
- 주문·결제·재고가 동시에 변경될 때 데이터 정합성을 지킨 방법
- 트래픽 급증 상황에서 병목을 찾고 성능을 개선한 방법
- 캐시 적용 기준과 데이터 불일치에 대응한 경험
- 배포 실패나 장애 발생 시 영향 범위를 줄이고 복구한 경험

이 JD에 맞춰 제 경험 중 강조할 내용과 보완해야 할 내용을 분석해 주세요.`;

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
    placeholder: "예: 프로젝트에서 맡은 역할과 가장 의미 있었던 결과를 설명해 주세요.",
    examples: [
      {
        label: "맡은 역할과 성과",
        input:
          "프로젝트나 활동에서 본인이 맡은 역할과 가장 의미 있었던 결과를 설명해 주세요.",
      },
      {
        label: "문제 해결",
        input:
          "진행 중 예상하지 못한 문제를 발견하고 해결한 경험을 설명해 주세요.",
      },
      {
        label: "협업과 갈등",
        input:
          "다른 사람과 의견이 달랐던 상황에서 어떻게 조율하고 해결했는지 설명해 주세요.",
      },
      {
        label: "주도적인 실행",
        input:
          "누가 시키지 않았지만 스스로 목표를 세우고 실행한 경험을 설명해 주세요.",
      },
      {
        label: "실패와 성장",
        input:
          "기대한 결과를 얻지 못했던 경험과 그 이후 달라진 점을 설명해 주세요.",
      },
      {
        label: "직무 연결",
        input:
          "본인의 경험 중 지원한 직무와 가장 관련 있는 경험과 그 이유를 설명해 주세요.",
      },
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
      {
        label: "지원동기",
        input:
          "해당 직무나 활동에 관심을 갖게 된 계기와 관련 경험을 작성해 주세요.",
      },
      {
        label: "직무 역량",
        input:
          "지원 분야에 필요한 역량을 발휘해 구체적인 결과를 만든 경험을 작성해 주세요.",
      },
      {
        label: "협업 경험",
        input:
          "공동의 목표를 달성하기 위해 다른 사람들과 협력한 경험과 본인의 기여를 작성해 주세요.",
      },
      {
        label: "문제 해결",
        input:
          "문제를 발견하고 원인을 파악한 뒤 해결한 경험을 작성해 주세요.",
      },
      {
        label: "도전과 성장",
        input:
          "새로운 목표에 도전하고 그 과정에서 성장한 경험을 작성해 주세요.",
      },
      {
        label: "실패와 개선",
        input:
          "실패하거나 아쉬운 결과를 얻은 경험과 이를 통해 배운 점을 작성해 주세요.",
      },
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
      {
        type: "custom",
        label: "직접 입력",
        description: "100~2000자 제한",
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
        label: "플랫폼·결제 서버 JD",
        input: PLATFORM_PAYMENT_SERVER_JD_SAMPLE,
      },
      {
        label: "커머스 백엔드 JD",
        input: COMMERCE_BACKEND_JD_SAMPLE,
      },
      {
        label: "채용공고 핵심 요약",
        input:
          "이 채용공고의 주요 업무와 핵심 요구사항을 이해하기 쉽게 정리해 주세요.",
      },
      {
        label: "요구사항과 내 경험",
        input:
          "채용공고의 필수요건과 우대사항을 항목별로 나누고, 제 경험 중 근거가 있는 부분과 부족한 부분을 비교해 주세요.",
      },
      {
        label: "적합 경험 Top 3",
        input:
          "이 직무에 가장 적합한 제 경험 3개와 추천 이유를 알려 주세요.",
      },
      {
        label: "예상 면접과 지원 전략",
        input:
          "이 채용공고를 바탕으로 예상 면접 질문을 만들고, 제 강점과 보완점, 자기소개서와 면접에서 강조할 경험을 정리해 주세요.",
      },
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
    placeholder: "예: 포트폴리오에 가장 먼저 보여줄 경험을 추천해 주세요.",
    examples: [
      {
        label: "포트폴리오 대표 경험",
        input:
          "포트폴리오에서 가장 먼저 보여주면 좋은 경험 3개를 추천해 주세요.",
      },
      {
        label: "이력서 문장 정리",
        input:
          "이 경험을 이력서에 넣을 수 있도록 역할과 결과가 드러나는 짧은 문장으로 정리해 주세요.",
      },
      {
        label: "1분 자기소개",
        input:
          "제 경험을 바탕으로 1분 자기소개에 활용할 내용을 구성해 주세요.",
      },
      {
        label: "대외활동·인턴 지원",
        input:
          "대외활동이나 인턴 지원서에 활용하기 좋은 경험과 연결 방향을 추천해 주세요.",
      },
      {
        label: "프로젝트·활동 발표",
        input:
          "이 경험을 발표할 때 문제, 과정, 결과 순서로 설명할 수 있도록 구성해 주세요.",
      },
      {
        label: "전공과 직무 연결",
        input:
          "전공이나 기존 경험을 지원하려는 직무와 자연스럽게 연결할 수 있는 경험을 찾아 주세요.",
      },
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
