import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loadingSource = await readFile(
  new URL("./LoadingState.tsx", import.meta.url),
  "utf8",
);
const routeLoadingSource = await readFile(
  new URL("./RouteLoadingState.tsx", import.meta.url),
  "utf8",
);
const appLoadingSource = await readFile(
  new URL("../../app/loading.tsx", import.meta.url),
  "utf8",
);
const recommendationRouteLoadingSource = await readFile(
  new URL("../../app/recommend/loading.tsx", import.meta.url),
  "utf8",
);
const recommendationScaffoldSource = await readFile(
  new URL("../../app/recommend/RecommendationPageScaffold.tsx", import.meta.url),
  "utf8",
);
const recommendationLayoutSource = await readFile(
  new URL("../../app/recommend/layout.tsx", import.meta.url),
  "utf8",
);
const recommendationLayoutProviderSource = await readFile(
  new URL("./RecommendationLoadingLayoutProvider.tsx", import.meta.url),
  "utf8",
);
const recommendationLayoutResolverSource = await readFile(
  new URL("../../lib/recommendationLoadingLayout.ts", import.meta.url),
  "utf8",
);
const todaySource = await readFile(
  new URL("../activities/TodayDashboard.tsx", import.meta.url),
  "utf8",
);
const experiencesSource = await readFile(
  new URL("../experiences/ExperienceDashboard.tsx", import.meta.url),
  "utf8",
);
const recommendationSource = await readFile(
  new URL("../../app/recommend/page.tsx", import.meta.url),
  "utf8",
);
const historySource = await readFile(
  new URL("../../app/recommend/history/page.tsx", import.meta.url),
  "utf8",
);
const historyRouteLoadingSource = await readFile(
  new URL("../../app/recommend/history/loading.tsx", import.meta.url),
  "utf8",
);
const pinnedItemsSource = await readFile(
  new URL("../../hooks/use-pinned-items.ts", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("주요 세 화면의 공용 로딩 상태는 최종 구조를 닮은 Liquid Skeleton 프리셋을 제공한다", () => {
  for (const variant of [
    "dashboard",
    "list",
    "recommendation",
    "recommendation-form",
  ]) {
    assert.match(loadingSource, new RegExp(`\\| \\"${variant}\\"|variant === \\"${variant}\\"`));
  }

  assert.match(loadingSource, /product-loading-intro/);
  assert.match(loadingSource, /product-skeleton-page-action/);
  assert.match(
    loadingSource,
    /variant === "recommendation"[\s\S]*?variant === "recommendation-form"/,
  );
  assert.doesNotMatch(
    loadingSource,
    /\| "(?:history|detail|form|analysis|cover|auth)"/,
  );
  assert.match(loadingSource, /product-loading-surface/);
  assert.match(loadingSource, /product-loading-list-item/);
  assert.match(loadingSource, /product-loading-calendar-grid/);
  assert.match(loadingSource, /product-loading-recommendation-entry/);
  assert.match(loadingSource, /product-loading-recommendation-layout/);
  assert.doesNotMatch(
    loadingSource,
    /<div className="product-loading-recommendation"/,
  );
  assert.match(loadingSource, /product-loading-result-preview/);
  assert.match(styles, /Route and data loading — quiet Liquid Skeletons/);
  assert.match(
    styles,
    /\.product-loading-recommendation\.is-content-only\s*\{[^}]*min-height:\s*215px/,
  );
  assert.match(
    styles,
    /\.product-loading-recommendation-entry\s*\{[^}]*min-height:\s*215px[^}]*padding:\s*40px/s,
  );
  assert.match(
    styles,
    /\.product-loading\.has-page-intro(?::not\(\.product-loading-auth\))?\s*\{[^}]*align-content:\s*start[^}]*padding:\s*clamp\(76px, 9vh, 112px\) clamp\(24px, 3\.2vw, 48px\) 96px/s,
  );
  assert.match(
    styles,
    /\.product-loading-intro\s*\{[^}]*min-height:\s*78px[^}]*align-content:\s*start/s,
  );
  assert.match(
    styles,
    /\.product-loading\.has-page-intro \.product-skeleton-breadcrumb\s*\{[^}]*position:\s*absolute[^}]*top:\s*-34px/s,
  );
  assert.match(
    styles,
    /\.product-skeleton-page-action\s*\{[^}]*position:\s*absolute[^}]*width:\s*132px[^}]*height:\s*44px/s,
  );
  assert.match(
    styles,
    /@media \(max-width: 860px\)[\s\S]*?\.product-loading\.has-page-intro(?::not\(\.product-loading-auth\))?\s*\{[^}]*padding:\s*48px 20px 96px/,
  );
  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*?\.product-loading\.has-page-intro(?::not\(\.product-loading-auth\))?\s*\{[^}]*padding:\s*38px 16px 96px/,
  );
  assert.match(
    styles,
    /\.product-skeleton-block\s*\{[^}]*background:\s*var\(--product-skeleton-fill\)[^}]*animation:\s*product-skeleton-breathe/s,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.product-skeleton-block\s*\{[^}]*animation:\s*none/,
  );
  assert.match(styles, /@media \(forced-colors: active\)[\s\S]*?\.product-skeleton-block/);
});

