# AI Animated Gradient Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 요청을 실제로 실행하는 버튼을 기존 상세 액션과 같은 크기·모서리·여백으로 통일하고 Magic UI Animated Gradient Text 효과를 테두리·텍스트·아이콘에 적용한다.

**Architecture:** `AnimatedGradientActionButton`이 native button 계약, 기존 의미 아이콘, animated gradient text, Chevron을 한 컴포넌트에서 제공한다. 추천 입력·완료 경험 상세·분석 화면·스플릿 패널은 기존 요청 handler와 상태를 유지한 채 버튼 표현만 교체한다.

**Tech Stack:** Next.js 15, React 19, TypeScript, Lucide React, CSS animations, Node test runner

## Global Constraints

- 적용 문구는 `AI 분석`, `AI 분석 요청`, `다시 분석하기`와 각 로딩 문구로 제한한다.
- `AI 분석 결과`, `AI 기반 활동 추천`, `새 추천 받기` 조회·이동 액션은 변경하지 않는다.
- 세로 구분선은 사용하지 않는다.
- 외곽은 `AI 분석 결과`, `수정`, `삭제`와 같은 44px 높이·12px 모서리·여백·흰색 배경을 사용하고, 1px 테두리에 gradient를 적용하되 pill 형태와 inset shadow는 사용하지 않는다.
- 최초 분석에는 기존 `Sparkles`, 다시 분석에는 기존 `RefreshCcw` 아이콘 외곽선을 유지하고 icon stroke에도 주황색·보라색 gradient를 적용한다.
- 새로운 dependency를 설치하지 않는다.
- 기존 submit, click handler, `disabled`, `aria-busy`, API, schema, repository 계약을 변경하지 않는다.
- `prefers-reduced-motion`에서는 gradient와 Chevron 이동을 멈춘다.
- 현재 작업 트리의 관련 없는 사용자 변경을 보존한다.
- commit, push, PR은 별도 사용자 승인 전 실행하지 않는다.

---

### Task 1: Animated Gradient 공통 버튼

**Files:**
- Create: `web/src/components/ui/AnimatedGradientActionButton.tsx`
- Create: `web/src/components/ui/AnimatedGradientActionButton.structure.test.mjs`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: native `button` attributes, `icon: ReactNode`, text children
- Produces: `AnimatedGradientActionButton`, a ref-forwarding button that preserves `disabled`, `aria-busy`, `type`, `onClick`, `className`, and the supplied Lucide icon outline while applying an animated SVG stroke gradient

- [x] **Step 1: Write the failing component structure test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentSource = await readFile(
  new URL("./AnimatedGradientActionButton.tsx", import.meta.url),
  "utf8",
).catch(() => "");
const cssSource = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("AI 실행 버튼은 기존 아이콘, gradient text, Chevron을 제공한다", () => {
  assert.match(componentSource, /forwardRef<HTMLButtonElement/);
  assert.match(componentSource, /animated-gradient-action-border/);
  assert.match(componentSource, /animated-gradient-action-text/);
  assert.match(componentSource, /<ChevronRight/);
  assert.doesNotMatch(componentSource, /<hr/);
  assert.match(cssSource, /@keyframes ai-action-gradient-shift/);
  assert.match(cssSource, /maskComposite:|mask-composite:/);
  assert.match(cssSource, /prefers-reduced-motion: reduce/);
});
```

- [x] **Step 2: Run the test and verify RED**

Run:

```bash
cd web
node --test src/components/ui/AnimatedGradientActionButton.structure.test.mjs
```

Expected: FAIL because `AnimatedGradientActionButton.tsx` does not exist and the new class names are absent.

- [x] **Step 3: Implement the common component**

```tsx
"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type AnimatedGradientActionButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: ReactNode;
  };

export const AnimatedGradientActionButton = forwardRef<
  HTMLButtonElement,
  AnimatedGradientActionButtonProps
>(function AnimatedGradientActionButton(
  { children, className, icon, type = "button", ...buttonProps },
  forwardedRef,
) {
  return (
    <button
      {...buttonProps}
      ref={forwardedRef}
      type={type}
      className={cn("animated-gradient-action-button", className)}
    >
      <span
        className="animated-gradient-action-border"
        aria-hidden="true"
      />
      <span className="animated-gradient-action-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="animated-gradient-action-text">{children}</span>
      <ChevronRight
        className="animated-gradient-action-chevron"
        stroke={`url(#${iconGradientId})`}
        aria-hidden="true"
      />
    </button>
  );
});

