import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const experienceListSource = await readFile(
  new URL("./experiences/AnimatedExperienceList.tsx", import.meta.url),
  "utf8",
);
const recommendationListSource = await readFile(
  new URL("./recommendations/AnimatedRecommendationList.tsx", import.meta.url),
  "utf8",
);
const pinPreferenceSource = await readFile(
  new URL("../lib/pinnedItems.ts", import.meta.url),
  "utf8",
);
const experiencePageSource = await readFile(
  new URL("./experiences/ExperienceDashboard.tsx", import.meta.url),
  "utf8",
);
const recommendationPageSource = await readFile(
  new URL("../app/recommend/history/page.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("즐겨찾기는 사용자별 브라우저 환경설정으로 분리 저장한다", () => {
  assert.match(pinPreferenceSource, /campuslog:v1:pinned-items/);
  assert.match(pinPreferenceSource, /user:\$\{user\.id\}/);
  assert.match(pinPreferenceSource, /type PinnableItemType =/);
  assert.match(pinPreferenceSource, /"experience"\s*\|\s*"recommendation"/);
});

test("나의 활동과 추천 기록은 같은 controlled pinned-list 계약을 사용한다", () => {
  assert.match(experiencePageSource, /usePinnedItems\("experience"\)/);
  assert.match(recommendationPageSource, /usePinnedItems\("recommendation"\)/);

  for (const source of [experienceListSource, recommendationListSource]) {
    assert.match(source, /import\s*\{\s*Star\s*\}\s*from\s*"lucide-react"/);
    assert.doesNotMatch(source, /import\s*\{\s*Pin\s*\}\s*from\s*"lucide-react"/);
    assert.match(source, /LayoutGroup/);
    assert.match(source, /AnimatePresence/);
    assert.match(source, /layoutId=/);
    assert.match(source, /aria-pressed=\{isPinned\}/);
    assert.match(source, />즐겨찾기</);
  }
});

test("나의 활동은 완료 경험과 진행 활동을 모두 즐겨찾기할 수 있다", () => {
  assert.match(experienceListSource, /item\.kind === "tracked"/);
  assert.match(experienceListSource, /`tracked:\$\{item\.id\}`/);
  assert.doesNotMatch(
    experienceListSource,
    /\{item\.kind === "experience" \? \(\s*<button/,
  );
});

test("즐겨찾기 행은 외곽선 없는 44px 채움형 별 조작 영역을 사용한다", () => {
  assert.match(
    styles,
    /\.pinned-list-pin-button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*border:\s*0;[^}]*background:\s*transparent;/i,
  );
  assert.match(
    styles,
    /\.pinned-list-item\[data-pinned="true"\]\s*\{[^}]*border-radius:\s*16px;/i,
  );
  assert.match(
    styles,
    /\.pinned-list-pin-button\s+svg\s*\{[^}]*fill:\s*currentColor;[^}]*stroke:\s*none;/i,
  );
  assert.match(
    styles,
    /\.pinned-list-pin-button\[aria-pressed="true"\]\s*\{[^}]*color:\s*#ffd84d;/i,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.pinned-list-item/i,
  );
});

test("즐겨찾기 행 hover는 제목과 별 조작 영역을 하나의 표면으로 묶는다", () => {
  for (const source of [experienceListSource, recommendationListSource]) {
    assert.match(source, /data-selected=\{isSelected \? "true" : "false"\}/);
  }
  assert.match(
    styles,
    /\.product-shell\[data-liquid-glass="true"\]\s+\.pinned-list-item:hover\s*\{[^}]*background:\s*var\(--liquid-hover-fill\)/i,
  );
  assert.match(
    styles,
    /\.pinned-list-item:hover\s+:is\(\.dashboard-experience-title-button,\s*\.recommendation-history-row\)\s*\{[^}]*background:\s*transparent;[^}]*padding-left:\s*24px;/is,
  );
  assert.match(
    styles,
    /\.pinned-list-item\[data-selected="true"\]\s*\{[^}]*background:\s*var\(--liquid-selected-fill\)/is,
  );
  assert.match(
    styles,
    /\.pinned-list-item\[data-selected="true"\]:hover\s*\{[^}]*background:\s*var\(--liquid-active-fill\)/is,
  );
  assert.match(
    styles,
    /\.pinned-list-item\[data-selected="true"\]\s+:is\(\.dashboard-experience-title-button,\s*\.recommendation-history-row\)\s*\{[^}]*background:\s*transparent;/is,
  );
});

test("스크롤 목록은 콘텐츠를 가리는 상하단 페이드 오버레이를 사용하지 않는다", () => {
  for (const source of [experienceListSource, recommendationListSource]) {
    assert.doesNotMatch(source, /dashboard-list-fade/);
    assert.doesNotMatch(source, /SCROLL_FADE_DISTANCE/);
  }
  assert.doesNotMatch(styles, /\.dashboard-list-fade(?:-top|-bottom)?\s*\{/);
});
