# Analysis Gap MorphSurface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the always-expanded analysis gap answer cards with one-at-a-time, question-level MorphSurface interactions while preserving every existing answer persistence contract.

**Architecture:** Add a controlled, reusable `MorphSurface` shell based on Cult UI's MIT-licensed `motion/react` implementation. `AnalysisGapAnswerList` remains the owner of repository, draft, error, and save state; it only adds the currently open gap id and supplies question-specific trigger/content to the shell.

**Tech Stack:** Next.js 15, React 19, TypeScript, `motion/react`, `lucide-react`, existing global CSS, Node structure tests, in-app browser verification.

## Global Constraints

- Only one question surface may be open at a time.
- Preserve the existing `evidenceGaps`, `experience_followups`, analysis gap answer schema, repository calls, and API contracts.
- Use the official MorphSurface interaction model: spring morph, shared `layoutId` indicator, click outside, focus on open, Escape close, and Command/Ctrl+Enter submit.
- Use fluid `width: 100%`; do not introduce a fixed mobile width.
- Keep trigger targets at least 44px high with `focus-visible`, `aria-expanded`, and `aria-controls`.
- Keep input when save fails; close only after a successful save.
- Respect `prefers-reduced-motion`.
- Do not modify unrelated dirty-worktree files.
- Do not commit, push, or open a PR without explicit user approval.

---

### Task 1: Reusable MorphSurface shell

**Files:**
- Create: `web/src/components/ui/MorphSurface.tsx`
- Create: `web/src/components/ui/MorphSurface.structure.test.mjs`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: `motion`, `AnimatePresence`, `useReducedMotion` from `motion/react`; `cn` from `@/lib/utils`.
- Produces:

```ts
export type MorphSurfaceProps = {
  surfaceId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLabel: string;
  triggerMeta?: string;
  statusLabel: string;
  isComplete?: boolean;
  triggerIcon?: React.ReactNode;
  focusTargetId?: string;
  children: React.ReactNode;
  className?: string;
};

export function MorphSurface(props: MorphSurfaceProps): React.ReactElement;
```

- The component controls presentation and focus only. It does not submit forms or access CampusLog repositories.

- [x] **Step 1: Write the failing structure test**

Create `web/src/components/ui/MorphSurface.structure.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./MorphSurface.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("MorphSurface는 controlled spring morph와 공유 indicator를 사용한다", () => {
  assert.match(source, /isOpen: boolean/);
  assert.match(source, /onOpenChange: \(open: boolean\) => void/);
  assert.match(source, /layoutId=/);
  assert.match(source, /type: "spring"/);
  assert.match(source, /AnimatePresence/);
});

test("MorphSurface는 닫기·포커스·접근성 계약을 제공한다", () => {
  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.match(source, /aria-controls=\{contentId\}/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /document\.getElementById\(focusTargetId\)\?\.focus/);
  assert.match(source, /pointerdown/);
  assert.match(source, /useReducedMotion/);
});

test("MorphSurface는 모바일에서 고정 너비 없이 가용 너비를 채운다", () => {
  const surfaceStyles = styles.match(
    /\.morph-surface \{([\s\S]*?)\}/,
  )?.[1];

  assert.ok(surfaceStyles);
  assert.match(surfaceStyles, /width:\s*100%/);
  assert.match(styles, /\.morph-surface-trigger[\s\S]*min-height:\s*44px/);
});
```

- [x] **Step 2: Run the test and verify RED**

Run:

```bash
cd web
node --test src/components/ui/MorphSurface.structure.test.mjs
```

Expected: FAIL because `MorphSurface.tsx` and its CSS do not exist.

- [x] **Step 3: Implement the minimal controlled shell**

Create `web/src/components/ui/MorphSurface.tsx` with these exact behaviors:

```tsx
"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type MorphSurfaceProps = {
  surfaceId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLabel: string;
  triggerMeta?: string;
  statusLabel: string;
  isComplete?: boolean;
  triggerIcon?: ReactNode;
  focusTargetId?: string;
  children: ReactNode;
  className?: string;
};

export function MorphSurface({
  surfaceId,
  isOpen,
  onOpenChange,
  triggerLabel,
  triggerMeta,
  statusLabel,
  isComplete = false,
  triggerIcon,
  focusTargetId,
  children,
  className,
}: MorphSurfaceProps): ReactElement {
  const generatedId = useId();
  const contentId = `${surfaceId || generatedId}-content`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    const frame = window.requestAnimationFrame(() => {
      if (focusTargetId) {
        document.getElementById(focusTargetId)?.focus();
      }
    });

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [focusTargetId, isOpen, onOpenChange]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      onOpenChange(false);
      triggerRef.current?.focus();
    }
  }

  const spring = shouldReduceMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 550, damping: 45, mass: 0.7 };

  return (
    <motion.div
      ref={rootRef}
      layout={!shouldReduceMotion}
      className={cn("morph-surface", className)}
      data-open={isOpen ? "true" : "false"}
      onKeyDown={handleKeyDown}
      transition={spring}
    >
      <button
        ref={triggerRef}
        type="button"
        className="morph-surface-trigger"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => onOpenChange(!isOpen)}
      >
        <motion.span
          className="morph-surface-indicator"
          data-complete={isComplete ? "true" : "false"}
          layoutId={`morph-surface-indicator-${surfaceId}`}
          transition={spring}
        >
          {triggerIcon}
        </motion.span>
        <span className="morph-surface-trigger-copy">
          {triggerMeta ? <small>{triggerMeta}</small> : null}
          <strong title={triggerLabel}>{triggerLabel}</strong>
        </span>
        <span className="morph-surface-status">{statusLabel}</span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={contentId}
            className="morph-surface-content"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.18 }}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
```

Add scoped CSS to `web/src/app/globals.css`:

```css
.morph-surface {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: #fffefa;
  box-shadow:
    0 1px 1px rgba(0, 0, 0, 0.05),
    inset 0 1px 1px rgba(255, 252, 240, 0.5);
}

.morph-surface[data-open="true"] {
  border-radius: 14px;
}

.morph-surface-trigger {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  min-height: 64px;
  gap: 12px;
  border: 0;
  background: transparent;
  color: var(--color-text);
  padding: 10px 14px;
  text-align: left;
}

.morph-surface-trigger:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: -3px;
}

.morph-surface-indicator {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-soft);
}

.morph-surface-trigger-copy {
  min-width: 0;
}

.morph-surface-trigger-copy small,
.morph-surface-trigger-copy strong {
  display: block;
}

.morph-surface-trigger-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.morph-surface-status {
  color: var(--color-text-soft);
  font-size: 0.76rem;
  font-weight: 760;
  white-space: nowrap;
}

.morph-surface-content {
  min-width: 0;
  border-top: 1px solid var(--color-border);
  padding: 4px 16px 16px;
}

@media (prefers-reduced-motion: reduce) {
  .morph-surface,
  .morph-surface * {
    scroll-behavior: auto;
  }
}
```

- [x] **Step 4: Run the test and verify GREEN**

Run:

```bash
cd web
node --test src/components/ui/MorphSurface.structure.test.mjs
```

Expected: 3 tests pass.

- [x] **Step 5: Review the diff without committing**

Run:

```bash
git diff -- web/src/components/ui/MorphSurface.tsx web/src/components/ui/MorphSurface.structure.test.mjs web/src/app/globals.css
```

Expected: only the reusable shell, its structure test, and scoped styles appear. Do not commit without explicit user approval.

### Task 2: Convert analysis gap questions to controlled surfaces

**Files:**
- Modify: `web/src/components/ai/AnalysisGapAnswerList.tsx`
- Create: `web/src/components/ai/AnalysisGapAnswerList.structure.test.mjs`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: `MorphSurface` and the existing `AnalysisGapAnswerItem`, repository, draft, error, and save state.
- Produces: question-level surfaces controlled by `openGapId: string | null`.
- `handleSaveAnswer(item)` changes from `Promise<void>` to `Promise<boolean>` so the UI closes only after confirmed persistence.