test("라우트 전환의 시각적 스켈레톤은 세 주요 화면에만 적용한다", () => {
  assert.match(appLoadingSource, /<RouteLoadingState \/>/);
  assert.match(routeLoadingSource, /usePathname\(\)/);
  assert.match(routeLoadingSource, /useRouteTransition\(\)/);
  assert.match(routeLoadingSource, /pendingPathname \?\? pathname/);
  assert.match(routeLoadingSource, /loadingPathname === "\/dashboard"/);
  assert.match(routeLoadingSource, /loadingPathname === "\/experiences"/);
  assert.match(routeLoadingSource, /loadingPathname === "\/recommend\/history"/);
  assert.match(routeLoadingSource, /loadingPathname === "\/recommend"/);
  assert.match(routeLoadingSource, /loadingPathname\.endsWith\("\/analysis"\)/);
  assert.match(routeLoadingSource, /loadingPathname\.endsWith\("\/edit"\)/);
  assert.match(
    routeLoadingSource,
    /loadingPathname === "\/"[\s\S]*?<LoadingStatus message="CampusLog 표지를 불러오는 중입니다\."/,
  );
  assert.match(
    routeLoadingSource,
    /loadingPathname === "\/recommend"[\s\S]*?<RecommendationPagePendingState \/>/,
  );
  assert.equal(routeLoadingSource.match(/<LoadingState\b/g)?.length, 2);
  assert.doesNotMatch(
    routeLoadingSource,
    /variant="(?:auth|cover|detail|form|analysis|history|recommendation)"/,
  );
  assert.match(
    routeLoadingSource,
    /loadingPathname === "\/recommend\/history"[\s\S]*?<LoadingStatus message="추천 기록을 불러오는 중입니다\."/,
  );
  assert.match(
    historyRouteLoadingSource,
    /<LoadingStatus message="추천 기록을 불러오는 중입니다\."/,
  );
  assert.doesNotMatch(historyRouteLoadingSource, /<LoadingState\b/);
  assert.match(
    routeLoadingSource,
    /loadingPathname\.endsWith\("\/analysis"\)[\s\S]*?<LoadingStatus message="분석 화면을 불러오는 중입니다\."/,
  );
  assert.match(
    recommendationRouteLoadingSource,
    /layout === "form" \? "recommendation-form" : "recommendation"/,
  );
  assert.match(
    recommendationRouteLoadingSource,
    /<RecommendationPageLoadingState/,
  );
  const pendingStateStart = recommendationScaffoldSource.indexOf(
    "export function RecommendationPagePendingState",
  );
  const pendingStateSource = recommendationScaffoldSource.slice(pendingStateStart);
  assert.ok(pendingStateStart > -1);
  assert.match(
    pendingStateSource,
    /<RecommendationPageHeader \/>[\s\S]*?<LoadingStatus message="AI 기반 활동 추천을 준비하는 중입니다\."/,
  );
  assert.doesNotMatch(pendingStateSource, /<LoadingState\b/);
  assert.match(
    recommendationLayoutSource,
    /<RecommendationLoadingLayoutProvider initialMode=\{initialMode\}>/,
  );
  assert.doesNotMatch(recommendationLayoutProviderSource, /document\.cookie/);
  assert.match(recommendationLayoutResolverSource, /import "server-only"/);
  assert.match(
    recommendationLayoutResolverSource,
    /\.from\("experiences"\)[\s\S]*?\.select\("id", \{ count: "exact", head: true \}\)/,
  );
  assert.match(
    recommendationLayoutResolverSource,
    /return \(count \?\? 0\) > 0 \? "form" : "empty"/,
  );
});

test("데이터 초기 로딩도 오늘의 기록·나의 활동·CampusLog AI에만 스켈레톤을 유지한다", () => {
  assert.match(
    todaySource,
    /if \(activities === null\)[\s\S]*?<TodayDashboardHeader today=\{today\} \/>[\s\S]*?<LoadingState[\s\S]*?variant="dashboard"[\s\S]*?showIntro=\{false\}/,
  );
  assert.match(
    experiencesSource,
    /activityItems === null \|\| !experiencePins\.isLoaded \? \([\s\S]*?<LoadingState[\s\S]*?variant="list"[\s\S]*?showIntro=\{false\}[\s\S]*?\) : \([\s\S]*?className="dashboard-experience-workspace"/,
  );
  assert.match(
    recommendationSource,
    /if \(experiences === null\)[\s\S]*?<RecommendationPageLoadingState[\s\S]*?recommendationLoadingLayout === "form"[\s\S]*?"recommendation-form"[\s\S]*?: "recommendation"/,
  );
  assert.match(
    recommendationScaffoldSource,
    /<RecommendationPageHeader \/>[\s\S]*?<LoadingState[\s\S]*?showIntro=\{false\}/,
  );
  assert.doesNotMatch(recommendationScaffoldSource, /product-loading-intro/);
  assert.match(
    recommendationSource,
    /setRecommendationLoadingLayout\([\s\S]*?storedExperiences\.length > 0 \? "form" : "empty"/,
  );
  assert.match(
    historySource,
    /recommendations === null \|\| !recommendationPins\.isLoaded[\s\S]*?<LoadingStatus message="추천 기록을 불러오는 중입니다\."/,
  );
  assert.doesNotMatch(historySource, /<LoadingState\b/);
  assert.match(pinnedItemsSource, /const \[isLoaded, setIsLoaded\] = useState\(false\)/);
});

test("시각적 로딩과 함께 접근성 안내를 유지한다", () => {
  assert.match(
    loadingSource,
    /export function LoadingStatus[\s\S]*?className="sr-only"[\s\S]*?role="status"[\s\S]*?aria-live="polite"[\s\S]*?aria-busy="true"/,
  );
  assert.match(loadingSource, /<span className="sr-only">\{message\}<\/span>/);
  assert.match(loadingSource, /aria-hidden="true"/);
});
