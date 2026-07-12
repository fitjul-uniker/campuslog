import type { Experience } from "@/lib/types";

export const sampleExperiences: Experience[] = [
  {
    id: "sample-uniker-campuslog",
    title: "CampusLog 1차 MVP 기획",
    period: "2026.06 ~ 현재",
    role: "서비스 기획 및 프론트엔드 구현",
    description:
      "대학생 활동 경험을 기록하고 AI 분석과 추천으로 다시 활용하는 MVP 흐름을 정의했습니다.",
    achievements:
      "핵심 사용자 흐름, 화면 정보구조, localStorage 기반 저장 전략을 문서화했습니다.",
    relatedLinks: [
      {
        url: "https://github.com/fitjul-uniker/campuslog",
        description: "CampusLog GitHub 저장소",
      },
    ],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-09T00:00:00.000Z",
    analysisStatus: "unanalyzed",
  },
  {
    id: "sample-data-cleanup-project",
    title: "동아리 모집 데이터 정리 프로젝트",
    period: "2026.03 - 2026.04",
    role: "데이터 정리 및 운영 지원",
    description:
      "흩어진 지원자 정보를 스프레드시트로 정리하고 운영진이 확인하기 쉬운 상태로 재구성했습니다.",
    achievements:
      "중복 지원자와 누락 정보를 빠르게 확인할 수 있어 모집 운영 시간이 줄었습니다.",
    relatedLinks: [],
    createdAt: "2026-04-10T00:00:00.000Z",
    updatedAt: "2026-04-15T00:00:00.000Z",
    analysisStatus: "unanalyzed",
  },
];
