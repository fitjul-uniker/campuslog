# Analysis Gap Meta Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Remove the default `답변 없음` and visible `⌘/Ctrl + Enter` hints from open analysis-gap actions while preserving the character count, meaningful state feedback, and keyboard submission behavior.

**Architecture:** Keep `AnalysisGapAnswerList` as the sole owner of answer and save state. Change only the derived default status and footer rendering, then lock the visual contract in the existing structure test without modifying repository or API calls.

**Tech Stack:** React 19, TypeScript, Node structure tests, existing global CSS.

## Global Constraints

- Always show `{draftAnswer.length}/1600`.
- Do not render `답변 없음` in the expanded footer.
- Do not render the visible `⌘/Ctrl + Enter` hint.
- Preserve `event.metaKey || event.ctrlKey` keyboard submission.
- Preserve save, error, repository, API, schema, and stored data contracts.
- Do not commit, push, or open a PR without explicit user approval.

---

### Task 1: Simplify the expanded question footer

**Files:**
- Modify: `web/src/components/ai/AnalysisGapAnswerList.structure.test.mjs`
- Modify: `web/src/components/ai/AnalysisGapAnswerList.tsx`
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`

**Interfaces:**
- Consumes: existing `statusText`, `draftAnswer`, and `saveAndClose`.
- Produces: a footer that renders meaningful state conditionally, always renders the character count, and preserves the existing save button and keyboard handler.

- [x] **Step 1: Write the failing structure test**

Update the action test to assert:

```js
assert.match(source, /statusText\s*\?\s*<span>\{statusText\}<\/span>\s*:\s*null/);
assert.match(source, /draftAnswer\.length/);
assert.doesNotMatch(source, /<span>⌘\/Ctrl \+ Enter<\/span>/);
assert.doesNotMatch(source, /:\s*"답변 없음"/);
assert.match(source, /event\.metaKey \|\| event\.ctrlKey/);
```

- [x] **Step 2: Run the test and verify RED**

Run:

```bash
cd web
node --test src/components/ai/AnalysisGapAnswerList.structure.test.mjs
```

Expected: the visual-structure test fails because the default status and visible shortcut hint still exist.

- [x] **Step 3: Implement the minimal rendering change**

Change the default status branch to an empty string:

```tsx
: "";
```

Render state conditionally and remove the shortcut hint:

```tsx
<div className="analysis-gap-answer-meta">
  {statusText ? <span>{statusText}</span> : null}
  <span>{draftAnswer.length}/1600</span>
</div>
```

Do not change the textarea keyboard handler.

- [x] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
cd web
node --test \
  src/components/ai/AnalysisGapAnswerList.structure.test.mjs \
  src/components/ui/MorphSurface.structure.test.mjs
npm run lint
npx tsc --noEmit
git diff --check
```

Expected: all commands exit `0`.

- [x] **Step 5: Verify the authenticated UI**

Open an unanswered question on `/experiences/[id]/analysis` and confirm:

- `답변 없음` is absent,
- `⌘/Ctrl + Enter` is absent,
- `0/1600` and `답변 저장` remain,
- no horizontal overflow is introduced.

- [x] **Step 6: Update active documentation**

Record only the verified display change. State explicitly that keyboard submission and all data contracts remain unchanged.
