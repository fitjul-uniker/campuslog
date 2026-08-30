import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const providerSource = await readFile(
  new URL("./AIBackgroundTaskProvider.tsx", import.meta.url),
  "utf8",
);
const centerSource = await readFile(
  new URL("./AIBackgroundTaskCenter.tsx", import.meta.url),
  "utf8",
);
const layoutSource = await readFile(
  new URL("../../app/layout.tsx", import.meta.url),
  "utf8",
);
const shellSource = await readFile(
  new URL("../layout/AppShell.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);
const analysisTaskSource = await readFile(
  new URL("../../hooks/use-experience-analysis-task.ts", import.meta.url),
  "utf8",
);
const recommendationTaskSource = await readFile(
  new URL("../../app/recommend/page.tsx", import.meta.url),
  "utf8",
);
const activitySynthesisTaskSource = await readFile(
  new URL("../activities/ActivityDetailClient.tsx", import.meta.url),
  "utf8",
);
const answerDraftTaskSource = await readFile(
  new URL("./RecommendationResult.tsx", import.meta.url),
  "utf8",
);

test("AI 작업 provider는 route children보다 오래 유지되고 product shell에 compact 상태를 표시한다", () => {
  assert.match(layoutSource, /<AIBackgroundTaskProvider>/);
  assert.match(layoutSource, /<AppShell>\{children\}<\/AppShell>/);
  assert.match(shellSource, /<AIBackgroundTaskCenter \/>/);
});

test("AI 작업은 기능과 대상 key로 중복 실행을 막고 명시적 취소만 abort한다", () => {
  assert.match(providerSource, /promisesRef\.current\.get\(definition\.key\)/);
  assert.match(providerSource, /return existingPromise/);
  assert.match(providerSource, /controllersRef\.current\.get\(key\)\?\.abort\(\)/);
  assert.doesNotMatch(providerSource, /localStorage|sessionStorage/);
  assert.match(
    providerSource,
    /const sendTaskToBackground = useCallback/,
  );
  assert.match(providerSource, /const focusTask = useCallback/);
});

test("AI 작업은 pending success error와 focused background 표현을 구분한다", () => {
  assert.match(providerSource, /"pending" \| "success" \| "error"/);
  assert.match(providerSource, /"focused" \| "background"/);
  assert.match(centerSource, /task\.pendingMessage/);
  assert.match(centerSource, /task\.successMessage/);
  assert.match(centerSource, /task\.errorMessage/);
});

test("compact AI pending 문구는 서버 상태와 작업별 문장을 2.4초 간격으로 순환한다", () => {
  assert.match(providerSource, /pendingMessages:\s*string\[\]/);
  assert.match(centerSource, /function getPendingMessages/);
  assert.match(
    centerSource,
    /\[task\.statusMessage, task\.pendingMessage, \.\.\.task\.pendingMessages\]/,
  );
  assert.match(centerSource, /window\.setInterval/);
  assert.match(centerSource, /2_400/);
  assert.match(
    centerSource,
    /\(previousIndex\) => \(previousIndex \+ 1\) % messages\.length/,
  );
  assert.doesNotMatch(centerSource, /setCurrentMessageIndex\(0\)/);
  assert.match(centerSource, /<p aria-hidden="true">/);
  assert.match(centerSource, /<span className="sr-only">/);
});

test("모든 백그라운드 AI 작업은 compact 순환 문구를 제공한다", () => {
  for (const taskSource of [
    analysisTaskSource,
    recommendationTaskSource,
    activitySynthesisTaskSource,
    answerDraftTaskSource,
  ]) {
    assert.match(taskSource, /pendingMessages:\s*\[/);
  }
});

test("compact AI 상태는 결과 보기와 실패 재시도를 제공하고 모바일 폭을 보호한다", () => {
  assert.match(centerSource, /결과 보기/);
  assert.match(centerSource, /다시 시도/);
  assert.match(centerSource, /작업 화면 보기/);
  assert.match(
    centerSource,
    /\/recommend\/history\?recommendationId=\$\{encodeURIComponent\(recommendationId\)\}/,
  );
  assert.match(styles, /\.ai-background-task-center/);
  assert.match(styles, /width:\s*min\(360px, calc\(100vw - 24px\)\)/);
  assert.match(styles, /prefers-reduced-motion/);
});
