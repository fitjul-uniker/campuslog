import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./Strands.tsx", import.meta.url), "utf8");

test("Strands는 OGL renderer와 사용자 제공 shader 설정을 사용한다", () => {
  assert.match(source, /from "ogl"/);
  assert.match(source, /const MAX_STRANDS = 12/);
  assert.match(source, /const MAX_COLORS = 8/);
  assert.match(source, /new Renderer\(/);
  assert.match(source, /new Program\(/);
  assert.match(source, /new Mesh\(/);
});

test("Strands는 animation과 WebGL 자원을 정리하고 reduced motion을 지원한다", () => {
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /cancelAnimationFrame/);
  assert.match(source, /removeEventListener\("resize"/);
  assert.match(source, /WEBGL_lose_context/);
});
