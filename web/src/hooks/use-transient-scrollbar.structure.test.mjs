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
  assert.match(hook, /updateScrollablePageIntro/);
  assert.match(hook, /target\.dataset\.scrollPageIntro !== "true"/);
  assert.match(hook, /--standalone-page-intro-scroll-offset/);
  assert.match(detail, /useTransientScrollbar/);
  assert.match(detail, /className="dashboard-experience-detail-scroll"/);
  assert.match(detail, /data-transient-scrollbar="true"/);
  assert.match(
    detail,
    /data-scroll-page-intro=\{isFullscreen \? "true" : undefined\}/,
  );
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

test("나의 활동 스크롤바는 페이지 2px·패널 3px 인셋 캡슐로 위계를 나눈다", () => {
  assert.match(
    styles,
    /html:has\(\.product-shell\[data-liquid-glass="true"\]\)::\-webkit-scrollbar\s*\{\s*width:\s*8px/is,
  );
  assert.match(
    styles,
    /html:has\(\.product-shell\[data-liquid-glass="true"\]\)::\-webkit-scrollbar-thumb\s*\{[\s\S]*border:\s*3px solid transparent[\s\S]*background-clip:\s*padding-box/is,
  );
  assert.match(
    styles,
    /\.dashboard-animated-list::\-webkit-scrollbar\s*\{\s*width:\s*10px/is,
  );
  assert.match(
    styles,
    /\.dashboard-animated-list::\-webkit-scrollbar-thumb\s*\{[\s\S]*border:\s*3\.5px solid transparent[\s\S]*background-clip:\s*padding-box/is,
  );
  assert.match(
    styles,
    /\[data-transient-scrollbar="true"\]::\-webkit-scrollbar\s*\{\s*width:\s*10px/is,
  );
  assert.match(
    styles,
    /\.dashboard-experience-detail\s*\{[\s\S]*overflow:\s*hidden[\s\S]*padding:\s*30px 0/is,
  );
  assert.match(
    styles,
    /\.dashboard-experience-detail-scroll\s*\{[\s\S]*max-height:\s*calc\(100vh - 172px\)[\s\S]*overflow:\s*auto/is,
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
  assert.match(
    styles,
    /\[data-scrolling="true"\]\s*\{\s*--transient-scrollbar-thumb:\s*rgb\(82 87 96 \/ 30%\)/is,
  );
  assert.match(
    styles,
    /\[data-scrolling="true"\]::\-webkit-scrollbar-thumb:hover\s*\{[^}]*background:\s*rgb\(82 87 96 \/ 44%\)/is,
  );
});
