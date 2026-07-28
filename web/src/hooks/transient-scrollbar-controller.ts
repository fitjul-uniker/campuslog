export const TRANSIENT_SCROLLBAR_HIDE_DELAY_MS = 900;

type TransientScrollbarTarget = Pick<HTMLElement, "dataset">;

type TransientScrollbarControllerOptions = {
  setTimer: (callback: () => void, delay: number) => number;
  clearTimer: (timerId: number) => void;
};

export function createTransientScrollbarController({
  setTimer,
  clearTimer,
}: TransientScrollbarControllerOptions) {
  let activeTarget: TransientScrollbarTarget | null = null;
  let hideTimerId: number | null = null;

  const clearHideTimer = () => {
    if (hideTimerId === null) {
      return;
    }

    clearTimer(hideTimerId);
    hideTimerId = null;
  };

  const removeScrollingState = () => {
    if (activeTarget) {
      delete activeTarget.dataset.scrolling;
    }
  };

  return {
    handleScroll(target: TransientScrollbarTarget) {
      clearHideTimer();
      activeTarget = target;
      target.dataset.scrolling = "true";
      hideTimerId = setTimer(() => {
        removeScrollingState();
        hideTimerId = null;
      }, TRANSIENT_SCROLLBAR_HIDE_DELAY_MS);
    },
    cleanup() {
      clearHideTimer();
      removeScrollingState();
      activeTarget = null;
    },
  };
}
