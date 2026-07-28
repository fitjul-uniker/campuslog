# Sidebar Width and Wordmark Centering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Liquid Glass 데스크톱 사이드바를 넓히고 `CampusLog` 워드마크를 사이드바의 실제 중심에 고정한다.

**Architecture:** 기존 `AppShell` DOM과 모바일 헤더는 유지한다. `globals.css`의 `--liquid-sidebar-width`와 데스크톱 `.app-brand` 기하만 조정하고, 메인 콘텐츠는 이미 같은 CSS 변수를 소비하므로 자동으로 재배치되게 한다.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, Node test runner

## Global Constraints

- Track B 디자인·사용자 경험 고도화 범위 안에서 작업한다.
- API, schema, repository, 인증, 사용자 데이터 계약은 변경하지 않는다.
- 860px 이하 모바일 앱 바는 변경하지 않는다.
- 1180px 이상 사이드바는 `224px`, 861~1179px 사이드바는 `200px`를 사용한다.
- 기존 사용자 변경을 되돌리거나 관련 없는 파일을 수정하지 않는다.
- commit, push, PR은 사용자의 별도 승인 없이는 진행하지 않는다.

---

### Task 1: Sidebar Geometry Regression

**Files:**
- Modify: `web/src/components/layout/AppShell.structure.test.mjs`
- Modify: `web/src/app/globals.css`
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `design-qa.md`

**Interfaces:**
- Consumes: `.product-shell[data-liquid-glass="true"]`, `--liquid-sidebar-width`, `.app-brand`, `.app-sidebar`, `.app-main`
- Produces: wide `224px`, compact `200px`, sidebar와 같은 inset/폭을 사용하는 가운데 정렬 워드마크

- [x] **Step 1: Write the failing structure test**

```js
test("desktop wordmark stays centered in the widened liquid sidebar", async () => {
  const globals = await readFile(globalsPath, "utf8");

  assert.match(globals, /--liquid-sidebar-width:\s*224px/);
  assert.match(globals, /\.app-brand\s*\{[^}]*left:\s*20px[^}]*width:\s*var\(--liquid-sidebar-width\)[^}]*justify-content:\s*center/is);
  assert.match(globals, /@media \(min-width: 861px\) and \(max-width: 1179px\)[\s\S]*--liquid-sidebar-width:\s*200px/);
  assert.match(globals, /@media \(min-width: 861px\) and \(max-width: 1179px\)[\s\S]*\.app-brand\s*\{[^}]*left:\s*14px/is);
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `cd web && node --test src/components/layout/AppShell.structure.test.mjs`

Expected: FAIL because the current widths are `204px` / `188px` and the wordmark uses a narrower offset box.

- [x] **Step 3: Implement the minimum CSS change**

```css
.product-shell[data-liquid-glass="true"] {
  --liquid-sidebar-width: 224px;
}

@media (min-width: 861px) {
  .product-shell[data-liquid-glass="true"] .app-brand {
    left: 20px;
    display: flex;
    width: var(--liquid-sidebar-width);
    justify-content: center;
    text-align: center;
  }
}

@media (min-width: 861px) and (max-width: 1179px) {
  .product-shell[data-liquid-glass="true"] {
    --liquid-sidebar-width: 200px;
  }

  .product-shell[data-liquid-glass="true"] .app-brand {
    left: 14px;
  }
}
```

- [x] **Step 4: Run focused and full automated verification**

Run:

```bash
cd web
node --test src/components/layout/AppShell.structure.test.mjs
node --test src/**/*.test.mjs
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Expected: all commands pass with no warnings or errors attributable to this change.

- [x] **Step 5: Verify responsive behavior in the local app**

At `1400×900`, `1024×800`, `861×800`, and `860×800`:

- Confirm desktop wordmark and sidebar horizontal centers match at 1400, 1024, and 861.
- Confirm the mobile header remains active at 860.
- Confirm `document.documentElement.scrollWidth <= window.innerWidth`.
- Confirm browser console warning/error count is zero.

- [x] **Step 6: Update active and record documents**

Record only the implemented widths, centering rule, verified viewports, and actual command results. Mark the issue resolved only after automated and browser verification pass.

- [ ] **Step 7: Commit only after explicit approval**

Recommended commit message:

```text
fix: stabilize liquid glass sidebar layout
```
