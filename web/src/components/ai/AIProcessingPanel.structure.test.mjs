import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./AIProcessingPanel.tsx", import.meta.url), "utf8");
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("AI 처리 패널은 body portal 기반 전체 화면 blur overlay를 사용한다", () => {
  assert.match(source, /createPortal/);
  assert.match(source, /document\.body/);
  assert.match(source, /ai-processing-overlay/);
  assert.match(styles, /position:\s*fixed/);
  assert.match(styles, /backdrop-filter:\s*blur/);
});

test("AI 처리 패널은 승인된 Strands 설정과 AI Text Loading을 사용한다", () => {
  assert.match(source, /<Strands/);
  assert.match(source, /colors=\{\["#F97316", "#7C3AED", "#06B6D4"\]\}/);
  assert.match(source, /count=\{3\}/);
  assert.match(source, /glow=\{2\.6\}/);
  assert.match(source, /scale=\{1\.5\}/);
  assert.match(source, /<AITextLoading/);
  assert.doesNotMatch(source, /function AISkeleton/);
});

test("AI 처리 패널은 기존 취소와 장기 대기 문구 계약을 유지한다", () => {
  assert.match(source, /onClick=\{onCancel\}/);
  assert.match(source, /shouldShowLongWait/);
  assert.match(source, /longWaitMessage/);
});

test("AI 처리 문구는 2.4초 간격과 말줄임 끝맺음을 사용한다", () => {
  assert.match(source, /function normalizeLoadingText/);
  assert.match(source, /replace\(\/\[\.\u2026\]\+\$\/u, ""\)/);
  assert.match(source, /return `\$\{normalizedText\}\.\.\.`/);
  assert.match(source, /interval=\{2_400\}/);
});

test("AI 요청 취소 액션은 아이콘과 글자만 표시한다", () => {
  const cancelButtonStyles = styles.match(
    /\.ai-processing-cancel-button \{([\s\S]*?)\}/,
  )?.[1];

  assert.ok(cancelButtonStyles);
  assert.match(cancelButtonStyles, /min-height:\s*44px/);
  assert.match(cancelButtonStyles, /border:\s*0/);
  assert.match(cancelButtonStyles, /background:\s*transparent/);
  assert.match(cancelButtonStyles, /box-shadow:\s*none/);
  assert.doesNotMatch(cancelButtonStyles, /border-radius:\s*999px/);
});
