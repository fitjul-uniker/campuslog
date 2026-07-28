# Experiences Selection and Scrollbar Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/experiences`의 선택 활동 행을 목록과 같은 재료 계층의 차콜 틴트로 정리하고, 상세·분석 패널 스크롤바를 유휴 상태에도 은은하게 유지한다.

**Architecture:** 기존 `AnimatedExperienceList`의 `data-selected` 계약과 공용 transient scrollbar controller/hook은 그대로 둔다. 선택 행의 표현은 Liquid Glass 범위 CSS만 교체하고, scrollbar는 CSS custom property로 유휴/활성 thumb 색을 공유하며 controller의 활성 유지 시간을 900ms로 조정한다.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS, Node test runner

## Global Constraints

- 선택, 상세 열기, 상세 닫기, 검색, 키보드 초점, 모바일 이동, 분석 동작을 변경하지 않는다.
- 선택 행은 흰 배경과 drop shadow를 사용하지 않는다.
- 선택 행은 `rgb(29 29 31 / 5.5%)` 틴트와 2px 왼쪽 인디케이터를 사용한다.
- 상세·분석 패널 scrollbar는 유휴 `18%`, 활성 `52%` 차콜 강도를 사용한다.
- 마지막 scroll 이벤트 900ms 뒤 활성 상태만 해제하고 thumb는 사라지지 않는다.
- 브라우저 페이지 scrollbar와 왼쪽 `.dashboard-animated-list` scrollbar는 변경하지 않는다.
- forced colors와 reduced motion 처리를 유지한다.
- API, schema, repository, 인증, 사용자 데이터, AI 요청 계약은 변경하지 않는다.
- 현재 worktree의 관련 없는 사용자 변경을 되돌리지 않는다.
- commit, push, PR은 사용자의 별도 승인 없이는 진행하지 않는다.

---

### Task 1: Flatten the Selected Activity Row

**Files:**
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: `.product-shell[data-liquid-glass="true"]`, `.dashboard-experience-title-button[data-selected="true"]`
- Produces: 차콜 틴트, no-shadow selected state, 2px decorative indicator, stable hover/mobile spacing

- [x] **Step 1: Establish the failing presentation check in the in-app browser**

```js
const selected = document.querySelector(
  '.dashboard-experience-title-button[data-selected="true"]',
);
const style = getComputedStyle(selected);
const indicator = getComputedStyle(selected, "::before");

({
  backgroundColor: style.backgroundColor,
  boxShadow: style.boxShadow,
  indicatorWidth: indicator.width,
  indicatorHeight: indicator.height,
  indicatorContent: indicator.content,
});
```

Expected RED evidence: the selected row resolves to a near-white background and non-`none` shadow, while `::before` has no rendered content or 2px indicator.

- [x] **Step 2: Implement the selected state**

Replace the Liquid Glass selected override with:

```css
.product-shell[data-liquid-glass="true"]
  .dashboard-experience-title-button[data-selected="true"] {
  border-color: transparent;
  background: rgb(29 29 31 / 5.5%);
  box-shadow: none;
}

.product-shell[data-liquid-glass="true"]
  .dashboard-experience-title-button[data-selected="true"]::before {
  position: absolute;
  top: 50%;
  left: 10px;
  width: 2px;
  height: 24px;
  border-radius: 999px;
  background: rgb(29 29 31 / 72%);
  content: "";
  transform: translateY(-50%);
}

@media (hover: hover) and (pointer: fine) {
  .product-shell[data-liquid-glass="true"]
    .dashboard-experience-title-button[data-selected="true"]:hover {
    background: rgb(29 29 31 / 8%);
  }
}

@media (max-width: 640px) {
  .product-shell[data-liquid-glass="true"]
    .dashboard-experience-title-button[data-selected="true"] {
    padding-left: 20px;
  }

  .product-shell[data-liquid-glass="true"]
    .dashboard-experience-title-button[data-selected="true"]::before {
    left: 7px;
    height: 22px;
  }
}
```

