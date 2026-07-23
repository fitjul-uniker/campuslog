import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./MorphSurface.tsx", import.meta.url),
  "utf8",
).catch(() => "");
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("MorphSurface는 controlled spring morph와 공유 indicator를 사용한다", () => {
  assert.match(source, /isOpen: boolean/);
  assert.match(source, /onOpenChange: \(open: boolean\) => void/);
  assert.match(source, /layoutId=/);
  assert.match(source, /type: "spring"/);
  assert.match(source, /AnimatePresence/);
});

test("MorphSurface는 닫기·포커스·접근성 계약을 제공한다", () => {
  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.match(source, /aria-controls=\{contentId\}/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(
    source,
    /document\s*\.\s*getElementById\(focusTargetId\)\s*\?\.\s*focus/,
  );
  assert.match(source, /pointerdown/);
  assert.match(source, /useReducedMotion/);
});

test("자동 포커스는 분석 패널의 스크롤 위치를 강제로 바꾸지 않는다", () => {
  assert.match(
    source,
    /document\s*\.\s*getElementById\(focusTargetId\)\s*\?\.\s*focus\(\{\s*preventScroll:\s*true\s*\}\)/,
  );
});

test("Escape 닫기 후 다음 프레임에 trigger 포커스를 복원한다", () => {
  assert.match(source, /event\.stopPropagation\(\)/);
  assert.match(
    source,
    /onOpenChange\(false\);[\s\S]*window\.requestAnimationFrame\(\(\) => \{[\s\S]*triggerRef\.current\.focus\(\{\s*preventScroll:\s*true\s*\}\)/,
  );
});

test("MorphSurface는 표면을 고정하고 본문을 아래에서 위로 드러낸다", () => {
  assert.doesNotMatch(source, /layout=\{!shouldReduceMotion\}/);
  assert.doesNotMatch(source, /y:\s*isOpen\s*\?\s*-12\s*:\s*0/);
  assert.match(source, /transformOrigin:\s*"50% 100%"/);
  assert.match(source, /className="morph-surface-reveal"/);
  assert.match(source, /height:\s*"auto"/);
  assert.match(source, /initial=\{[\s\S]*y:\s*12/);
  assert.doesNotMatch(source, /initial=\{[\s\S]*y:\s*-10/);
  assert.match(source, /morph-surface-chevron/);
});

test("MorphSurface reveal은 닫힘을 먼저 시작하고 reduced motion을 존중한다", () => {
  assert.match(source, /delay:\s*isOpen\s*\?\s*0\.06\s*:\s*0/);
  assert.match(source, /height:\s*0/);
  assert.match(source, /duration:\s*0\.01/);

  const revealStyles =
    styles.match(/\.morph-surface-reveal \{([\s\S]*?)\}/)?.[1] ?? "";

  assert.match(revealStyles, /overflow:\s*hidden/);
  assert.match(revealStyles, /will-change:\s*height,\s*opacity/);
});

test("MorphSurface는 모바일에서 고정 너비 없이 가용 너비를 채운다", () => {
  const surfaceStyles = styles.match(
    /\.morph-surface \{([\s\S]*?)\}/,
  )?.[1];

  assert.ok(surfaceStyles);
  assert.match(surfaceStyles, /width:\s*100%/);
  assert.match(styles, /\.morph-surface-trigger[\s\S]*min-height:\s*44px/);
});
