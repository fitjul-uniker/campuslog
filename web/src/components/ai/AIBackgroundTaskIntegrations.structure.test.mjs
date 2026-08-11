import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const experienceHookSource = await readFile(
  new URL("../../hooks/use-experience-analysis-task.ts", import.meta.url),
  "utf8",
);
const experienceDashboardSource = await readFile(
  new URL("../experiences/ExperienceDashboard.tsx", import.meta.url),
  "utf8",
);
const recommendationPageSource = await readFile(
  new URL("../../app/recommend/page.tsx", import.meta.url),
  "utf8",
);
const activityDetailSource = await readFile(
  new URL("../activities/ActivityDetailClient.tsx", import.meta.url),
  "utf8",
);
const answerDraftSource = await readFile(
  new URL("./RecommendationResult.tsx", import.meta.url),
  "utf8",
);
const recommendationHistorySource = await readFile(
  new URL("../../app/recommend/history/page.tsx", import.meta.url),
  "utf8",
);

test("경험 분석은 경험 id별 task로 실행하고 route unmount 취소 대신 background 전환을 제공한다", () => {
  assert.match(experienceHookSource, /experience-analysis:\$\{experienceId\}/);
  assert.match(experienceHookSource, /startTask\(definition/);
  assert.match(experienceHookSource, /analyzeCurrentExperience\(experienceId/);
  assert.match(experienceDashboardSource, /analysisTask\.sendToBackground\(\)/);
  assert.match(experienceDashboardSource, /router\.push\("\/dashboard"\)/);
  assert.doesNotMatch(
    experienceDashboardSource,
    /return \(\) => \{[\s\S]{0,200}analysisTask\.cancel/,
  );
});

test("추천과 활동 합성은 API 호출부터 repository 저장까지 같은 background runner 안에서 완료한다", () => {
  assert.match(recommendationPageSource, /startTask\(/);
  assert.match(recommendationPageSource, /requestRecommendation\(/);
  assert.match(recommendationPageSource, /repository\.recommendations\.save/);
  assert.match(recommendationPageSource, /sendTaskToBackground/);

  assert.match(activityDetailSource, /startTask\(/);
  assert.match(activityDetailSource, /requestActivitySynthesis\(/);
  assert.match(activityDetailSource, /repository\.synthesisDrafts\.save/);
  assert.match(activityDetailSource, /sendTaskToBackground/);
});

test("답변 초안은 진행 중 unmount에서 abort하지 않고 background로 넘기며 저장 결과 경로를 유지한다", () => {
  assert.match(answerDraftSource, /startTask\(/);
  assert.match(answerDraftSource, /requestAnswerDraftsStream\(/);
  assert.match(answerDraftSource, /repository\.answerDrafts\.save/);
  assert.match(answerDraftSource, /sendTaskToBackground\(activeTaskKey\)/);
  assert.match(answerDraftSource, /\/recommend\/history\?recommendationId=/);
  assert.match(recommendationHistorySource, /recommendationId/);
  assert.match(recommendationHistorySource, /setSelectedRecommendationId/);
});
