import { getRecommendationLoadingLayout } from "@/lib/recommendationLoadingLayout";

import { RecommendationPageLoadingState } from "./RecommendationPageScaffold";

export default async function RecommendationLoading() {
  const layout = await getRecommendationLoadingLayout();

  return (
    <RecommendationPageLoadingState
      variant={layout === "form" ? "recommendation-form" : "recommendation"}
    />
  );
}