- [x] **Step 1: Write the failing integration structure test**

Create `web/src/components/ai/AnalysisGapAnswerList.structure.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./AnalysisGapAnswerList.tsx", import.meta.url),
  "utf8",
);

test("부족한 정보는 질문별 controlled MorphSurface를 사용한다", () => {
  assert.match(source, /import \{ MorphSurface \}/);
  assert.match(source, /openGapId/);
  assert.match(source, /<MorphSurface/);
  assert.match(source, /isOpen=\{openGapId === item\.id\}/);
  assert.match(source, /setOpenGapId\(open \? item\.id : null\)/);
});

test("저장 성공 때만 완료 상태를 보이고 surface를 닫는다", () => {
  assert.match(source, /async function handleSaveAnswer[\s\S]*Promise<boolean>/);
  assert.match(source, /return false/);
  assert.match(source, /return true/);
  assert.match(source, /const didSave = await handleSaveAnswer\(item\)/);
  assert.match(source, /if \(didSave\)/);
  assert.match(source, /setOpenGapId\(\(current\)/);
});

test("textarea는 포커스와 키보드 제출 계약을 유지한다", () => {
  assert.match(source, /focusTargetId=/);
  assert.match(source, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(source, /handleSaveAnswer\(item\)/);
  assert.match(source, /role="alert"/);
});
```

- [x] **Step 2: Run the test and verify RED**

Run:

```bash
cd web
node --test src/components/ai/AnalysisGapAnswerList.structure.test.mjs
```

Expected: FAIL because `AnalysisGapAnswerList` still renders always-expanded articles.

- [x] **Step 3: Add controlled surface state and success-aware save**

In `AnalysisGapAnswerList.tsx`:

```tsx
import { AlertTriangle, CheckCircle2, HelpCircle, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { MorphSurface } from "@/components/ui/MorphSurface";
```

Add the controlled open state:

```tsx
const [openGapId, setOpenGapId] = useState<string | null>(null);
```

Change the save signature and every unsuccessful branch:

```tsx
async function handleSaveAnswer(
  item: AnalysisGapAnswerItem,
): Promise<boolean> {
  const answer = draftAnswers[item.id]?.trim() ?? "";

  if (!answer) {
    setErrorByGapId((current) => ({
      ...current,
      [item.id]: "보완 답변을 입력한 뒤 저장해 주세요.",
    }));
    return false;
  }

  setSavingGapId(item.id);
  setErrorByGapId((current) => ({ ...current, [item.id]: "" }));

  try {
    const repository = getCampusLogRepository();
    let followupId = item.followupId;
    let questionId = item.questionId;

    if (!followupId) {
      const preparedFollowup = await repository.experienceFollowups.save(
        createAnalysisGapFollowup(experience.id, item),
      );

      if (!preparedFollowup) {
        setErrorByGapId((current) => ({
          ...current,
          [item.id]: "보완 답변을 저장할 준비를 하지 못했습니다.",
        }));
        return false;
      }

      followupId = preparedFollowup.id;
      questionId = preparedFollowup.questions[0]?.id ?? item.id;
      setFollowups((current) => [preparedFollowup, ...current]);
    }

    const savedFollowup =
      await repository.experienceFollowups.answerQuestion(
        followupId,
        questionId,
        answer,
      );

    if (!savedFollowup) {
      setErrorByGapId((current) => ({
        ...current,
        [item.id]: "보완 답변을 저장하지 못했습니다.",
      }));
      return false;
    }

    await repository.analyses.saveGapAnswer(experience.id, item.id, answer);

    setFollowups((current) => {
      const hasExisting = current.some(
        (followup) => followup.id === savedFollowup.id,
      );

      return hasExisting
        ? current.map((followup) =>
            followup.id === savedFollowup.id ? savedFollowup : followup,
          )
        : [savedFollowup, ...current];
    });
    setDraftAnswers((current) => ({
      ...current,
      [item.id]: answer,
    }));
    setSavedGapIds((current) => new Set(current).add(item.id));
    return true;
  } catch (error) {
    console.error("CampusLog analysis gap answer save failed", error);
    setErrorByGapId((current) => ({
      ...current,
      [item.id]: getErrorMessage(
        error,
        "보완 답변 저장 중 문제가 발생했습니다.",
      ),
    }));
    return false;
  } finally {
    setSavingGapId(null);
  }
}
```

