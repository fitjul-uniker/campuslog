import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const globalsPath = new URL("./globals.css", import.meta.url);
const expandableScreenPath = new URL(
  "../components/ui/expandable-screen.module.css",
  import.meta.url,
);

test("long-form screens use one content layer instead of stacked glass", async () => {
  const styles = await readFile(globalsPath, "utf8");
  const cleanup = styles.slice(
    styles.indexOf("/* Service-wide Liquid Glass legacy cleanup"),
  );
  const longFormRule = cleanup.match(
    /\.product-shell\[data-liquid-glass="true"\]\s*:is\(([\s\S]*?)\)\s*\{[\s\S]*?background:\s*var\(--liquid-content-fill\)[\s\S]*?\}/,
  )?.[0];

  assert.match(cleanup, /\.activity-synthesis-draft\.liquid-workspace/);
  assert.match(cleanup, /\.analysis-result\.liquid-section:not\(\.is-embedded\)/);
  assert.match(cleanup, /\.recommendation-history-detail\.liquid-section/);
  assert.match(cleanup, /background:\s*var\(--liquid-content-fill\)/);
  assert.match(cleanup, /backdrop-filter:\s*none/);
  assert.ok(longFormRule);
  assert.doesNotMatch(
    longFormRule,
    /\.page-stack-narrow:not\(\.recommendation-page\)\s*>\s*\.form-panel\.liquid-workspace/,
  );
  assert.doesNotMatch(
    longFormRule,
    /(?<!:not\()\.recommendation-page\s*>\s*\.form-panel\.liquid-workspace/,
  );
});

test("표준 경험 폼과 추천 빈 상태는 오늘의 기록 workspace 재질을 공유한다", async () => {
  const styles = await readFile(globalsPath, "utf8");

  assert.match(
    styles,
    /\.sub-page\.page-stack-narrow\s*>\s*\.form-panel\.liquid-workspace\s*\{[^}]*margin-left:\s*0/is,
  );
  assert.match(
    styles,
    /\.recommendation-page\s*>\s*\.empty-state\s*\{[^}]*border-radius:\s*30px[^}]*background:\s*var\(--liquid-frosted-fill\)[^}]*backdrop-filter:\s*blur\(28px\) saturate\(1\.12\)/is,
  );
});

test("embedded analysis and recommendation details flatten nested cards", async () => {
  const styles = await readFile(globalsPath, "utf8");
  const cleanup = styles.slice(
    styles.indexOf("/* Service-wide Liquid Glass legacy cleanup"),
  );

  assert.match(
    cleanup,
    /\.analysis-result\.is-embedded\.liquid-content-plate\s*\{[^}]*background:\s*transparent[^}]*box-shadow:\s*none/is,
  );
  assert.match(
    cleanup,
    /\.recommendation-history-detail[\s\S]*?\.recommendation-match-card[\s\S]*?background:\s*transparent[\s\S]*?box-shadow:\s*none/is,
  );
  assert.match(
    cleanup,
    /\.recommendation-history-detail[\s\S]*?\.recommendation-meta[\s\S]*?>\s*div\s*\{[^}]*background:\s*transparent[^}]*box-shadow:\s*none/is,
  );
});

test("legacy icon plates and warm upload nesting are removed", async () => {
  const styles = await readFile(globalsPath, "utf8");
  const cleanup = styles.slice(
    styles.indexOf("/* Service-wide Liquid Glass legacy cleanup"),
  );

  assert.match(
    cleanup,
    /:is\(\s*\.activity-summary-icon,\s*\.recommendation-image-upload-icon,\s*\.morph-surface-indicator\s*\)\s*\{[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/is,
  );
  assert.match(
    cleanup,
    /\.recommendation-image-fieldset\.liquid-section[\s\S]{0,420}border:\s*1px dashed var\(--liquid-hairline-strong\)[^}]*background:\s*transparent/is,
  );
});

test("quick log shares its overlay material and keeps accessibility fallbacks", async () => {
  const styles = await readFile(globalsPath, "utf8");
  const cleanup = styles.slice(
    styles.indexOf("/* Service-wide Liquid Glass legacy cleanup"),
  );
  const expandableStyles = await readFile(expandableScreenPath, "utf8");

  assert.match(
    cleanup,
    /\.glass-overlay-surface[\s\S]*?:is\(\.floating-panel-body,\s*\.activity-floating-record-footer\)\s*\{[^}]*background:\s*transparent/is,
  );
  assert.match(
    cleanup,
    /@media \(prefers-reduced-transparency: reduce\), \(prefers-contrast: more\)/,
  );
  assert.match(
    expandableStyles,
    /\.content\s*\{[^}]*background:\s*rgb\(255 255 255 \/ 92%\)/is,
  );
});
