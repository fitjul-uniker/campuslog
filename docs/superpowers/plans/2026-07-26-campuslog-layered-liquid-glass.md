# CampusLog Layered Liquid Glass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 선택 시안 옵션 1의 밝고 차분한 Liquid Glass 재료 체계를 인증 후 CampusLog 전체 제품 UI에 적용한다.

**Architecture:** 기존 `GlassSurface`와 `data-liquid-glass` scope를 확장하고, 제품 로직을 바꾸지 않는 semantic CSS hook으로 각 화면의 workspace·section·content·control 계층을 표현한다. 반복 목록과 긴 콘텐츠는 불투명 content plate로 유지하고, 앱 셸·페이지 작업 공간·도구·overlay만 backdrop blur를 사용한다.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS Modules, global CSS, Base UI, Radix UI, Motion, Lucide React, Node test runner

## Global Constraints

- Track B만 수정하며 인증·API·DB·repository·schema 계약을 변경하지 않는다.
- 비로그인 랜딩과 인증 화면은 이번 적용 범위에서 제외한다.
- 웜화이트, 베이지, 컬러 blob, purple AI gradient와 반복 ambient animation을 사용하지 않는다.
- Gallery는 JPG·PNG·WebP 최대 3장·장당 5MB 계약을 유지한다.
- 모든 core action은 44px target, focus-visible, Escape와 focus restore 계약을 유지한다.
- 360~1440px에서 가로 overflow가 없어야 한다.
- reduced motion/transparency, increased contrast, forced colors와 backdrop-filter 미지원 fallback을 유지한다.
- 현재 사용자 변경을 보존하고 `.superpowers/`를 stage하지 않는다.
- 사용자가 별도로 승인하기 전 commit, push, PR을 실행하지 않는다.

---

### Task 1: Shared material variants and semantic hooks

**Files:**
- Modify: `web/src/components/ui/glass-surface.tsx`
- Modify: `web/src/components/ui/glass-surface.module.css`
- Modify: `web/src/app/globals.css`
- Modify: `web/src/components/ui/GlassSurface.structure.test.mjs`
- Modify: `web/src/app/LiquidGlassFoundation.structure.test.mjs`

**Interfaces:**
- Consumes: existing `GlassSurfaceProps`, `data-liquid-glass="true"`
- Produces: `GlassVariant` values `frosted` and `content`, semantic classes `.liquid-workspace`, `.liquid-section`, `.liquid-content-plate`, `.liquid-control-group`, `.liquid-capsule`, `.liquid-prominent-action`

- [ ] **Step 1: Write failing material tests**

```js
assert.match(source, /"frosted"/);
assert.match(source, /"content"/);
assert.match(styles, /data-glass-variant="frosted"/);
assert.match(styles, /\\.liquid-workspace/);
assert.match(styles, /\\.liquid-content-plate/);
```

- [ ] **Step 2: Run tests and confirm RED**

Run:

```bash
node --test src/components/ui/GlassSurface.structure.test.mjs src/app/LiquidGlassFoundation.structure.test.mjs
```

Expected: FAIL because the new variants and semantic hooks do not exist.

- [ ] **Step 3: Implement material tokens and variants**

Add `frosted` and `content` to `GlassVariant`. Define cool canvas, material fill,
edge, blur, saturation and shadow tokens under the authenticated product scope.
Define `content` with no backdrop blur and `frosted` with the selected-image
workspace values.

- [ ] **Step 4: Add accessibility and browser fallbacks**

Extend existing `@supports not`, reduced transparency, increased contrast,
forced-colors and reduced-motion branches to the new semantic hooks.

- [ ] **Step 5: Run focused tests and lint**

Run:

```bash
node --test src/components/ui/GlassSurface.structure.test.mjs src/app/LiquidGlassFoundation.structure.test.mjs
npm run lint -- --no-warn-ignored src/components/ui/glass-surface.tsx
```

Expected: PASS.

- [ ] **Step 6: Prepare the task diff without committing**

Run:

```bash
git diff --check
git diff -- web/src/components/ui/glass-surface.tsx web/src/components/ui/glass-surface.module.css web/src/app/globals.css
```

Expected: clean diff; commit remains blocked until user approval.

---

### Task 2: Dashboard and calendar workspace

**Files:**
- Modify: `web/src/components/activities/TodayDashboard.tsx`
- Modify: `web/src/components/activities/ActivityCalendar.tsx`
- Modify: `web/src/components/activities/TodayDashboard.structure.test.mjs`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: Task 1 semantic material hooks
- Produces: Liquid Glass overview, calendar, record panel, control groups

