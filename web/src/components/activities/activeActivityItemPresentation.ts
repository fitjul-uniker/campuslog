type ActiveActivityItemInput = {
  id: string;
  title: string;
};

export function getActiveActivityItemPresentation(
  activity: ActiveActivityItemInput,
) {
  return {
    href: `/activities/${activity.id}`,
    title: activity.title,
    openLabel: `${activity.title} 활동 상세 보기`,
    menuLabel: `${activity.title} 활동 메뉴`,
    deleteLabel: `${activity.title} 활동 삭제`,
  };
}
