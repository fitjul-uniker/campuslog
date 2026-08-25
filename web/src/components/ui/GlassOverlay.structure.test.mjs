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

test("ExpandableScreen opens only the compact dialog and preserves modal behavior", async () => {
  const [source, styles] = await Promise.all([
    readFile(new URL("expandable-screen.tsx", directory), "utf8"),
    readFile(new URL("expandable-screen.module.css", directory), "utf8"),
  ]);

  assert.doesNotMatch(source, /getOriginGeometry|EXPANDED_GLASS_COLOR/);
  assert.doesNotMatch(styles, /\.surface\s*\{/);
  assert.match(source, /scale: 0\.965/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(styles, /backdrop-filter:\s*blur/);
  assert.match(
    styles,
    /\.dialog\s*\{[^}]*width:\s*min\(760px, 100%\);[^}]*border-radius:\s*30px;/s,
  );
  assert.match(
    styles,
    /\.content\s*\{[^}]*margin:\s*0;[^}]*border-radius:\s*30px;[^}]*background:\s*transparent;/s,
  );
  assert.match(styles, /background:\s*#fff(?:fff)?/i);
  assert.doesNotMatch(`${source}\n${styles}`, /#f8f7f3/i);
});
