# Analysis Gap Anchored Morph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 부족 정보 질문을 Cult UI MorphSurface 레퍼런스처럼 아래에서 위로 떠오르게 하되, 쌓인 질문끼리 겹치지 않는 anchored accordion으로 수정합니다.

**Architecture:** `MorphSurface` 루트의 layout spring과 음의 y축 이동을 제거하고, 별도 reveal wrapper가 `height: 0 ↔ auto`를 애니메이션하도록 합니다. 본문은 reveal 안에서 `y: 12 → 0`으로 올라오고, 열림에만 짧은 지연을 적용해 기존 닫힘이 먼저 보이게 합니다.

**Tech Stack:** React 19, TypeScript, Motion 12, CSS, Node test runner

## Global Constraints

- Track B UI 작업이며 API, schema, repository와 저장 계약을 변경하지 않습니다.
- 기존 사용자 소유 변경과 dirty worktree를 보존합니다.
- 새 dependency를 추가하지 않습니다.
- 한 번에 질문 하나만 열기, 바깥 클릭, Escape, focus 복귀, Command/Ctrl+Enter 저장을 유지합니다.
- 사용자가 별도로 승인하기 전 commit, push, PR을 진행하지 않습니다.

---

### Task 1: Anchored Morph 회귀 테스트

**Files:**
- Modify: `web/src/components/ui/MorphSurface.structure.test.mjs`
- Modify: `web/src/components/ai/AnalysisGapAnswerList.structure.test.mjs`

**Interfaces:**
- Consumes: 기존 `MorphSurfaceProps`, `.morph-surface`, `.analysis-gap-answer-list`
- Produces: anchored root, upward content reveal, 16px list gap에 대한 정적 회귀 계약

- [ ] **Step 1: 실패 테스트 작성**

`MorphSurface.structure.test.mjs`에서 루트 `layout`과 `y: -12`가 없어야 하고, `.morph-surface-reveal`, `height: "auto"`, 본문 `y: 12`가 존재해야 함을 검증합니다. `AnalysisGapAnswerList.structure.test.mjs`에서는 목록 gap 16px과 모바일 translate 제거를 검증합니다.

- [ ] **Step 2: 테스트 실패 확인**

Run:

```bash
node --test src/components/ui/MorphSurface.structure.test.mjs src/components/ai/AnalysisGapAnswerList.structure.test.mjs
```

Expected: 기존 `layout`, `y: -12`, `y: -10`, `gap: 12px` 때문에 FAIL

### Task 2: MorphSurface reveal 구현

**Files:**
- Modify: `web/src/components/ui/MorphSurface.tsx`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: `isOpen`, `shouldReduceMotion`, 기존 children
- Produces: `.morph-surface-reveal` 높이 전환과 아래에서 위로 올라오는 `.morph-surface-content`

- [ ] **Step 1: 최소 구현**

루트의 `layout`과 음의 y축 animate를 제거합니다. `AnimatePresence` 안에 overflow-hidden reveal wrapper를 추가해 열림은 `height: 0 → auto`, 닫힘은 `height: auto → 0`으로 전환합니다. 내부 본문은 `y: 12 → 0`, 닫힘은 `y: 6`을 사용하고 열림에만 60ms 지연을 둡니다.

- [ ] **Step 2: 간격과 반응형 정리**

질문 목록 gap을 16px로 늘리고 열린 표면에 상대 레이어를 부여합니다. 모바일의 추가 `translate` 규칙을 삭제하고 reveal overflow와 will-change를 정의합니다.

- [ ] **Step 3: 대상 테스트 통과 확인**

Run:

```bash
node --test src/components/ui/MorphSurface.structure.test.mjs src/components/ai/AnalysisGapAnswerList.structure.test.mjs
```

Expected: PASS

### Task 3: 기준 문서와 전체 검증

**Files:**
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`

**Interfaces:**
- Consumes: 승인된 Anchored Morph 디자인
- Produces: 현재 구현과 일치하는 Track B 기록

- [ ] **Step 1: 활성 문서 갱신**

기존의 `표면이 12px 위로 부상`, `본문이 음의 y축에서 나타남` 문구를 anchored root, 16px 간격, `y: 12 → 0` reveal, 질문 전환 지연 규칙으로 교체합니다.

- [ ] **Step 2: 정적 검증**

Run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Expected: exit 0

- [ ] **Step 3: 브라우저 검증**

데스크톱에서 두 번째 질문 열기와 질문 간 전환을 캡처하고, 이전 질문과 열린 표면이 겹치지 않는지 확인합니다. 모바일 폭에서도 가로 잘림과 추가 translate가 없는지 확인합니다.

- [ ] **Step 4: diff 범위 확인**

Run:

```bash
git diff --check
git status --short
```

Expected: whitespace 오류 없음, 기존 사용자 변경 보존

## Self-Review

- Spec coverage: 겹침 원인, 모션 방향, 전환 순서, 모바일, reduced motion, 접근성, 데이터 비영향을 각 Task가 포함합니다.
- Placeholder scan: 구현을 미루는 placeholder가 없습니다.
- Type consistency: 기존 `MorphSurfaceProps`와 `AnalysisGapAnswerList` 상태 계약을 변경하지 않습니다.
