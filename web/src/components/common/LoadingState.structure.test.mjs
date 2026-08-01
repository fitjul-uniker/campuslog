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
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("주요 제품 화면은 목적지 레이아웃을 닮은 공통 로딩 상태를 사용한다", () => {
  assert.match(loadingSource, /"dashboard" \| "list" \| "form"/);
  assert.match(todaySource, /<LoadingState[\s\S]*?variant="dashboard"/);
  assert.match(experiencesSource, /<LoadingState[\s\S]*?variant="list"/);
  assert.match(
    experiencesSource,
    /\{activityItems !== null \? \(\s*<header className="dashboard-experience-section-heading">/,
  );
  assert.match(
    loadingSource,
    /className="product-loading-state is-list"[\s\S]*?<LoadingHeader \/>[\s\S]*?<LoadingRows count=\{count\} \/>/,
  );
  assert.match(recommendationSource, /<LoadingState[\s\S]*?variant="form"/);
  assert.doesNotMatch(todaySource, /activity-today-page activity-page-loading/);
  assert.doesNotMatch(
    recommendationSource,
    /활동 추천 화면을 불러오는 중입니다/,
  );
});

test("공통 로딩은 Liquid Glass 재질과 접근성 대안을 유지한다", () => {
  assert.match(loadingSource, /aria-live="polite"/);
  assert.match(loadingSource, /aria-busy="true"/);
  assert.match(loadingSource, /<span className="sr-only">\{message\}<\/span>/);
  assert.match(
    styles,
    /\.product-loading-surface,[\s\S]*?background:\s*var\(--liquid-frosted-fill\)[\s\S]*?backdrop-filter:\s*blur\(28px\) saturate\(1\.12\)/,
  );
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.product-loading-state/);
  assert.match(styles, /@media \(max-width: 860px\)[\s\S]*?\.product-loading-state\.is-dashboard/);
});
