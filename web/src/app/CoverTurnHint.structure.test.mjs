import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("./globals.css", import.meta.url), "utf8");
const bookModelSource = await readFile(
  new URL("../components/hero/BookModel.tsx", import.meta.url),
  "utf8",
);

function extractBalancedBlock(source, marker, fromIndex = 0) {
  const markerIndex = source.indexOf(marker, fromIndex);
  assert.notEqual(markerIndex, -1, `CSS marker not found: ${marker}`);

  const openingBraceIndex = source.indexOf("{", markerIndex);
  assert.notEqual(openingBraceIndex, -1, `Opening brace not found: ${marker}`);

  let depth = 0;
  for (let index = openingBraceIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(markerIndex, index + 1);
  }

  assert.fail(`Closing brace not found: ${marker}`);
}

function extractAtRuleContaining(source, marker, selector) {
  let fromIndex = 0;

  while (fromIndex < source.length) {
    const markerIndex = source.indexOf(marker, fromIndex);
    assert.notEqual(markerIndex, -1, `${marker} does not contain ${selector}`);
    const block = extractBalancedBlock(source, marker, markerIndex);
    if (block.includes(selector)) return block;
    fromIndex = markerIndex + marker.length;
  }

  assert.fail(`${marker} does not contain ${selector}`);
}

test("인증된 표지는 별도 문구 없이 macOS형 포인터만 제공한다", () => {
  assert.match(pageSource, /import\s*\{[^}]*\bMousePointer2\b[^}]*\}\s*from "lucide-react"/s);
  assert.match(pageSource, /href="\/dashboard"/);
  assert.equal(pageSource.match(/className="closed-notebook"/g)?.length, 1);
  assert.match(pageSource, /className="cover-turn-hint" aria-hidden="true"/);
  assert.match(pageSource, /className="cover-turn-hint-cursor"/);
  assert.match(pageSource, /<MousePointer2 aria-hidden="true" \/>/);
  assert.doesNotMatch(pageSource, /cover-turn-hint-text|책장을 넘겨주세요\./);
  assert.match(pageSource, /aria-label="책장을 넘겨 오늘의 기록으로 이동"/);
});

test("3D 책은 reduced motion을 존중하는 기존 부유 호흡을 유지한다", () => {
  assert.match(bookModelSource, /const floatingOffset = reducedMotion\s*\?\s*0\s*:/s);
});

test("책장 넘김 안내의 포인터는 바깥에서 책 중앙까지 이동한다", () => {
  const hintRule = extractBalancedBlock(styles, ".cover-turn-hint {");
  const cursorRule = extractBalancedBlock(styles, ".cover-turn-hint-cursor {");
  const pointerRule = extractBalancedBlock(styles, ".cover-turn-hint-cursor svg {");
  const pulseRule = extractBalancedBlock(styles, ".cover-turn-hint-cursor::after {");
  const pointerKeyframes = extractBalancedBlock(styles, "@keyframes cover-turn-pointer-demo");
  const hoverRule = extractBalancedBlock(
    styles,
    ".closed-notebook:is(:hover, :focus-visible) .cover-turn-hint-cursor svg {",
  );
  const focusRule = extractAtRuleContaining(
    styles,
    ".closed-notebook:focus-visible {",
    "outline:",
  );
  const mobileBlock = extractAtRuleContaining(
    styles,
    "@media (max-width: 860px)",
    ".cover-turn-hint-cursor",
  );
  const reducedMotionBlock = extractAtRuleContaining(
    styles,
    "@media (prefers-reduced-motion: reduce)",
    ".cover-turn-hint-cursor",
  );

  assert.match(hintRule, /inset:\s*0/);
  assert.match(hintRule, /pointer-events:\s*none/);
  assert.match(cursorRule, /--cover-pointer-start-x:\s*[1-9]\d*px/);
  assert.match(cursorRule, /--cover-pointer-start-y:\s*[1-9]\d*px/);
  assert.match(cursorRule, /top:\s*calc\(50%\s*-\s*[^)]+\)/);
  assert.match(cursorRule, /left:\s*calc\(50%\s*-\s*[^)]+\)/);
  assert.match(pointerRule, /animation:\s*cover-turn-pointer-demo 12s\b/);
  assert.match(pulseRule, /animation:\s*cover-turn-click-pulse 12s\b/);
  assert.match(pointerKeyframes, /0%,\s*68%\s*\{[^}]*opacity:\s*0/s);
  assert.match(pointerKeyframes, /translate3d\(0,\s*0,\s*0\)/);
  assert.match(pointerKeyframes, /scale\(0\.9\)/);
  assert.match(hoverRule, /animation:\s*none/);
  assert.match(hoverRule, /opacity:\s*1/);
  assert.match(focusRule, /outline:\s*3px solid/);
  assert.doesNotMatch(
    styles,
    /cover-turn-hint-sheen|cover-turn-iridescence|\.cover-turn-hint-icon|\.cover-turn-hint-line/,
  );
  assert.doesNotMatch(styles, /\.cover-turn-hint\s*\{[^}]*animation:/s);
  assert.match(mobileBlock, /\.cover-turn-hint-cursor\s*\{[^}]*--cover-pointer-start-x:\s*[1-9]\d*px/s);
  assert.match(mobileBlock, /\.cover-turn-hint-cursor\s*\{[^}]*--cover-pointer-start-y:\s*[1-9]\d*px/s);
  assert.match(
    reducedMotionBlock,
    /\.cover-turn-hint-cursor::after,\s*\.cover-turn-hint-cursor svg\s*\{[^}]*animation:\s*none/s,
  );
});
