import type { ReactNode } from "react";

import {
  RecommendationLoadingLayoutProvider,
} from "@/components/common/RecommendationLoadingLayoutProvider";
import { getRecommendationLoadingLayout } from "@/lib/recommendationLoadingLayout";

export default async function RecommendLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const initialMode = await getRecommendationLoadingLayout();

  return (
    <RecommendationLoadingLayoutProvider initialMode={initialMode}>
      {children}
    </RecommendationLoadingLayoutProvider>
  );
}
