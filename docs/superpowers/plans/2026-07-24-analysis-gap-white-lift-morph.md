# Analysis Gap White Lift Morph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Restyle the AI analysis gap questions as pure-white command surfaces that lift and expand upward like the selected MorphSurface reference while preserving all answer persistence and keyboard contracts.

**Architecture:** Keep `AnalysisGapAnswerList` as the owner of question, draft, save, and error state. Refine the reusable `MorphSurface` presentation with an upward `y` lift, bottom-centered transform origin, rotating Chevron, and top-origin content reveal; then simplify the analysis-gap markup and CSS to match the selected White Command Surface image without changing repository or API calls.

**Tech Stack:** Next.js 15, React 19, TypeScript, `motion/react`, `lucide-react`, existing global CSS, Node structure tests, in-app browser design QA.

## Global Constraints

- Use the selected third Image Gen result at `/Users/kwban1/.codex/generated_images/019f7a72-a24f-7773-b732-f252d65635b4/call_3FU1oNyB1e7VPdcKMGe17z0J.png` as the visual target.
- Surface color is pure white or near-white only; text and actions use neutral gray, black, or charcoal.
- Do not add gradients, beige fills, glass effects, decorative imagery, or heavy shadows.
- Open surfaces lift `10px` to `14px` upward and use a bottom-centered transform origin.
- Content reveals from a negative vertical offset; it must not enter from below.
- Preserve one-question-open behavior, focus, Escape, outside click, Command/Ctrl+Enter, success-only close, and error input retention.
- Preserve `evidenceGaps`, `experience_followups`, repository, API, schema, and stored data contracts.
- Keep `width: 100%`, `min-width: 0`, 44px minimum targets, focus-visible, and reduced-motion behavior.
- Do not modify unrelated dirty-worktree files.
- Do not stage, commit, push, or open a PR without explicit user approval.

---

### Task 1: Lock the upward white-surface contract with failing tests

**Files:**
- Modify: `web/src/components/ui/MorphSurface.structure.test.mjs`
- Modify: `web/src/components/ai/AnalysisGapAnswerList.structure.test.mjs`

**Interfaces:**
- Consumes: existing `MorphSurfaceProps` and `AnalysisGapAnswerList`.
- Produces: regression checks for lift direction, white command-surface styling, compact metadata, keyboard hint, count, and charcoal save action.

- [x] **Step 1: Add a failing lift-direction test**

Add to `MorphSurface.structure.test.mjs`:

```js
test("MorphSurface는 열린 표면을 위로 부상시키고 본문을 위쪽에서 드러낸다", () => {
  assert.match(source, /y:\s*isOpen\s*\?\s*-12\s*:\s*0/);
  assert.match(source, /transformOrigin:\s*"50% 100%"/);
  assert.match(source, /initial=\{[\s\S]*y:\s*-10/);
  assert.doesNotMatch(source, /initial=\{[\s\S]*y:\s*8/);
  assert.match(source, /morph-surface-chevron/);
});
```

- [x] **Step 2: Add a failing visual-structure test**

Extend `AnalysisGapAnswerList.structure.test.mjs` to read `globals.css` and assert:

```js
test("부족 정보 질문은 흰색 command surface와 간결한 편집 액션을 사용한다", () => {
  assert.match(source, /triggerMeta=\{getCategoryLabel\(item\.category\)\}/);
  assert.match(source, /analysis-gap-answer-meta/);
  assert.match(source, /draftAnswer\.length/);
  assert.match(source, /⌘\/Ctrl \+ Enter/);
  assert.match(source, /analysis-gap-save-button/);
  assert.doesNotMatch(source, /<Save /);

  const surface = styles.match(/\.morph-surface \{([\s\S]*?)\}/)?.[1] ?? "";
  const input = styles.match(
    /\.analysis-gap-answer-input \{([\s\S]*?)\}/,
  )?.[1] ?? "";

  assert.match(surface, /background:\s*#fff/);
  assert.match(surface, /transform-origin:\s*50% 100%/);
  assert.doesNotMatch(input, /repeating-linear-gradient/);
});
```

- [x] **Step 3: Run focused tests and verify RED**

Run:

```bash
cd web
node --test \
  src/components/ui/MorphSurface.structure.test.mjs \
  src/components/ai/AnalysisGapAnswerList.structure.test.mjs
```

