import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const directory = new URL("./", import.meta.url);

test("all popup components use one Glass material surface", async () => {
  const [dropdown, select, combobox, globals] = await Promise.all([
    readFile(new URL("dropdown-menu.tsx", directory), "utf8"),
    readFile(new URL("select.tsx", directory), "utf8"),
    readFile(new URL("combobox.tsx", directory), "utf8"),
    readFile(new URL("../../app/globals.css", directory), "utf8"),
  ]);

  for (const source of [dropdown, select, combobox]) {
    assert.match(source, /glass-popover-surface/);
    assert.match(source, /Portal/);
  }

  assert.match(dropdown, /collisionPadding\s*=\s*12/);
  assert.match(select, /alignItemWithTrigger=\{false\}/);
  assert.match(combobox, /sideOffset=\{sideOffset\}/);
  assert.match(globals, /\.glass-popover-surface/);
  assert.match(globals, /min-height:\s*44px/);
});

test("Glass blur belongs to popup surfaces, not popup items", async () => {
  const globals = await readFile(
    new URL("../../app/globals.css", directory),
    "utf8",
  );

  assert.match(
    globals,
    /\.glass-popover-surface[^{]*\{[^}]*backdrop-filter/is,
  );
  assert.doesNotMatch(
    globals,
    /\.(?:select-item|combobox-item|dropdown-menu-item)[^{]*\{[^}]*backdrop-filter/is,
  );
});