AnimatedGradientActionButton.displayName = "AnimatedGradientActionButton";
```

- [x] **Step 4: Add reference-matched styles**

Add a focused block to `web/src/app/globals.css`:

```css
.animated-gradient-action-button {
  position: relative;
  display: inline-flex;
  min-width: 0;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #fff;
  box-shadow: none;
  padding: 10px 14px;
  color: #3f3f3c;
  cursor: pointer;
  isolation: isolate;
  transition:
    background-color 160ms ease,
    opacity 180ms ease;
}

.animated-gradient-action-border {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffaa40, #9c40ff, #ffaa40);
  background-size: 300% 100%;
  padding: 1px;
  pointer-events: none;
  animation: ai-action-gradient-shift 6s ease infinite;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: subtract;
}

.animated-gradient-action-text {
  position: relative;
  z-index: 1;
  background: linear-gradient(90deg, #ffaa40, #9c40ff, #ffaa40);
  background-size: 300% 100%;
  background-clip: text;
  color: transparent;
  font-size: 0.84rem;
  font-weight: 650;
  white-space: nowrap;
  -webkit-background-clip: text;
  animation: ai-action-gradient-shift 6s ease infinite;
}

.animated-gradient-action-icon,
.animated-gradient-action-chevron {
  position: relative;
  z-index: 1;
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  color: #737373;
}

.animated-gradient-action-chevron {
  transition: transform 300ms ease-in-out;
}

.animated-gradient-action-button:hover:not(:disabled) {
  background: #f4f4f1;
}

.animated-gradient-action-button:hover:not(:disabled)
  .animated-gradient-action-chevron {
  transform: translateX(2px);
}

.animated-gradient-action-button:focus-visible {
  outline: 3px solid rgba(29, 29, 31, 0.24);
  outline-offset: 3px;
}

.animated-gradient-action-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

@keyframes ai-action-gradient-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .animated-gradient-action-border,
  .animated-gradient-action-text {
    animation: none;
    background-position: 50% 50%;
  }

  .animated-gradient-action-chevron {
    transition: none;
  }

  .animated-gradient-action-button:hover:not(:disabled)
    .animated-gradient-action-chevron {
    transform: none;
  }
}
```

- [x] **Step 5: Run the component test and verify GREEN**

Run:

```bash
cd web
node --test src/components/ui/AnimatedGradientActionButton.structure.test.mjs
```

Expected: PASS.

### Task 2: Connect every AI execution surface

**Files:**
- Create: `web/src/components/ui/aiExecutionActions.structure.test.mjs`
- Modify: `web/src/components/ai/RecommendationForm.tsx`
- Modify: `web/src/components/experiences/DashboardExperienceDetail.tsx`
- Modify: `web/src/components/experiences/ExperienceAnalysisClient.tsx`
- Modify: `web/src/components/experiences/DashboardAnalysisSplitPanel.tsx`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: `AnimatedGradientActionButton` from Task 1
- Produces: consistent AI request buttons while preserving each screen's current handlers and state

- [x] **Step 1: Write a failing consumer structure test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sources = await Promise.all(
  [
    "../ai/RecommendationForm.tsx",
    "../experiences/DashboardExperienceDetail.tsx",
    "../experiences/ExperienceAnalysisClient.tsx",
    "../experiences/DashboardAnalysisSplitPanel.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
);

test("AI 실행 화면은 AnimatedGradientActionButton을 사용한다", () => {
  for (const source of sources) {
    assert.match(source, /AnimatedGradientActionButton/);
  }

  assert.match(sources[0], /icon=\{<Sparkles/);
  assert.match(sources[1], /icon=\{<Sparkles/);
  assert.match(sources[2], /icon=\{<RefreshCcw/);
  assert.match(sources[3], /icon=\{<RefreshCcw/);
});

test("AI 결과 조회와 추천 이동 링크는 기존 버튼을 유지한다", () => {
  assert.match(sources[1], />\\s*AI 분석 결과\\s*</);
  assert.match(sources[2], />\\s*AI 기반 활동 추천\\s*</);
});
```

- [x] **Step 2: Run the consumer test and verify RED**

Run:

```bash
cd web
node --test src/components/ui/aiExecutionActions.structure.test.mjs
```

Expected: FAIL because the four screens still use `BorderBeamButton` or `RippleButton`.

- [x] **Step 3: Replace the recommendation submit action**

In `RecommendationForm.tsx`, replace `BorderBeamButton` with:

```tsx
<AnimatedGradientActionButton
  className="recommendation-analysis-request"
  type="submit"
  disabled={isLoading}
  aria-busy={isLoading}
  icon={<Sparkles />}
>
  {isLoading ? "AI 분석 중..." : "AI 분석"}
</AnimatedGradientActionButton>
```

Keep form validation, prompt state, and submit handler unchanged.

- [x] **Step 4: Replace the experience detail request action**

