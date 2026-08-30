type EmptyStateAction = {
  href: string;
  label: string;
};

export type RecommendationEmptyStatePresentation = {
  title: string;
  description: string;
  primaryAction: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
};

export const RECOMMENDATION_PAGE_DESCRIPTION =
  "지원 문항·JD에 맞는 경험을 찾아보세요.";

export function getRecommendationEmptyStatePresentation(
  trackedActivityCount: number,
): RecommendationEmptyStatePresentation {
  const hasTrackedActivity = trackedActivityCount > 0;

  if (!hasTrackedActivity) {
    return {
      title: "추천에 사용할 경험이 아직 없어요",
      description:
        "나의 활동에 경험을 등록하면 바로 추천에 활용할 수 있어요.",
      primaryAction: {
        href: "/experiences/new",
        label: "활동 추가",
      },
    };
  }

  return {
    title: "진행 중인 활동을 경험으로 정리해 주세요",
    description:
      "쌓아 둔 기록을 확인하고 완료 경험으로 정리하면 추천에 활용할 수 있어요.",
    primaryAction: {
      href: "/dashboard",
      label: "진행 활동 확인하기",
    },
    secondaryAction: {
      href: "/experiences/new",
      label: "활동 추가",
    },
  };
}