- [ ] **Step 1: Write failing dashboard structure assertions**

```js
assert.match(source, /activity-overview liquid-workspace/);
assert.match(source, /activity-calendar-event-panel liquid-section/);
assert.match(calendarSource, /activity-calendar-navigation liquid-control-group/);
```

- [ ] **Step 2: Run dashboard test and confirm RED**

Run:

```bash
node --test src/components/activities/TodayDashboard.structure.test.mjs
```

Expected: FAIL because the semantic hooks are not rendered.

- [ ] **Step 3: Add semantic classes without changing handlers**

Apply the hooks to the existing overview, calendar navigation and selected-day
record section. Do not move buttons, change repository calls or alter dialog
state.

- [ ] **Step 4: Style dashboard surfaces**

Make overview a frosted workspace, calendar and record panel regular sections,
rows content plates, and related calendar controls one clear control group.
Preserve the 861~1179px one-column layout.

- [ ] **Step 5: Run focused tests**

Run:

```bash
node --test src/components/activities/TodayDashboard.structure.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Browser smoke the dashboard**

Check `/dashboard` at 1440, 1024, 861, 860, 390 and 360px. Confirm activity
links, add activity, calendar navigation, record panel, menus and no horizontal
overflow.

---

### Task 3: Experiences list, detail, and analysis split view

**Files:**
- Modify: `web/src/components/experiences/ExperienceDashboard.tsx`
- Modify: `web/src/components/experiences/DashboardExperienceDetail.tsx`
- Modify: `web/src/components/experiences/DashboardTrackedActivityDetail.tsx`
- Modify: `web/src/components/experiences/DashboardAnalysisSplitPanel.tsx`
- Modify: `web/src/components/experiences/DashboardExperienceDetail.structure.test.mjs`
- Modify: `web/src/components/experiences/DashboardAnalysisSplitPanel.structure.test.mjs`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: Task 1 semantic hooks and existing master-detail state
- Produces: frosted list pane, clear search tool, regular detail/analysis sibling surfaces

- [ ] **Step 1: Write failing master-detail assertions**

```js
assert.match(dashboardSource, /dashboard-experience-list-pane liquid-workspace/);
assert.match(detailSource, /dashboard-experience-detail liquid-section/);
assert.match(splitSource, /dashboard-analysis-split-panel liquid-section/);
```

- [ ] **Step 2: Run structure tests and confirm RED**

Run:

```bash
node --test src/components/experiences/DashboardExperienceDetail.structure.test.mjs src/components/experiences/DashboardAnalysisSplitPanel.structure.test.mjs
```

Expected: FAIL for missing semantic hooks.

- [ ] **Step 3: Apply classes to existing master-detail DOM**

Keep selection, close, analysis, edit, delete and focus-restore handlers intact.
Add only material hook classes to list pane, search action, detail and split
analysis surfaces.

- [ ] **Step 4: Style list and detail hierarchy**

Use a frosted list pane with divider rows rather than per-row blur. Use regular
detail and analysis sibling surfaces. Keep AnalysisResult and textarea content
near-solid.

- [ ] **Step 5: Run focused tests**

Run the two tests from Step 2 and expect PASS.

- [ ] **Step 6: Browser smoke experiences**

On `/experiences`, test search expand/collapse, selecting a row, opening saved AI
analysis, toggling a gap answer, Escape/close focus restore, and mobile stacking.
Confirm no horizontal overflow.

---

### Task 4: Recommendation form, gallery, result, and history

**Files:**
- Modify: `web/src/app/recommend/page.tsx`
- Modify: `web/src/components/ai/RecommendationForm.tsx`
- Modify: `web/src/components/ai/RecommendationImagePicker.tsx`
- Modify: `web/src/components/ai/RecommendationResult.tsx`
- Modify: `web/src/app/recommend/history/page.tsx`
- Modify: `web/src/components/ai/RecommendationForm.structure.test.mjs`
- Modify: `web/src/components/ai/RecommendationResult.structure.test.mjs`
- Modify: `web/src/app/recommend/page.structure.test.mjs`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: Task 1 semantic hooks and existing recommendation/Gallery behavior
- Produces: selected-image recommendation workspace and matching result/history surfaces

- [ ] **Step 1: Write failing recommendation assertions**

```js
assert.match(pageSource, /form-panel liquid-workspace/);
assert.match(formSource, /experience-form liquid-form/);
assert.match(resultSource, /recommendation-result[^"]*liquid-section/);
assert.match(pageSource, /recommendation-header-link[^"]*liquid-capsule/);
```

- [ ] **Step 2: Run recommendation tests and confirm RED**

Run:

```bash
node --test src/app/recommend/page.structure.test.mjs src/components/ai/RecommendationForm.structure.test.mjs src/components/ai/RecommendationResult.structure.test.mjs
```

Expected: FAIL for missing selected-image hooks.

- [ ] **Step 3: Apply semantic classes**

Add hooks to the form workspace, history action, select/textarea group, Gallery,
example prompts, AI action, result and history master-detail surfaces. Preserve
file validation, paste, drag, dialog and API submission handlers.

- [ ] **Step 4: Match the selected image**

At 1440×1024 match the chosen reference:

- floating clear history capsule
- large 30px frosted workspace
- 16px near-solid select and textarea
- regular Gallery tray
- clear example capsules
- dark prominent AI action

Use exact CampusLog copy and current file constraints, not the generated mock’s
incorrect PDF/10MB line.

- [ ] **Step 5: Run focused tests**

Run the three tests from Step 2 and expect PASS.

- [ ] **Step 6: Browser smoke recommendation**

Check `/recommend` and `/recommend/history` at desktop and mobile. Test select,
prompt, file dialog, drag/paste contract, Gallery expand/delete, AI submit enabled
state, history detail and Escape focus restore. Do not submit a paid AI request
unless existing test data and user action make it safe.

---

### Task 5: Remaining authenticated detail and form routes

**Files:**
- Modify: `web/src/components/activities/ActivityCreateScreen.tsx`
- Modify: `web/src/components/activities/ActivityCreateForm.tsx`
- Modify: `web/src/components/activities/ActivityDetailClient.tsx`
- Modify: `web/src/components/experiences/ExperienceForm.tsx`
- Modify: `web/src/components/experiences/ExperienceDetailClient.tsx`
- Modify: `web/src/components/experiences/ExperienceAnalysisClient.tsx`
- Modify: `web/src/app/globals.css`
- Test: related existing `*.structure.test.mjs` files

**Interfaces:**
- Consumes: Task 1 hooks
- Produces: consistent form, detail, timeline, attachment and analysis surfaces

- [ ] **Step 1: Add focused failing assertions to existing structure tests**

Assert that activity/experience page roots or major panels include
`liquid-section`, `liquid-workspace` or `liquid-content-plate` according to role.

- [ ] **Step 2: Run related tests and confirm RED**

Run:

```bash
node --test src/components/activities/*.structure.test.mjs src/components/experiences/*.structure.test.mjs
```

Expected: only the new assertions fail.

- [ ] **Step 3: Apply material hooks**

Keep form submission, editing, delete confirmation, synthesis and analysis logic
unchanged. Apply regular sections to hero/meta/timeline and content plates to
inputs, drafts and long results.

- [ ] **Step 4: Style responsive details**

Preserve existing mobile stacking, safe areas and 44px targets. Ensure overlay
surfaces do not stack multiple backdrop filters.

- [ ] **Step 5: Run related tests**

Run the command from Step 2 and expect PASS.

---

### Task 6: Documentation, full verification, and design QA

**Files:**
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`
- Modify: `design-qa.md`

**Interfaces:**
- Consumes: completed Tasks 1–5
- Produces: verified implementation record and reviewer handoff

- [ ] **Step 1: Update active design and screen documentation**

Record the selected option, authenticated-route scope, page-level material
mapping, responsive behavior and accessibility fallbacks. Record only completed
work.

- [ ] **Step 2: Run all structure and behavior tests**

Run:

```bash
node --test src/**/*.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 3: Run static verification sequentially**

Stop the dev server before build, then run:

```bash
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Expected: all commands PASS. Restart port 3000 afterward.

- [ ] **Step 4: Capture same-viewport visual comparisons**

Capture the selected reference and implementation at 1440×1024. Capture
`/dashboard`, `/experiences`, `/recommend`, details and mobile 390×844. Compare
typography, spacing, surfaces, curves, borders, shadows and copy.

- [ ] **Step 5: Run Product Design QA**

Update `design-qa.md` with reference and implementation paths, responsive and
interaction evidence, findings by P0–P3 and `final result`. Fix all P0/P1/P2 and
repeat comparison until `final result: passed`.

- [ ] **Step 6: Report without committing**

Summarize modified files, user-flow impact, no schema/API/data impact, tests,
security/privacy check, remaining P3 items, diff summary and recommended English
commit message. Do not commit, push or create a PR without a new explicit user
approval.
