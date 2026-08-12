import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const configSource = await readFile(
  new URL("./aiModelConfig.ts", import.meta.url),
  "utf8",
);
const routeSources = await Promise.all(
  [
    "../app/api/analyze/route.ts",
    "../app/api/answer-drafts/route.ts",
    "../app/api/evidence-followups/route.ts",
    "../app/api/recommend/route.ts",
    "../app/api/synthesize-activity/route.ts",
  ].map(async (path) => ({
    path,
    source: await readFile(new URL(path, import.meta.url), "utf8"),
  })),
);

test("AI model routing keeps GPT-4.1 mini only for experience recommendations", () => {
  assert.match(configSource, /recommendation:\s*"gpt-4\.1-mini"/);

  for (const feature of [
    "activitySynthesis",
    "analysis",
    "answerDrafts",
    "evidenceFollowups",
  ]) {
    assert.match(
      configSource,
      new RegExp(`${feature}:\\s*"gpt-5\\.6-luna"`),
    );
  }
});

test("Luna routes explicitly use the benchmarked no-reasoning baseline", () => {
  assert.match(configSource, /effort:\s*"none"/);

  for (const { source } of routeSources.filter(
    ({ path }) => !path.includes("recommend/route.ts"),
  )) {
    assert.match(source, /AI_MODELS, LUNA_REASONING/);
    assert.match(source, /reasoning:\s*LUNA_REASONING/);
    assert.doesNotMatch(source, /const\s+\w+_MODEL\s*=\s*"gpt-4\.1-mini"/);
  }
});

test("recommendation route stays on its dedicated GPT-4.1 mini model", () => {
  const recommendationRoute = routeSources.find(({ path }) =>
    path.includes("recommend/route.ts"),
  )?.source;

  assert.ok(recommendationRoute);
  assert.match(recommendationRoute, /import\s+\{\s*AI_MODELS\s*\}/);
  assert.match(
    recommendationRoute,
    /const\s+RECOMMENDATION_MODEL\s*=\s*AI_MODELS\.recommendation/,
  );
});