Use this exact close-after-success helper inside each item render:

```tsx
async function saveAndClose() {
  const didSave = await handleSaveAnswer(item);

  if (didSave) {
    window.setTimeout(() => {
      setOpenGapId((current) => (current === item.id ? null : current));
    }, 650);
  }
}
```

- [x] **Step 4: Replace each always-expanded article with MorphSurface**

The item mapping must follow this structure:

```tsx
<MorphSurface
  key={item.id}
  surfaceId={`analysis-gap-${item.id}`}
  isOpen={openGapId === item.id}
  onOpenChange={(open) => setOpenGapId(open ? item.id : null)}
  triggerLabel={item.question}
  triggerMeta={`${getCategoryLabel(item.category)} · ${item.title}`}
  statusLabel={savedAnswer ? "답변 완료" : "답변 필요"}
  isComplete={Boolean(savedAnswer)}
  triggerIcon={
    savedAnswer ? (
      <CheckCircle2 aria-hidden="true" />
    ) : (
      <HelpCircle aria-hidden="true" />
    )
  }
  focusTargetId={`gap-answer-${item.id}`}
>
  <div className="analysis-gap-morph-heading">
    <p className="analysis-gap-question">{item.question}</p>
    <p className="analysis-gap-reason">{item.reason}</p>
  </div>

  <label className="sr-only" htmlFor={`gap-answer-${item.id}`}>
    {item.title} 보완 답변
  </label>
  <textarea
    id={`gap-answer-${item.id}`}
    className="analysis-gap-answer-input"
    value={draftAnswer}
    rows={4}
    maxLength={1600}
    placeholder="실제로 기억하거나 기록에서 확인할 수 있는 내용만 적어주세요."
    onKeyDown={(event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        void saveAndClose();
      }
    }}
    onChange={(event) => {
      setDraftAnswers((current) => ({
        ...current,
        [item.id]: event.target.value,
      }));
      setSavedGapIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      setErrorByGapId((current) => ({
        ...current,
        [item.id]: "",
      }));
    }}
  />

  <div className="analysis-gap-answer-actions">
    <span>
      {isSaving
        ? "저장 중"
        : error
          ? "저장 실패"
          : isEditing && savedAnswer
            ? "기존 답변 수정 중"
            : isEditing && hasDraft
              ? "답변 작성 중"
              : savedAnswer
                ? wasSavedNow
                  ? "저장 완료"
                  : `마지막 저장 ${formatDateTime(item.updatedAt ?? item.answeredAt ?? "")}`
                : "답변 없음"}
    </span>
    <button
      className="button button-secondary"
      type="button"
      onClick={() => void saveAndClose()}
      disabled={isSaving || !hasDraft || (!isEditing && Boolean(savedAnswer))}
    >
      <Save className="button-icon" aria-hidden="true" />
      {isSaving ? "저장 중..." : savedAnswer ? "수정 저장" : "답변 저장"}
    </button>
  </div>

  {error ? (
    <p className="form-error" role="alert">
      {error}
    </p>
  ) : null}
</MorphSurface>
```

- [x] **Step 5: Remove obsolete card styles and add content styles**

In `globals.css`, remove selectors used only by the deleted
`.analysis-gap-answer-card` and `.analysis-gap-answer-card-header` markup.
Keep the existing textarea and action styles. Add:

