import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sources = await Promise.all(
  [
    "../ai/RecommendationForm.tsx",
    "../experiences/DashboardExperienceDetail.tsx",
    "../experiences/ExperienceAnalysisClient.tsx",
    "../experiences/DashboardAnalysisSplitPanel.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
);

test("AI 실행 화면은 AnimatedGradientActionButton을 사용한다", () => {
  for (const source of sources) {
    assert.match(source, /AnimatedGradientActionButton/);
  }

  assert.match(sources[0], /icon=\{<Sparkles/);
  assert.match(sources[1], /icon=\{<Sparkles/);
  assert.match(sources[2], /icon=\{<RefreshCcw/);
  assert.match(sources[2], /icon=\{<Sparkles/);
  assert.match(sources[3], /icon=\{<RefreshCcw/);
});

test("AI 결과 조회는 기존 버튼을 유지하고 독립 분석의 추천 링크는 제거한다", () => {
  assert.match(sources[1], />\s*AI 분석 결과\s*</);
  assert.doesNotMatch(sources[2], />\s*AI 기반 활동 추천\s*</);
});
