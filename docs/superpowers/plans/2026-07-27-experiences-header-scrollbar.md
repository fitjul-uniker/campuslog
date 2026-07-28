# Experiences Header and Transient Scrollbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/experiences`의 페이지 제목을 목록 Glass 표면에서 분리하고 우측 상세·분석 패널의 내부 스크롤바를 스크롤 중에만 표시한다.

**Architecture:** `ExperienceDashboard`의 페이지 H1/설명은 `LayoutGroup` 밖의 공통 `primary-page-heading`으로 이동하고, 목록 Glass 안에는 H2 `전체 활동`과 목록 제어만 남긴다. 상세와 분석 패널은 공용 `useTransientScrollbar` hook으로 `data-scrolling` 상태를 공유하고 CSS가 기본 투명·활성 표시·forced-colors fallback을 담당한다.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Motion, CSS, Node test runner

## Global Constraints

- 페이지 H1은 `나의 활동` 하나만 유지한다.
- 목록 섹션 H2는 `전체 활동`을 사용한다.
- 마지막 내부 스크롤 이벤트 후 `700ms`가 지나면 scrollbar thumb를 숨긴다.
- 브라우저 전체 페이지 스크롤바와 좌측 활동 목록 스크롤바는 변경하지 않는다.
- forced colors에서는 시스템 scrollbar 가시성을 보존한다.
- API, schema, repository, 인증, 사용자 데이터, AI 요청 계약은 변경하지 않는다.
- 검색, 선택, 상세 닫기, Escape, 모바일 상세 이동, 삭제, 분석 동작은 유지한다.
- 기존 사용자 변경을 되돌리거나 관련 없는 파일을 수정하지 않는다.
- commit, push, PR은 사용자의 별도 승인 없이는 진행하지 않는다.

---

### Task 1: Separate Page Header from Activity Workspace

**Files:**
- Create: `web/src/components/experiences/ExperienceDashboard.structure.test.mjs`
- Modify: `web/src/components/experiences/ExperienceDashboard.tsx`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: `primary-page-heading`, `dashboard-experience-workspace`, `dashboard-experience-list-pane liquid-workspace`
- Produces: Glass 밖 H1 `나의 활동`, Glass 안 H2 `전체 활동`, 기존 count/search/list 동작

- [x] **Step 1: Write the failing hierarchy test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./ExperienceDashboard.tsx", import.meta.url),
  "utf8",
);

