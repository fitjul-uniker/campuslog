import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./RecommendationResult.tsx", import.meta.url),
  "utf8",
);
const accordionSource = await readFile(
  new URL("../ui/accordion.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("추천 경험은 첫 순위만 기본으로 여는 단일 Accordion을 사용한다", () => {
  assert.match(source, /<Accordion[\s\S]*multiple=\{false\}/);
  assert.match(
    source,
    /defaultValue=\{[\s\S]*matches\[0\]\.rank[\s\S]*matches\[0\]\.experienceId/,
  );
  assert.match(source, /<AccordionItem/);
  assert.match(source, /<AccordionTrigger/);
  assert.match(source, /<AccordionContent/);
});

test("Accordion은 Base UI 접근성 primitive와 회전 화살표를 사용한다", () => {
  assert.match(
    accordionSource,
    /import \{ Accordion as AccordionPrimitive \} from "@base-ui\/react\/accordion"/,
  );
  assert.match(accordionSource, /AccordionPrimitive\.Header/);
  assert.match(accordionSource, /AccordionPrimitive\.Trigger/);
  assert.match(accordionSource, /AccordionPrimitive\.Panel/);
  assert.match(source, /ChevronRight/);
  assert.match(
    styles,
    /\.recommendation-match-trigger\[data-panel-open\][\s\S]*\.recommendation-match-chevron\s*\{[^}]*transform:\s*rotate\(90deg\)/,
  );
});

test("닫힌 추천 경험 행은 한 줄 제목과 적합도만으로 빠르게 비교한다", () => {
  assert.match(source, /recommendation-match-trigger-copy/);
  assert.match(source, /recommendation-match-trigger-title/);
  assert.match(
    styles,
    /\.recommendation-match-trigger-title\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
  );
  assert.match(
    styles,
    /\.accordion-content\s*\{[^}]*height:\s*var\(--accordion-panel-height\);[^}]*overflow:\s*hidden;/s,
  );
});

test("추천 경험 행은 차분한 글자 굵기와 행 전체 hover를 사용한다", () => {
  assert.match(
    styles,
    /\.recommendation-match-trigger-copy\s*\{[^}]*align-items:\s*baseline;/s,
  );
  assert.match(
    styles,
    /\.recommendation-match-trigger-title\s*\{[^}]*font-weight:\s*500;/s,
  );
  assert.match(
    styles,
    /\.recommendation-match-trigger\s+\.recommendation-fit-badge\s*\{[^}]*margin-right:\s*6px;[^}]*border:\s*0;[^}]*background:\s*transparent;/s,
  );
  assert.match(
    styles,
    /\.recommendation-match-trigger\s+\.recommendation-fit-badge\[data-fit-level="high"\]\s*\{[^}]*color:\s*#24734a;/s,
  );
  assert.match(
    styles,
    /\.recommendation-match-accordion-item\s*>\s*\.accordion-header:has\(\.recommendation-match-trigger:hover\)\s*\{[^}]*background:[^}]*box-shadow:\s*none;/s,
  );
  assert.match(
    styles,
    /\.recommendation-match-accordion-item\s*>\s*\.accordion-header\s*\{[^}]*margin:\s*0;[^}]*border-radius:\s*0;[^}]*box-shadow:\s*none;/s,
  );
  assert.match(
    styles,
    /\.recommendation-match-trigger\s*\{[^}]*height:\s*62px;[^}]*align-items:\s*center;[^}]*padding:\s*2px 2px 0;/s,
  );
  assert.match(
    styles,
    /\.recommendation-match-trigger:focus-visible\s*\{[^}]*outline:\s*1px[^}]*box-shadow:\s*none;/s,
  );
});

test("추천 기록에서 경험을 펼치면 우측 상세 패널의 읽기 시작점으로 이동한다", () => {
  assert.match(source, /onValueChange=\{handleMatchAccordionValueChange\}/);
  assert.match(source, /matchItemRefs\.current\.set\(matchValue, node\)/);
  assert.match(
    source,
    /closest<HTMLElement>\(\s*"\.recommendation-history-detail"/,
  );
  assert.match(source, /scrollContainer\.scrollTo\(\{/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /behavior: prefersReducedMotion \? "auto" : "smooth"/);
});
