import assert from "node:assert/strict";
import test from "node:test";

import { getTrackedActivityDisplayState } from "./activityViewUtils.ts";

const baseActivity = {
  id: "activity-test",
  title: "테스트 활동",
  description: "상태 경계 검증",
  startDate: "2026-07-01",
  expectedEndDate: "2026-07-22",
  status: "active",
  completedAt: "",
  generatedExperienceId: "",
  synthesisStatus: "idle",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

test("예상 종료일이 지난 진행 활동은 종료 확인 필요로 표시한다", () => {
  assert.equal(
    getTrackedActivityDisplayState(baseActivity, "2026-07-23"),
    "completion_due",
  );
});

test("예상 종료일 당일까지는 진행 중으로 표시한다", () => {
  assert.equal(
    getTrackedActivityDisplayState(baseActivity, "2026-07-22"),
    "active",
  );
});

test("종료가 확정된 활동은 경험 정리 필요 상태와 구분한다", () => {
  assert.equal(
    getTrackedActivityDisplayState(
      {
        ...baseActivity,
        status: "completed",
        completedAt: "2026-07-22",
      },
      "2026-07-23",
    ),
    "completed",
  );
});
