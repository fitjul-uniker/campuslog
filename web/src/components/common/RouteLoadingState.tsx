"use client";

import { usePathname } from "next/navigation";

import { RecommendationPagePendingState } from "@/app/recommend/RecommendationPageScaffold";
import {
  LoadingState,
  LoadingStatus,
} from "@/components/common/LoadingState";
import { useRouteTransition } from "@/components/layout/RouteTransitionProvider";

export function RouteLoadingState() {
  const pathname = usePathname();
  const { pendingPathname } = useRouteTransition();
  const loadingPathname = pendingPathname ?? pathname;

  if (loadingPathname === "/") {
    return <LoadingStatus message="CampusLog 표지를 불러오는 중입니다." />;
  }

  if (
    loadingPathname === "/login" ||
    loadingPathname === "/signup" ||
    loadingPathname === "/onboarding"
  ) {
    return <LoadingStatus message="인증 화면을 불러오는 중입니다." />;
  }

  if (loadingPathname === "/dashboard") {
    return <LoadingState variant="dashboard" message="오늘의 기록을 불러오는 중입니다." />;
  }

  if (loadingPathname === "/experiences") {
    return <LoadingState variant="list" message="나의 활동을 불러오는 중입니다." />;
  }

  if (
    loadingPathname === "/experiences/new" ||
    loadingPathname.endsWith("/edit")
  ) {
    return <LoadingStatus message="경험 작성 화면을 불러오는 중입니다." />;
  }

  if (loadingPathname.endsWith("/analysis")) {
    return <LoadingStatus message="분석 화면을 불러오는 중입니다." />;
  }

  if (loadingPathname === "/recommend/history") {
    return <LoadingStatus message="추천 기록을 불러오는 중입니다." />;
  }

  if (loadingPathname === "/recommend") {
    return <RecommendationPagePendingState />;
  }

  if (loadingPathname === "/activities/new") {
    return <LoadingStatus message="활동 작성 화면을 불러오는 중입니다." />;
  }

  return <LoadingStatus message="상세 화면을 불러오는 중입니다." />;
}
