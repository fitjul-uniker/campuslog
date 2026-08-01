import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const apiRouteUrls = [
  "../app/api/analyze/route.ts",
  "../app/api/recommend/route.ts",
  "../app/api/answer-drafts/route.ts",
  "../app/api/evidence-followups/route.ts",
];
const apiRouteSources = await Promise.all(
  apiRouteUrls.map((url) => readFile(new URL(url, import.meta.url), "utf8")),
);
const formSource = await readFile(
  new URL("../components/experiences/ExperienceForm.tsx", import.meta.url),
  "utf8",
);

test("AI API는 상세 역할 기록을 1000자까지 일관되게 허용한다", () => {
  for (const source of apiRouteSources) {
    assert.match(source, /const MAX_EXPERIENCE_ROLE_LENGTH = 1_000;/);
  }
});

test("경험 입력 화면의 역할 제한은 AI API 제한과 일치한다", () => {
  assert.match(
    formSource,
    /id="experience-role"[\s\S]*?maxLength=\{1_000\}/,
  );
});