Keep the existing selected font weight, radius, semantic attributes, and `focus-visible` outline.

- [x] **Step 3: Re-run the same computed-style check and verify GREEN**

Expected: the selected row resolves to `rgba(29, 29, 31, 0.055)`, `boxShadow` is `none`, and the indicator resolves to 2px × 24px with rendered content.

---

### Task 2: Keep the Detail Scrollbar Visually Continuous

**Files:**
- Modify: `web/src/hooks/use-transient-scrollbar.test.mjs`
- Modify: `web/src/hooks/use-transient-scrollbar.structure.test.mjs`
- Modify: `web/src/hooks/transient-scrollbar-controller.ts`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Preserves: `data-transient-scrollbar="true"`, temporary `data-scrolling="true"`, existing cleanup
- Produces: `TRANSIENT_SCROLLBAR_HIDE_DELAY_MS = 900`
- CSS contract: `--transient-scrollbar-thumb` idle/active state, WebKit transition, forced-colors fallback

- [x] **Step 1: Update the controller behavior test first**

Change the controller test to expect 900ms:

```js
test("스크롤 중 표시 상태를 켜고 마지막 이벤트 900ms 뒤 유휴 상태로 돌아간다", () => {
  // existing setup
  assert.equal(scheduledCallbacks[0].delay, 900);
  // second scroll resets the timer
  assert.equal(scheduledCallbacks[1].delay, 900);
});
```

Keep `use-transient-scrollbar.structure.test.mjs` focused on the component-to-hook integration and forced-colors fallback. Remove the obsolete assertion that requires a fully transparent idle thumb; do not replace it with exact CSS source matching.

Before implementation, run the Step 6 computed-style check once and record RED evidence: idle is transparent, active is 56%, and `data-scrolling` is removed after the current 700ms delay.

- [x] **Step 2: Run the focused tests and verify RED**

Run:

```bash
cd web
node --test \
  src/hooks/use-transient-scrollbar.test.mjs \
  src/hooks/use-transient-scrollbar.structure.test.mjs
```

Expected: the controller test FAILS because the implementation still uses 700ms; the browser check independently records the obsolete transparent/56% visual state.

- [x] **Step 3: Update the controller delay**

```ts
export const TRANSIENT_SCROLLBAR_HIDE_DELAY_MS = 900;
```

Do not change timer reset or cleanup behavior.

- [x] **Step 4: Implement idle and active scrollbar strength**

Use one custom property for both standards and WebKit scrollbars:

```css
:is(
    .dashboard-experience-detail,
    .dashboard-analysis-split-panel
  )[data-transient-scrollbar="true"] {
  --transient-scrollbar-thumb: rgb(101 105 112 / 18%);
  scrollbar-color: var(--transient-scrollbar-thumb) transparent;
  scrollbar-width: thin;
}

:is(
    .dashboard-experience-detail,
    .dashboard-analysis-split-panel
  )[data-transient-scrollbar="true"][data-scrolling="true"] {
  --transient-scrollbar-thumb: rgb(101 105 112 / 52%);
}

:is(
    .dashboard-experience-detail,
    .dashboard-analysis-split-panel
  )[data-transient-scrollbar="true"]::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: var(--transient-scrollbar-thumb);
  transition: background-color 200ms ease;
}

@media (prefers-reduced-motion: reduce) {
  :is(
      .dashboard-experience-detail,
      .dashboard-analysis-split-panel
    )[data-transient-scrollbar="true"]::-webkit-scrollbar-thumb {
    transition-duration: 80ms;
  }
}
```

Keep the 6px width, transparent track, stable gutter, and forced-colors `scrollbar-color: auto` / `CanvasText` fallback.

- [x] **Step 5: Run the focused tests and verify GREEN**

Run:

