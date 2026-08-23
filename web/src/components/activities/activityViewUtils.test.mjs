import assert from "node:assert/strict";
import test from "node:test";

import {
  getActivityPlanningHorizonDateKey as getUiPlanningHorizonDateKey,
  getTrackedActivityDisplayState,
  getTrackedActivityWorkflowState,
  isActivityRecordableOnDate as isUiActivityRecordableOnDate,
} from "./activityViewUtils.ts";
import {
  getActivityPlanningHorizonDateKey,
  isActivityRecordableOnDate,
} from "../../lib/activityDatePolicy.ts";

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

test("종료 후 경험 저장 전에는 경험 정리 필요 상태를 사용한다", () => {
  const completedActivity = {
    ...baseActivity,
    status: "completed",
    completedAt: "2026-07-22",
  };

  assert.equal(
    getTrackedActivityWorkflowState(completedActivity, "2026-07-23"),
    "completion_required",
  );
  assert.equal(
    getTrackedActivityWorkflowState(
      { ...completedActivity, generatedExperienceId: "experience-test" },
      "2026-07-23",
    ),
    null,
  );
});

test("오늘부터 12개월 뒤까지 계획 날짜를 연다", () => {
  for (const getHorizon of [
    getActivityPlanningHorizonDateKey,
    getUiPlanningHorizonDateKey,
  ]) {
    assert.equal(getHorizon("2026-08-21"), "2027-08-21");
    assert.equal(getHorizon("2024-02-29"), "2025-02-28");
  }
});

test("진행 활동은 기간 안의 미래 날짜에 계획을 작성할 수 있다", () => {
  for (const canRecord of [
    isActivityRecordableOnDate,
    isUiActivityRecordableOnDate,
  ]) {
    assert.equal(
      canRecord(
        { ...baseActivity, expectedEndDate: "2027-03-31" },
        "2027-03-15",
        "2026-08-21",
      ),
      true,
    );
  }
});

test("시작 예정 활동은 오늘이 아닌 미래 활동 기간에만 계획할 수 있다", () => {
  const plannedActivity = {
    ...baseActivity,
    startDate: "2026-09-01",
    expectedEndDate: "2026-12-31",
    status: "planned",
  };

  assert.equal(
    isActivityRecordableOnDate(plannedActivity, "2026-09-10", "2026-08-21"),
    true,
  );
  assert.equal(
    isActivityRecordableOnDate(
      { ...plannedActivity, startDate: "2026-08-21" },
      "2026-08-21",
      "2026-08-21",
    ),
    false,
  );
});

test("활동 기간 밖과 12개월 계획 범위 밖 날짜는 열지 않는다", () => {
  assert.equal(
    isActivityRecordableOnDate(
      { ...baseActivity, expectedEndDate: "2026-09-30" },
      "2026-10-01",
      "2026-08-21",
    ),
    false,
  );
  assert.equal(
    isActivityRecordableOnDate(
      { ...baseActivity, expectedEndDate: "" },
      "2027-08-22",
      "2026-08-21",
    ),
    false,
  );
});
