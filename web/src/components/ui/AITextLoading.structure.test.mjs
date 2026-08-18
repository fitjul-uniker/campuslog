import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./AITextLoading.tsx", import.meta.url),
  "utf8",
);

test("AI Text Loading은 Kokonut UI의 Motion 전환 구조를 유지한다", () => {
  assert.match(source, /AnimatePresence mode="wait"/);
  assert.match(source, /setInterval/);
  assert.match(source, /backgroundPosition/);
  assert.match(source, /bg-gradient-to-r/);
  assert.match(source, /bg-clip-text/);
});

test("AI Text Loading은 reduced motion에서 이동과 반복 gradient를 멈춘다", () => {
  assert.match(source, /useReducedMotion/);
  assert.match(source, /shouldReduceMotion/);
});

test("상태 문구 목록이 갱신되어도 첫 문장으로 순환을 재시작하지 않는다", () => {
  assert.doesNotMatch(source, /setCurrentTextIndex\(0\)/);
  assert.doesNotMatch(source, /const textsKey/);
  assert.match(source, /key=\{currentText\}/);
});