```bash
cd web
node --test \
  src/hooks/use-transient-scrollbar.test.mjs \
  src/hooks/use-transient-scrollbar.structure.test.mjs
```

Expected: PASS.

- [x] **Step 6: Verify the visual scrollbar contract in the in-app browser**

Read the real panel's computed `scrollbar-color`, then dispatch a real scroll and read it again:

```js
const panel = document.querySelector(
  '.dashboard-experience-detail[data-transient-scrollbar="true"]',
);
const idle = getComputedStyle(panel).scrollbarColor;
const widthBefore = panel.clientWidth;
panel.scrollTop += 120;
panel.dispatchEvent(new Event("scroll", { bubbles: true }));
const active = getComputedStyle(panel).scrollbarColor;

({ idle, active, widthBefore, scrolling: panel.dataset.scrolling });
```

Expected: before the CSS change, idle is transparent and active is 56%; after the change, idle is 18%, active is 52%, and the same check after 920ms returns to the 18% idle color with unchanged `clientWidth`.

---

### Task 3: Verify Behavior, Responsiveness, and Accessibility

**Files:**
- Modify only if a visual defect is found: `web/src/app/globals.css`
- Create: `docs/qa-artifacts/experiences-selection-scrollbar-polish-390x844.png`
- Create: `docs/qa-artifacts/experiences-selection-scrollbar-polish-1400x900.png`
- Create: `docs/qa-artifacts/experiences-selection-scrollbar-polish-comparison.png`

- [x] **Step 1: Run the complete automated verification**

Run from `web`:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Then run from the worktree root:

```bash
git diff --check
```

Expected: every command exits 0.

- [x] **Step 2: Check computed selected-row styles in the in-app browser**

At `/experiences`, select an activity and verify:

- selected row background resolves to the approved charcoal tint
- selected row `box-shadow` is `none`
- `::before` is 2px wide and 24px high on desktop
- focus-visible remains visible with keyboard navigation
- selected hover does not change padding or geometry

- [x] **Step 3: Check scrollbar state and layout stability**

For both `.dashboard-experience-detail` and `.dashboard-analysis-split-panel`:

- record `clientWidth` before scrolling
- confirm idle `scrollbar-color` contains the 18% thumb
- scroll the panel and confirm `data-scrolling="true"` plus the 52% thumb
- wait at least 920ms and confirm `data-scrolling` is removed
- confirm the idle 18% thumb remains and `clientWidth` is unchanged

- [x] **Step 4: Check responsive boundaries**

Use the in-app browser at:

- 390×844
- 860×800
- 861×800
- 1024×800
- 1400×900

At each size confirm:

- no horizontal overflow
- the selected indicator does not overlap title or status badge
- selected text is not clipped
- the title/list/detail hierarchy remains readable
- detail and analysis panels still scroll internally where applicable

- [x] **Step 5: Capture and compare visual evidence**

Capture the selected list/detail state at 390×844 and 1400×900. Build a same-viewport comparison using the existing pre-change screenshot and the new screenshot, then inspect the combined image for fill, shadow, spacing, alignment, radius, and scrollbar defects.

---

### Task 4: Record Only Verified Work

**Files:**
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `design-qa.md`

- [x] **Step 1: Update the active design and screen contracts**

Record:

- selected activity uses an in-surface charcoal tint and 2px indicator, not a separate white card
- detail/analysis scrollbar remains faint at idle and strengthens during scroll
- active state returns to idle after 900ms
- reduced motion and forced colors behavior

- [x] **Step 2: Add the verified task and issue records**

Add a resolved `ISSUE-106` entry only after browser QA passes. Include changed files, reason, automated checks, viewport checks, and any remaining visual limitation.

- [x] **Step 3: Re-run documentation and diff checks**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors; only the intended files plus preserved pre-existing user changes are reported.

- [x] **Step 4: Leave Git publishing untouched**

Do not stage, commit, push, or open a PR until the user separately approves those Git actions.