test("나의 활동 페이지 제목은 목록 Glass 밖에 있고 목록은 전체 활동 H2로 시작한다", () => {
  const pageHeaderStart = source.indexOf(
    '<header className="dashboard-experience-heading primary-page-heading">',
  );
  const layoutGroupStart = source.indexOf(
    '<LayoutGroup id="dashboard-experience-layout">',
  );
  const listPaneStart = source.indexOf(
    'className="dashboard-experience-list-pane liquid-workspace"',
  );
  const sectionHeadingStart = source.indexOf(
    '<header className="dashboard-experience-section-heading">',
  );

  assert.ok(pageHeaderStart > -1);
  assert.ok(layoutGroupStart > pageHeaderStart);
  assert.ok(listPaneStart > layoutGroupStart);
  assert.ok(sectionHeadingStart > listPaneStart);
  assert.match(
    source.slice(pageHeaderStart, layoutGroupStart),
    /<h1 id="dashboard-experience-heading">나의 활동<\/h1>[\s\S]*primary-page-description/,
  );
  assert.match(
    source.slice(sectionHeadingStart),
    /<h2 id="dashboard-experience-list-heading">전체 활동<\/h2>/,
  );
  assert.match(
    source,
    /aria-labelledby="dashboard-experience-list-heading"/,
  );
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd web
node --test src/components/experiences/ExperienceDashboard.structure.test.mjs
```

Expected: FAIL because the page header currently starts after `LayoutGroup` inside the list `liquid-workspace`, and no H2 `전체 활동` exists.

- [x] **Step 3: Implement the approved JSX hierarchy**

Use this structure in `ExperienceDashboard.tsx`:

```tsx
<header className="dashboard-experience-heading primary-page-heading">
  <h1 id="dashboard-experience-heading">나의 활동</h1>
  <p className="primary-page-description">
    진행 중인 활동과 완료된 경험을 한곳에서 확인합니다.
  </p>
</header>

<LayoutGroup id="dashboard-experience-layout">
  <motion.div className="dashboard-experience-workspace">
    <motion.section
      className="dashboard-experience-list-pane liquid-workspace"
      aria-labelledby="dashboard-experience-list-heading"
    >
      <header className="dashboard-experience-section-heading">
        <div className="dashboard-experience-heading-row">
          <div className="dashboard-experience-title-group">
            <h2 id="dashboard-experience-list-heading">전체 활동</h2>
            {activityItems && !loadError ? (
              <span className="dashboard-experience-count">
                <CountUp to={activityItems.length} duration={0.75} />
                <span className="sr-only">
                  전체 활동 {activityItems.length}개
                </span>
              </span>
            ) : null}
            {activityItems && !loadError ? (
              <span className="dashboard-active-activity-count">
                진행 중
                <CountUp to={activeActivityCount} duration={0.75} />
                <span className="sr-only">{activeActivityCount}개</span>
              </span>
            ) : null}
          </div>
          {activityItems && activityItems.length > 0 ? (
            <GooeyInput
              className="dashboard-experience-search liquid-capsule"
              placeholder="검색"
              value={searchQuery}
              onValueChange={setSearchQuery}
              expandedWidth={hasSelection ? 218 : 250}
            />
          ) : null}
        </div>
        {normalizedSearchQuery && filteredActivityItems ? (
          <p className="master-detail-search-feedback" role="status">
            {filteredActivityItems.length}개의 활동을 찾았습니다.
          </p>
        ) : null}
      </header>
    </motion.section>
  </motion.div>
</LayoutGroup>
```

Keep all existing state expressions and handlers unchanged. Update CSS so:

```css
.dashboard-experience-heading {
  margin-bottom: 30px;
}

.dashboard-experience-section-heading {
  margin-bottom: 24px;
}

.dashboard-experience-section-heading h2 {
  margin: 0;
  color: #171717;
  font-size: clamp(1.22rem, 2vw, 1.5rem);
  font-weight: 720;
  letter-spacing: -0.035em;
  line-height: 1.2;
}
```

Move mobile/search selectors that currently require `.primary-page-heading` to `.dashboard-experience-section-heading`, while keeping the existing 44px collapsed search trigger and container-query behavior.

- [x] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
cd web
node --test src/components/experiences/ExperienceDashboard.structure.test.mjs
```

Expected: PASS.

### Task 2: Add Transient Scrollbars to Detail and Analysis Panels

**Files:**
- Create: `web/src/hooks/transient-scrollbar-controller.ts`
- Create: `web/src/hooks/use-transient-scrollbar.ts`
- Create: `web/src/hooks/use-transient-scrollbar.test.mjs`
- Create: `web/src/hooks/use-transient-scrollbar.structure.test.mjs`
- Modify: `web/src/components/experiences/DashboardExperienceDetail.tsx`
- Modify: `web/src/components/experiences/DashboardAnalysisSplitPanel.tsx`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Produces: 실제 timer와 표시 상태를 관리하는 `createTransientScrollbarController`
- Produces: `useTransientScrollbar<T extends HTMLElement>(): UIEventHandler<T>`
- Consumes: React `onScroll` events from the detail `motion.section` and analysis `motion.aside`
- CSS contract: `data-transient-scrollbar="true"` and temporary `data-scrolling="true"`

- [x] **Step 1: Write the failing scrollbar behavior and integration tests**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [hook, detail, analysis, styles] = await Promise.all([
  readFile(
    new URL("./use-transient-scrollbar.ts", import.meta.url),
    "utf8",
  ).catch(() => ""),
  readFile(
    new URL(
      "../components/experiences/DashboardExperienceDetail.tsx",
      import.meta.url,
    ),
    "utf8",
  ),
  readFile(
    new URL(
      "../components/experiences/DashboardAnalysisSplitPanel.tsx",
      import.meta.url,
    ),
    "utf8",
  ),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

test("상세와 분석 scrollbar는 scroll 중에만 활성화되고 timer를 정리한다", () => {
  assert.match(hook, /TRANSIENT_SCROLLBAR_HIDE_DELAY_MS = 700/);
  assert.match(hook, /dataset\.scrolling = "true"/);
  assert.match(hook, /delete activeElementRef\.current\.dataset\.scrolling/);
  assert.match(hook, /window\.clearTimeout/);
  assert.match(detail, /useTransientScrollbar/);
  assert.match(detail, /data-transient-scrollbar="true"/);
  assert.match(detail, /onScroll=\{handleTransientScroll\}/);
  assert.match(analysis, /useTransientScrollbar/);
  assert.match(analysis, /data-transient-scrollbar="true"/);
  assert.match(analysis, /onScroll=\{handleTransientScroll\}/);
  assert.match(styles, /\[data-transient-scrollbar="true"\][^{]*\{[^}]*scrollbar-color:\s*transparent transparent/is);
  assert.match(styles, /\[data-scrolling="true"\][^{]*\{[^}]*scrollbar-color:/is);
  assert.match(styles, /@media \(forced-colors: active\)[\s\S]*scrollbar-color:\s*auto/is);
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd web
node --test src/hooks/use-transient-scrollbar.structure.test.mjs
```

Expected: FAIL because the controller, hook, and transient scrollbar selectors do not exist.

- [x] **Step 3: Implement the shared controller and hook**

Create `web/src/hooks/use-transient-scrollbar.ts`:

```ts
"use client";

import {
  type UIEventHandler,
  useCallback,
  useEffect,
  useRef,
} from "react";

export const TRANSIENT_SCROLLBAR_HIDE_DELAY_MS = 700;

export function useTransientScrollbar<
  T extends HTMLElement,
>(): UIEventHandler<T> {
  const hideTimerRef = useRef<number | null>(null);
  const activeElementRef = useRef<T | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const handleScroll = useCallback<UIEventHandler<T>>(
    (event) => {
      const element = event.currentTarget;
      activeElementRef.current = element;
      element.dataset.scrolling = "true";
      clearHideTimer();
      hideTimerRef.current = window.setTimeout(() => {
        if (activeElementRef.current) {
          delete activeElementRef.current.dataset.scrolling;
        }
        hideTimerRef.current = null;
      }, TRANSIENT_SCROLLBAR_HIDE_DELAY_MS);
    },
    [clearHideTimer],
  );

  useEffect(
    () => () => {
      clearHideTimer();
      if (activeElementRef.current) {
        delete activeElementRef.current.dataset.scrolling;
      }
    },
    [clearHideTimer],
  );

  return handleScroll;
}
```

- [x] **Step 4: Connect both right-hand panels**

In each component:

```tsx
const handleTransientScroll = useTransientScrollbar<HTMLElement>();
```

Add to the scrolling root:

```tsx
data-transient-scrollbar="true"
onScroll={handleTransientScroll}
```

Do not add the hook to `.dashboard-animated-list` or the browser page.

- [x] **Step 5: Add cross-browser scrollbar CSS**

```css
:is(
  .dashboard-experience-detail,
  .dashboard-analysis-split-panel
)[data-transient-scrollbar="true"] {
  scrollbar-color: transparent transparent;
  scrollbar-width: thin;
}

:is(
  .dashboard-experience-detail,
  .dashboard-analysis-split-panel
)[data-transient-scrollbar="true"][data-scrolling="true"] {
  scrollbar-color: rgb(101 105 112 / 56%) transparent;
}

:is(
  .dashboard-experience-detail,
  .dashboard-analysis-split-panel
)[data-transient-scrollbar="true"]::-webkit-scrollbar {
  width: 6px;
}

:is(
  .dashboard-experience-detail,
  .dashboard-analysis-split-panel
)[data-transient-scrollbar="true"]::-webkit-scrollbar-track,
:is(
  .dashboard-experience-detail,
  .dashboard-analysis-split-panel
)[data-transient-scrollbar="true"]::-webkit-scrollbar-thumb {
  background: transparent;
}

:is(
  .dashboard-experience-detail,
  .dashboard-analysis-split-panel
)[data-transient-scrollbar="true"]::-webkit-scrollbar-thumb {
  border-radius: 999px;
}

:is(
  .dashboard-experience-detail,
  .dashboard-analysis-split-panel
)[data-transient-scrollbar="true"][data-scrolling="true"]::-webkit-scrollbar-thumb {
  background: rgb(101 105 112 / 56%);
}

@media (forced-colors: active) {
  :is(
    .dashboard-experience-detail,
    .dashboard-analysis-split-panel
  )[data-transient-scrollbar="true"] {
    scrollbar-color: auto;
  }

  :is(
    .dashboard-experience-detail,
    .dashboard-analysis-split-panel
  )[data-transient-scrollbar="true"]::-webkit-scrollbar-thumb {
    background: CanvasText;
  }
}
```

- [x] **Step 6: Run the focused tests and verify GREEN**

Run:

```bash
cd web
node --test src/hooks/use-transient-scrollbar.structure.test.mjs
node --test src/components/experiences/ExperienceDashboard.structure.test.mjs
node --test src/components/experiences/DashboardExperienceDetail.structure.test.mjs
node --test src/components/experiences/DashboardAnalysisSplitPanel.structure.test.mjs
```

Expected: all focused tests pass.

### Task 3: Responsive QA and Active Documentation

**Files:**
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `design-qa.md`
- Create: `docs/qa-artifacts/experiences-header-separated-after.png`
- Create: `docs/qa-artifacts/experiences-detail-scrolling-after.png`

**Interfaces:**
- Consumes: approved design and verified browser metrics
- Produces: active product rule and honest implementation record

- [x] **Step 1: Run full automated verification**

Run these commands separately:

```bash
cd web
node --test src/**/*.test.mjs
npm run lint
npx tsc --noEmit
npm run build
cd ..
git diff --check
```

Expected: zero failures. Existing Node module-type warnings may remain documented but cannot be reported as failures.

- [x] **Step 2: Verify the responsive screen hierarchy**

At `1400×900`, `1024×800`, `861×800`, `860×800`, and `390×844`:

- H1 and description are visibly outside the list Glass.
- The list Glass starts with H2 `전체 활동`, counts, and search.
- Opening a list item keeps the page header above the list/detail grid.
- At 860px and 390px the layout is vertical with no horizontal overflow.
- Search collapse/expand and selected detail flow remain usable.

- [x] **Step 3: Verify transient scrollbar behavior**

For the right detail and analysis panel:

- Before scrolling, computed `scrollbar-color` is transparent.
- During a scroll event, `data-scrolling="true"` appears and the thumb is visible.
- `700ms` after the last event, `data-scrolling` is removed.
- `clientWidth` is unchanged before, during, and after scrolling.
- Browser page and left list scrollbar behavior is unchanged.

- [x] **Step 4: Save and inspect accepted screenshots**

Capture:

- `docs/qa-artifacts/experiences-header-separated-after.png`
- `docs/qa-artifacts/experiences-detail-scrolling-after.png`

Reject and recapture any blank, loading, cropped, or wrong-state image before recording it in `design-qa.md`.

- [x] **Step 5: Update active and record documents**

Record only:

- the separated H1/H2 hierarchy;
- the transient right-panel scrollbar contract;
- the viewport results actually checked;
- the commands and results actually run;
- any warning or unverified OS preference state.

- [ ] **Step 6: Commit only after explicit approval**

Recommended commit message:

```text
fix: separate experiences header and refine scrolling
```
