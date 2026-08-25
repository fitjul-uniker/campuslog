import Link from "next/link";
import { History } from "lucide-react";

import {
  LoadingState,
  LoadingStatus,
} from "@/components/common/LoadingState";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { RECOMMENDATION_PAGE_DESCRIPTION } from "./recommendationPagePresentation";

export function RecommendationPageBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="breadcrumb-brand-link">
            CampusLog
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>AI 기반 활동 추천</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function RecommendationPageHeader() {
  return (
    <section className="page-header recommendation-page-header primary-page-heading">
      <div className="recommendation-page-header-copy">
        <h1>AI 기반 활동 추천</h1>
        <p className="page-description primary-page-description">
          {RECOMMENDATION_PAGE_DESCRIPTION}
        </p>
      </div>

      <div className="header-actions recommendation-header-actions">
        <Link
          href="/recommend/history"
          className="button button-ghost recommendation-header-link liquid-capsule"
        >
          <History className="button-icon" aria-hidden="true" />
          추천 기록
        </Link>
      </div>
    </section>
  );
}

type RecommendationPageLoadingStateProps = {
  variant: "recommendation" | "recommendation-form";
};

export function RecommendationPageLoadingState({
  variant,
}: RecommendationPageLoadingStateProps) {
  return (
    <div className="page-stack page-stack-narrow recommendation-page primary-page">
      <RecommendationPageBreadcrumb />
      <RecommendationPageHeader />
      <LoadingState
        message="AI 기반 활동 추천을 불러오는 중입니다."
        variant={variant}
        showIntro={false}
      />
    </div>
  );
}

export function RecommendationPagePendingState() {
  return (
    <div className="page-stack page-stack-narrow recommendation-page primary-page">
      <RecommendationPageBreadcrumb />
      <RecommendationPageHeader />
      <LoadingStatus message="AI 기반 활동 추천을 준비하는 중입니다." />
    </div>
  );
}
