import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./TodayDashboard.tsx", import.meta.url),
  "utf8",
);

test("활동 공통 피드백은 개별 활동 목록보다 먼저 표시한다", () => {
  const feedbackIndex = source.indexOf("{activityActionError ? (");
  const activeListIndex = source.indexOf("{activeActivities.length > 0 ? (");
  const completionListIndex = source.indexOf(
    "{activitiesRequiringCompletion.length > 0 ? (",
  );

  assert.notEqual(feedbackIndex, -1, "공통 피드백 영역을 찾을 수 없습니다.");
  assert.notEqual(activeListIndex, -1, "진행 활동 목록을 찾을 수 없습니다.");
  assert.notEqual(
    completionListIndex,
    -1,
    "경험 정리 필요 목록을 찾을 수 없습니다.",
  );
  assert.ok(
    feedbackIndex < activeListIndex && feedbackIndex < completionListIndex,
    "공통 피드백은 특정 활동 목록 아래가 아니라 모든 목록 위에 있어야 합니다.",
  );
});