```css
.analysis-gap-morph-heading {
  display: grid;
  gap: 6px;
  padding-top: 12px;
}

.analysis-gap-morph-heading .analysis-gap-question,
.analysis-gap-morph-heading .analysis-gap-reason {
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.analysis-gap-answer-list .morph-surface + .morph-surface {
  margin-top: 0;
}
```

- [x] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
cd web
node --test \
  src/components/ui/MorphSurface.structure.test.mjs \
  src/components/ai/AnalysisGapAnswerList.structure.test.mjs
```

Expected: 6 tests pass.

### Task 3: Responsive, keyboard, and browser verification

**Files:**
- Modify if a verified defect is found: `web/src/components/ui/MorphSurface.tsx`
- Modify if a verified defect is found: `web/src/components/ai/AnalysisGapAnswerList.tsx`
- Modify if a verified defect is found: `web/src/app/globals.css`

**Interfaces:**
- No new interfaces.
- Verifies the approved interaction against the real `/experiences` split analysis and `/experiences/[id]/analysis` route.

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

Expected: all tests pass; lint, typecheck, and diff check exit 0.

- [ ] **Step 2: Verify desktop behavior in the browser**

At a desktop viewport:

1. Open a completed experience with an analysis containing at least two gaps.
2. Confirm all questions start collapsed.
3. Open the first question and confirm its textarea receives focus.
4. Open the second question and confirm the first closes.
5. Press Escape and confirm the second closes and focus returns to its trigger.
6. Reopen it, enter a safe non-sensitive test answer, and save.
7. Confirm success feedback appears and only then the surface closes.
8. Reopen and confirm the saved answer is present.

Expected: no clipped surface, blank exit rectangle, duplicate open question, or unrelated save alert.

Verified steps 1–5 and the empty-answer failure path. Steps 6–8 were intentionally
not executed because they would persist a test answer to the user's account.

- [ ] **Step 3: Verify mobile and reduced motion**

At approximately `390x844`:

1. Confirm the trigger uses the full available width without horizontal scroll.
2. Confirm a long Korean question truncates only when collapsed and shows fully when open.
3. Confirm the save button remains reachable and no fixed width overflows.
4. Emulate reduced motion and confirm the content changes without a large spring morph.

Expected: `document.documentElement.scrollWidth === window.innerWidth` and all controls remain keyboard/touch reachable.

Verified mobile steps 1–3 at `390x844`. Reduced-motion behavior is covered by the
component implementation and structure test but was not browser-emulated.

### Task 4: Active documentation and work log

**Files:**
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TASK_LOG.md`
- Modify only if a decision/risk changed: `docs/ISSUE_LOG.md`

**Interfaces:**
- Documents the UI-only change; schema/API/data remain unchanged.

- [x] **Step 1: Record only verified behavior**

Add one current rule to `DESIGN.md` and `SCREEN_SPEC.md`:

```md
AI 분석의 부족한 정보는 질문별 MorphSurface로 표시한다. 질문은 기본 한 줄로
접혀 있고 한 번에 하나만 열린다. 열림은 제자리 spring morph, 자동 포커스,
Escape·바깥 클릭 닫기, Command/Ctrl+Enter 저장을 지원하며 reduced motion에서는
큰 크기 전환을 생략한다. 저장 실패 시 입력과 열린 상태를 유지하고 성공 때만
완료 상태를 표시한 뒤 닫는다.
```

Update `TODO.md` and `WORK_STATUS.md` only with the behavior actually verified.
Append a dated `TASK_LOG.md` entry with exact files and commands. Update
`ISSUE_LOG.md` only when implementation reveals a new risk or changes an existing
decision.

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

Expected: all tests pass and all commands exit 0.

- [x] **Step 3: Inspect the final scoped diff**

Run:

```bash
git diff --stat
git status --short
```

Expected: the report clearly separates this task's files from pre-existing user-owned changes. Do not stage or commit without explicit user approval.
