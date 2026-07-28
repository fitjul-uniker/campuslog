import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [hook, appShell, dashboard, list, detail, analysis, styles] = await Promise.all([
  readFile(
    new URL("./use-transient-scrollbar.ts", import.meta.url),
    "utf8",
  ).catch(() => ""),
  readFile(
    new URL("../components/layout/AppShell.tsx", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL(
      "../components/experiences/ExperienceDashboard.tsx",
      import.meta.url,
    ),
    "utf8",
  ),
  readFile(
    new URL(
      "../components/experiences/AnimatedExperienceList.tsx",
      import.meta.url,
    ),
    "utf8",
  ),
  readFile(
    new URL(
      "../components/experiences/DashboardExperienceDetail.tsx",
      import.meta.url,
    ),
    "utf8",
  ),
  readFile(
    new URL(
      "../components/experiences/DashboardAnalysisSplitPanel.tsx",
      import.meta.url,
    ),
    "utf8",
  ),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

test("상세와 분석 패널이 공용 transient scrollbar 동작을 연결한다", () => {
  assert.match(hook, /useTransientScrollbar/);
  assert.match(detail, /useTransientScrollbar/);
  assert.match(detail, /data-transient-scrollbar="true"/);
  assert.match(detail, /onScroll=\{handleTransientScroll\}/);
  assert.match(analysis, /useTransientScrollbar/);
  assert.match(analysis, /data-transient-scrollbar="true"/);
  assert.match(analysis, /onScroll=\{handleTransientScroll\}/);
  assert.match(
    styles,
    /@media \(forced-colors: active\)[\s\S]*scrollbar-color:\s*auto/is,
  );
});

test("페이지와 활동 목록도 스크롤 중에만 표시 상태를 연결한다", () => {
  assert.match(hook, /usePageTransientScrollbar/);
  assert.match(hook, /window\.addEventListener\("scroll", handleScroll/);
  assert.match(appShell, /usePageTransientScrollbar\(\)/);
  assert.doesNotMatch(dashboard, /usePageTransientScrollbar\(\)/);
  assert.match(list, /useTransientScrollbar<HTMLDivElement>/);
  assert.match(list, /data-transient-scrollbar="true"/);
  assert.match(list, /handleTransientScroll\(event\)/);
});

test("나의 활동 스크롤바는 트랙 없이 4px 캡슐로 통일한다", () => {
  assert.match(
    styles,
    /html:has\(\.product-shell\[data-liquid-glass="true"\]\)::\-webkit-scrollbar\s*\{\s*width:\s*10px/is,
  );
  assert.match(
    styles,
    /html:has\(\.product-shell\[data-liquid-glass="true"\]\)::\-webkit-scrollbar-thumb\s*\{[\s\S]*border:\s*3px solid transparent[\s\S]*background-clip:\s*padding-box/is,
  );
  assert.match(
    styles,
    /\.dashboard-animated-list::\-webkit-scrollbar\s*\{\s*width:\s*8px/is,
  );
  assert.match(
    styles,
    /\.dashboard-animated-list::\-webkit-scrollbar-thumb\s*\{[\s\S]*border:\s*2px solid transparent[\s\S]*background-clip:\s*padding-box/is,
  );
  assert.match(
    styles,
    /\[data-transient-scrollbar="true"\]::\-webkit-scrollbar\s*\{\s*width:\s*8px/is,
  );
  assert.match(
    styles,
    /--page-scrollbar-thumb:\s*transparent/,
  );
  assert.match(
    styles,
    /--list-scrollbar-thumb:\s*transparent/,
  );
  assert.match(
    styles,
    /--transient-scrollbar-thumb:\s*transparent/,
  );
  assert.doesNotMatch(styles, /\.dashboard-animated-list:hover/);
  assert.doesNotMatch(
    styles,
    /\[data-transient-scrollbar="true"\]:hover/,
  );
  assert.doesNotMatch(styles, /scrollbar-thumb:hover/);
  assert.match(
    styles,
    /\[data-scrolling="true"\]\s*\{\s*--transient-scrollbar-thumb:\s*rgb\(101 105 112 \/ 44%\)/is,
  );
});