In `DashboardExperienceDetail.tsx`, replace only the `canRequestAnalysis` branch:

```tsx
<AnimatedGradientActionButton
  className="dashboard-detail-action dashboard-analysis-request"
  type="button"
  onClick={onAnalyze}
  disabled={isAnalyzing}
  aria-busy={isAnalyzing}
  icon={<Sparkles />}
>
  {isAnalyzing ? "분석 중..." : analyzeLabel}
</AnimatedGradientActionButton>
```

Leave both `AI 분석 결과` branches unchanged.

- [x] **Step 5: Replace direct analysis-page execution actions**

In `ExperienceAnalysisClient.tsx`:

- use `RefreshCcw` for `다시 분석하기`;
- use `Sparkles` for `AI 분석 요청`;
- preserve `handleAnalyze`, `isAnalyzing`, and all navigation links.

```tsx
<AnimatedGradientActionButton
  type="button"
  onClick={handleAnalyze}
  disabled={isAnalyzing}
  aria-busy={isAnalyzing}
  icon={analysis ? <RefreshCcw /> : <Sparkles />}
>
  {isAnalyzing
    ? "분석 중..."
    : analysis
      ? "다시 분석하기"
      : "AI 분석 요청"}
</AnimatedGradientActionButton>
```

- [x] **Step 6: Replace split-panel reanalysis action**

In `DashboardAnalysisSplitPanel.tsx`:

```tsx
<AnimatedGradientActionButton
  type="button"
  onClick={onReanalyze}
  disabled={isAnalyzing}
  aria-busy={isAnalyzing}
  icon={<RefreshCcw />}
>
  {isAnalyzing ? "분석 중..." : "다시 분석하기"}
</AnimatedGradientActionButton>
```

- [x] **Step 7: Add placement-only CSS**

Keep the standard action frame and gradient content rules in the common component block. Add only layout compatibility:

```css
.panel-actions .animated-gradient-action-button {
  width: auto;
}

.dashboard-detail-actions .animated-gradient-action-button {
  flex: 0 1 auto;
}

.dashboard-analysis-split-footer .animated-gradient-action-button {
  margin-left: auto;
}
```

For the 560px detail container query, keep all four actions on one line and set the AI button text to `white-space: nowrap`.

- [x] **Step 8: Run focused tests and verify GREEN**

Run:

```bash
cd web
node --test \
  src/components/ui/AnimatedGradientActionButton.structure.test.mjs \
  src/components/ui/aiExecutionActions.structure.test.mjs \
  src/components/experiences/DashboardExperienceDetail.structure.test.mjs
```

Expected: all tests PASS.

### Task 3: Documentation and full verification

**Files:**
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`

**Interfaces:**
- Consumes: completed UI implementation from Tasks 1–2
- Produces: active documentation matching the actual rendered states

- [x] **Step 1: Update active design and screen contracts**

Document that AI execution buttons:

- use the neutral standard action frame with animated orange-purple text and icon stroke;
- keep existing Sparkles or Refresh icons;
- omit the vertical divider;
- stop motion under reduced motion;
- do not alter result-view and navigation actions.

- [x] **Step 2: Record only completed work**

Add one dated task-log entry and one resolved UI decision/issue entry. Update TODO and WORK_STATUS only after the implementation and verification are complete.

- [x] **Step 3: Run static verification**

Run:

```bash
cd web
npm run lint
npx tsc --noEmit
node --test \
  src/components/ui/AnimatedGradientActionButton.structure.test.mjs \
  src/components/ui/aiExecutionActions.structure.test.mjs \
  src/components/experiences/DashboardExperienceDetail.structure.test.mjs
```

Expected: all commands exit 0.

- [x] **Step 4: Run production verification without the active dev cache**

Stop the development server before `npm run build`, run the build, then restart the development server on port 3000. This avoids mixing production and development `.next` assets.

Run:

```bash
cd web
npm run build
```

Expected: build exits 0 and all routes compile.

- [x] **Step 5: Verify in the browser**

Check:

- `/recommend`: `AI 분석` uses the new common action frame and retains submit/loading behavior.
- `/experiences`: `AI 분석 요청` uses the new common action frame while `AI 분석 결과` remains neutral.
- `/experiences/[id]/analysis`: request and reanalysis use the new common action frame.
- analysis split panel: `다시 분석하기` uses the new common action frame.
- hover changes to the same neutral background as sibling detail actions and moves Chevron only.
- focus ring is visible.
- narrow detail and mobile widths have no horizontal overflow or unwanted wrapping.
- reduced motion stops gradient and Chevron movement.

- [x] **Step 6: Run final diff checks**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; unrelated pre-existing changes remain untouched.
