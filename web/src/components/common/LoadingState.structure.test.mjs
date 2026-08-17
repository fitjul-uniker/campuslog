import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loadingSource = await readFile(
  new URL("./LoadingState.tsx", import.meta.url),
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
const pinnedItemsSource = await readFile(
  new URL("../../hooks/use-pinned-items.ts", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("주요 제품 화면은 초기 로딩 중 시각적 가짜 패널을 렌더링하지 않는다", () => {
  assert.doesNotMatch(loadingSource, /variant/);
  assert.doesNotMatch(loadingSource, /product-loading/);
  assert.match(
    todaySource,
    /if \(activities === null\)[\s\S]*?<TodayDashboardHeader today=\{today\} \/>[\s\S]*?<LoadingState[\s\S]*?message="오늘의 기록을 불러오는 중입니다\."/,
  );
  assert.match(
    experiencesSource,
    /activityItems === null \|\| !experiencePins\.isLoaded \? \([\s\S]*?<LoadingState message="나의 활동을 불러오는 중입니다\." \/>[\s\S]*?\) : \([\s\S]*?<LayoutGroup id="dashboard-experience-layout">/,
  );
  assert.match(
    recommendationSource,
    /if \(experiences === null\)[\s\S]*?<RecommendationPageHeader \/>[\s\S]*?<LoadingState[\s\S]*?message="AI 기반 활동 추천을 불러오는 중입니다\."/,
  );
  assert.doesNotMatch(styles, /\.product-loading-/);
  assert.match(pinnedItemsSource, /const \[isLoaded, setIsLoaded\] = useState\(false\)/);
});

test("시각적 로딩 패널 없이 접근성 안내만 유지한다", () => {
  assert.match(loadingSource, /className="sr-only"/);
  assert.match(loadingSource, /role="status"/);
  assert.match(loadingSource, /aria-live="polite"/);
  assert.match(loadingSource, /aria-busy="true"/);
  assert.match(loadingSource, />\s*\{message\}\s*<\/span>/);
});
