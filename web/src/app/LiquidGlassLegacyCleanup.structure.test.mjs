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

  assert.match(cleanup, /\.activity-synthesis-draft\.liquid-workspace/);
  assert.match(cleanup, /\.analysis-result\.liquid-section:not\(\.is-embedded\)/);
  assert.match(cleanup, /\.recommendation-history-detail\.liquid-section/);
  assert.match(cleanup, /background:\s*var\(--liquid-content-fill\)/);
  assert.match(cleanup, /backdrop-filter:\s*none/);
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
