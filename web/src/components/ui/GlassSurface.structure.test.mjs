import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./glass-surface.tsx", import.meta.url);
const stylesPath = new URL("./glass-surface.module.css", import.meta.url);

test("GlassSurface exposes semantic material variants without owning product logic", async () => {
  const source = await readFile(componentPath, "utf8");

  assert.match(source, /export type GlassVariant/);
  assert.match(source, /"regular"/);
  assert.match(source, /"prominent"/);
  assert.match(source, /"clear"/);
  assert.match(source, /"frosted"/);
  assert.match(source, /"content"/);
  assert.match(source, /"solidFallback"/);
  assert.match(source, /data-glass-variant/);
  assert.match(source, /data-glass-shape/);
  assert.match(source, /data-glass-elevation/);
  assert.match(source, /data-glass-interactive/);
  assert.match(source, /export function GlassGroup/);
  assert.doesNotMatch(source, /usePathname|fetch\(|repository|Action/);
});

test("Glass material provides browser and accessibility fallbacks", async () => {
  const styles = await readFile(stylesPath, "utf8");

  assert.match(styles, /data-glass-variant="frosted"/);
  assert.match(styles, /data-glass-variant="content"/);
  assert.match(styles, /backdrop-filter:\s*blur/);
  assert.match(styles, /-webkit-backdrop-filter:\s*blur/);
  assert.match(styles, /@supports not/);
  assert.match(styles, /prefers-reduced-transparency:\s*reduce/);
  assert.match(styles, /prefers-contrast:\s*more/);
  assert.match(styles, /forced-colors:\s*active/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /pointer-events:\s*none/);
});
