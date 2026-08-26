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

function extractCssBlock(css, marker) {
  const markerIndex = css.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${marker} block should exist`);
  const openingBraceIndex = css.indexOf("{", markerIndex);
  let depth = 0;

  for (let index = openingBraceIndex; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(openingBraceIndex + 1, index);
  }

  assert.fail(`${marker} block should close`);
}

const accordionStyles = styles.slice(
  styles.indexOf("/* Recommendation match accordion"),
);
const mobileAccordionStyles = extractCssBlock(
  accordionStyles,
  "@media (max-width: 520px)",
);
const reducedMotionAccordionStyles = extractCssBlock(
  accordionStyles,
  "@media (prefers-reduced-motion: reduce)",
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

test("각 추천 경험은 해당 경험 id의 활동으로 직접 이동할 수 있다", () => {
  assert.match(
    source,
    /href=\{`\/experiences\/\$\{match\.experienceId\}`\}[\s\S]*?활동 보기/,
  );
  assert.doesNotMatch(
    source,
    /\{matchedExperience \? \([\s\S]*?recommendation-match-actions/,
  );
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

test("추천 경험 행은 기존 비교 형식을 유지하며 읽기 여백과 포커스를 보강한다", () => {
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
    /\.recommendation-match-trigger\s*\{[^}]*height:\s*auto;[^}]*min-height:\s*68px;[^}]*align-items:\s*center;[^}]*padding:\s*8px 4px 8px 2px;/s,
  );
  assert.match(
    styles,
    /\.recommendation-match-trigger:focus-visible\s*\{[^}]*outline:\s*2px solid #34363a;[^}]*box-shadow:\s*none;/s,
  );
  assert.doesNotMatch(
    mobileAccordionStyles,
    /\.recommendation-match-rank\s*\{[^}]*display:\s*none;/s,
  );
  assert.match(
    mobileAccordionStyles,
    /\.recommendation-match-trigger-copy \.recommendation-match-rank\s*\{[^}]*display:\s*block;[^}]*color:\s*#666970;[^}]*font-size:\s*0\.75rem;/s,
  );
  assert.match(
    reducedMotionAccordionStyles,
    /\.accordion-content,[\s\S]*?\.answer-draft-custom-length-control\s*\{[^}]*transition:\s*none;/,
  );
});

test("추천 기록에서 경험을 펼치면 우측 상세 패널의 읽기 시작점으로 이동한다", () => {
  assert.match(source, /onValueChange=\{handleMatchAccordionValueChange\}/);
  assert.match(source, /matchItemRefs\.current\.set\(matchValue, node\)/);
  assert.match(
    source,
    /closest<HTMLElement>\(\s*"\.recommendation-history-detail-scroll"/,
  );
  assert.match(source, /scrollContainer\.scrollTo\(\{/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /behavior: prefersReducedMotion \? "auto" : "smooth"/);
});