Expected: the new tests fail because the current surface uses a top-anchored expansion, positive content offset, beige-adjacent styling, and the old save treatment.

---

### Task 2: Implement the white upward-lifting MorphSurface

**Files:**
- Modify: `web/src/components/ui/MorphSurface.tsx`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: unchanged `MorphSurfaceProps`.
- Produces: the same controlled component with a new upward lift and command-surface presentation.

- [x] **Step 1: Add Chevron and upward motion**

In `MorphSurface.tsx`:

```tsx
import { ChevronDown } from "lucide-react";

const surfaceMotion = shouldReduceMotion
  ? { y: 0, borderRadius: 18 }
  : { y: isOpen ? -12 : 0, borderRadius: isOpen ? 24 : 18 };

<motion.div
  animate={surfaceMotion}
  style={{ transformOrigin: "50% 100%" }}
  ...
>
```

Add after the status:

```tsx
<ChevronDown
  className="morph-surface-chevron"
  data-open={isOpen ? "true" : "false"}
  aria-hidden="true"
/>
```

Change the content transition:

```tsx
initial={shouldReduceMotion ? false : { opacity: 0, y: -10, scale: 0.99 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={
  shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -6, scale: 0.995 }
}
```

- [x] **Step 2: Restyle the command surface**

Update the relevant CSS to:

```css
.morph-surface {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  transform-origin: 50% 100%;
  border: 1px solid rgba(24, 24, 27, 0.1);
  background: #fff;
  box-shadow:
    0 1px 2px rgba(24, 24, 27, 0.04),
    0 8px 24px rgba(24, 24, 27, 0.035);
}

.morph-surface[data-open="true"] {
  border-color: rgba(24, 24, 27, 0.14);
  box-shadow:
    0 2px 4px rgba(24, 24, 27, 0.05),
    0 18px 48px rgba(24, 24, 27, 0.09);
}

.morph-surface-trigger {
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  min-height: 58px;
  padding: 10px 16px;
}

.morph-surface-content {
  border-top: 1px solid rgba(24, 24, 27, 0.08);
  padding: 0 20px 20px;
}
```

Rotate `.morph-surface-chevron[data-open="true"]` by `180deg`, keep the icon
neutral, and remove filled hover backgrounds. At `max-width: 520px`, reduce the
open lift to `-8px` by applying a mobile motion class or CSS custom property.

- [x] **Step 3: Run the MorphSurface test and verify GREEN**

Run:

```bash
cd web
node --test src/components/ui/MorphSurface.structure.test.mjs
```

Expected: all MorphSurface tests pass.

---

### Task 3: Match the selected White Command Surface content hierarchy

**Files:**
- Modify: `web/src/components/ai/AnalysisGapAnswerList.tsx`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: updated `MorphSurface` with unchanged props.
- Produces: compact category-only trigger metadata, plain intro copy, clean input, status/count/shortcut metadata, and charcoal save CTA.

- [x] **Step 1: Simplify intro and trigger metadata**

Remove `PencilLine` and `Save` imports. Render:

```tsx
<div className="analysis-gap-answer-intro">
  <p>
    답변은 원본 경험을 수정하지 않고 분석에 연결된 보완 답변으로 저장됩니다.
    추천에는 바로 반영되며, 요약과 STAR까지 갱신하려면 다시 분석하기를 사용하세요.
  </p>
</div>
```

Pass:

```tsx
triggerMeta={getCategoryLabel(item.category)}
```

- [x] **Step 2: Add modern answer metadata and save action**

Replace the existing action content with:

```tsx
<div className="analysis-gap-answer-actions">
  <div className="analysis-gap-answer-meta">
    <span>{statusText}</span>
    <span>{draftAnswer.length}/1600</span>
    <span>⌘/Ctrl + Enter</span>
  </div>
  <button
    className="button button-primary analysis-gap-save-button"
    type="button"
    onClick={() => void saveAndClose()}
    disabled={isSaving || !hasDraft || (!isEditing && Boolean(savedAnswer))}
  >
    {isSaving ? "저장 중..." : savedAnswer ? "수정 저장" : "답변 저장"}
  </button>
</div>
```

