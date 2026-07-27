type EmptyStateAction = {
  href: string;
  label: string;
};

export type RecommendationEmptyStatePresentation = {
  title: string;
  description: string;
  primaryAction: EmptyStateAction;
  secondaryAction: EmptyStateAction;
};

export const RECOMMENDATION_PAGE_DESCRIPTION =
  "지원 문항이나 JD에 어떤 경험을 쓸지 고민될 때 활용해 보세요.";

export function getRecommendationEmptyStatePresentation(
  trackedActivityCount: number,
): RecommendationEmptyStatePresentation {
  const hasTrackedActivity = trackedActivityCount > 0;

  return {
    title: hasTrackedActivity
      ? "진행 중인 활동을 경험으로 정리해 주세요"
      : "추천에 사용할 경험이 아직 없어요",
    description: hasTrackedActivity
      ? "쌓아 둔 기록을 확인하고 완료 경험으로 정리하면 추천에 활용할 수 있어요."
      : "새 활동을 시작해 기록을 쌓거나, 이미 끝난 활동을 바로 등록해 주세요.",
    primaryAction: {
      href: hasTrackedActivity ? "/dashboard" : "/activities/new",
      label: hasTrackedActivity ? "진행 활동 확인하기" : "활동 추가",
    },
    secondaryAction: {
      href: "/experiences/new",
      label: "과거 활동 기록하기",
    },
  };
}
