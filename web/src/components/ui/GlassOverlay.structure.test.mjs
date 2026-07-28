import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const directory = new URL("./", import.meta.url);

test("FloatingPanel keeps positioning and focus behavior while exposing Glass shell", async () => {
  const source = await readFile(
    new URL("floating-panel.tsx", directory),
    "utf8",
  );

  assert.match(source, /glass-overlay-surface/);
  assert.match(source, /window\.visualViewport/);
  assert.match(source, /--safe-area-top/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /setAttribute\("inert"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /returnFocus/);
  assert.match(source, /useReducedMotion/);
});

test("ExpandableScreen keeps morph behavior and uses cool-neutral outer material", async () => {
  const [source, styles] = await Promise.all([
    readFile(new URL("expandable-screen.tsx", directory), "utf8"),
    readFile(new URL("expandable-screen.module.css", directory), "utf8"),
  ]);

  assert.match(source, /EXPANDED_SCREEN_COLOR = "#f5f5f7"/i);
  assert.match(source, /getOriginGeometry/);
  assert.match(source, /visualViewport/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(styles, /backdrop-filter:\s*blur/);
  assert.match(styles, /background:\s*#fff(?:fff)?/i);
  assert.doesNotMatch(`${source}\n${styles}`, /#f8f7f3/i);
});