Extract the existing nested status expression into a local `statusText`
constant without changing its conditions.

- [x] **Step 3: Remove old filled and notebook styles**

Update CSS:

```css
.analysis-gap-answer-intro {
  display: block;
  border: 0;
  background: transparent;
  padding: 0 2px 4px;
}

.analysis-gap-answer-input {
  min-height: 132px;
  resize: vertical;
  border: 1px solid rgba(24, 24, 27, 0.14);
  border-radius: 14px;
  background: #fff;
  padding: 14px 16px;
}

.analysis-gap-answer-meta {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px 12px;
}

.analysis-gap-save-button {
  min-width: 112px;
  background: #18181b;
  color: #fff;
}
```

Keep focus-visible contrast and ensure disabled actions remain readable.

- [x] **Step 4: Run both focused tests and verify GREEN**

Run:

```bash
cd web
node --test \
  src/components/ui/MorphSurface.structure.test.mjs \
  src/components/ai/AnalysisGapAnswerList.structure.test.mjs
```

Expected: all focused tests pass.

---

### Task 4: Verify behavior, motion, responsiveness, and visual fidelity

**Files:**
- Modify if a defect is found: `web/src/components/ui/MorphSurface.tsx`
- Modify if a defect is found: `web/src/components/ai/AnalysisGapAnswerList.tsx`
- Modify if a defect is found: `web/src/app/globals.css`
- Create: `design-qa.md`

**Interfaces:**
- No new application interfaces.
- Verifies the selected image and Cult UI reference against the real authenticated split analysis.

- [x] **Step 1: Run static verification**

Run:

```bash
cd web
node --test \
  src/components/ui/MorphSurface.structure.test.mjs \
  src/components/ai/AnalysisGapAnswerList.structure.test.mjs
npm run lint
npx tsc --noEmit
git diff --check
```

Expected: all commands exit `0`.

- [x] **Step 2: Verify desktop interactions**

In the authenticated `/experiences` analysis split:

1. Confirm all closed surfaces are white and use compact command-bar density.
2. Open one question and confirm the whole surface visually lifts upward.
3. Confirm content enters from above rather than falling downward.
4. Switch questions quickly and confirm no blank rectangle or overlap remains.
5. Press Escape and confirm only the question closes and focus returns.
6. Click outside and confirm only the question closes.
7. Trigger empty Command/Ctrl+Enter and confirm the error and input remain open.

- [x] **Step 3: Verify 390px mobile and reduced motion**

Confirm:

- no horizontal overflow,
- category, question, status, and Chevron remain readable,
- open lift is reduced,
- save action remains reachable,
- reduced motion removes lift and spring.

- [x] **Step 4: Run design QA against the selected image**

Read `product-design:design-qa`, compare the selected Image Gen result and the
same open state in the local app, and write `design-qa.md` at the repository
root. Fix all P0/P1/P2 findings and repeat until it contains:

```md
final result: passed
```

---

### Task 5: Update active documentation with verified behavior

**Files:**
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TASK_LOG.md`
- Modify only if the decision changes: `docs/ISSUE_LOG.md`
- Modify: `docs/superpowers/plans/2026-07-24-analysis-gap-white-lift-morph.md`

**Interfaces:**
- Documents UI-only changes; schema, API, repository, and stored data remain unchanged.

- [x] **Step 1: Record only verified visual and interaction changes**

Document the pure-white command surface, upward lift, negative-offset content
reveal, mobile lift reduction, and reduced-motion fallback. Record any
unverified successful persistence smoke test explicitly as unverified.

- [x] **Step 2: Run final fresh verification**

Run:

```bash
cd web
node --test \
  src/components/ui/MorphSurface.structure.test.mjs \
  src/components/ai/AnalysisGapAnswerList.structure.test.mjs
npm run lint
npx tsc --noEmit
git diff --check
```

Expected: all commands exit `0`.

- [x] **Step 3: Inspect scoped and overall dirty-worktree status**

Run:

```bash
git status --short
git diff --stat -- \
  web/src/components/ui/MorphSurface.tsx \
  web/src/components/ai/AnalysisGapAnswerList.tsx \
  web/src/app/globals.css \
  docs
```

Expected: this task is distinguishable from existing user-owned changes. Do not
stage or commit without explicit approval.
