import assert from "node:assert/strict";
import test from "node:test";

let controllerModule = {};

try {
  controllerModule = await import("./transient-scrollbar-controller.ts");
} catch {
  // RED 상태에서는 아직 production module이 없습니다.
}

test("스크롤 중 표시 상태를 켜고 마지막 이벤트 650ms 뒤 유휴 상태로 돌아간다", () => {
  const createController =
    controllerModule.createTransientScrollbarController;

  assert.equal(typeof createController, "function");

  const scheduledCallbacks = [];
  const clearedTimers = [];
  const target = { dataset: {} };
  const controller = createController({
    setTimer: (callback, delay) => {
      scheduledCallbacks.push({ callback, delay });
      return scheduledCallbacks.length;
    },
    clearTimer: (timerId) => {
      clearedTimers.push(timerId);
    },
  });

  controller.handleScroll(target);

  assert.equal(target.dataset.scrolling, "true");
  assert.equal(scheduledCallbacks[0].delay, 650);

  controller.handleScroll(target);

  assert.deepEqual(clearedTimers, [1]);
  assert.equal(scheduledCallbacks[1].delay, 650);

  scheduledCallbacks[1].callback();

  assert.equal("scrolling" in target.dataset, false);
});

test("정리 시 예약 timer와 남은 표시 상태를 모두 제거한다", () => {
  const createController =
    controllerModule.createTransientScrollbarController;

  assert.equal(typeof createController, "function");

  const clearedTimers = [];
  const target = { dataset: {} };
  const controller = createController({
    setTimer: () => 11,
    clearTimer: (timerId) => {
      clearedTimers.push(timerId);
    },
  });

  controller.handleScroll(target);
  controller.cleanup();

  assert.deepEqual(clearedTimers, [11]);
  assert.equal("scrolling" in target.dataset, false);
});
