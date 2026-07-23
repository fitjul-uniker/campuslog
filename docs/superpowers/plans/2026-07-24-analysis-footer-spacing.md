# AI Analysis Footer Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 독립 AI 분석 결과 카드와 `다시 분석하기` 사이에 자연스러운 24px 여백을 적용한다.

**Architecture:** 기존 `analysis-page-footer-actions` 클래스에 상단 여백을 추가하되, 분석 결과가 없는 상세 패널 내부 액션에는 별도 modifier를 사용해 중복 여백을 막는다. API와 분석 상태 로직은 변경하지 않는다.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS, Node test runner

## Global Constraints

- 결과가 있는 독립 분석 화면의 하단 액션에만 24px 상단 여백을 적용한다.
- 기존 왼쪽 정렬과 버튼 디자인을 유지한다.
- 구분선과 별도 배경은 추가하지 않는다.
- API·schema·repository·저장 데이터는 변경하지 않는다.
- commit은 별도 사용자 승인 전 실행하지 않는다.

---

### Task 1: 분석 결과 하단 여백 적용

**Files:**
- Modify: `web/src/components/experiences/ExperienceAnalysisClient.structure.test.mjs`
- Modify: `web/src/components/experiences/ExperienceAnalysisClient.tsx`
- Modify: `web/src/app/globals.css`
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TASK_LOG.md`

**Interfaces:**
- Consumes: 기존 `analysis-page-footer-actions` 하단 액션 클래스
- Produces: 결과 화면 전용 `analysis-page-footer-actions-spaced` modifier

- [x] **Step 1: 실패 구조 테스트 작성**

결과가 있는 분기의 하단 액션에 `analysis-page-footer-actions-spaced`가 있고 CSS가 `margin-top: 24px`을 제공하는지 검사한다.

- [x] **Step 2: RED 확인**

Run: `cd web && node --test src/components/experiences/ExperienceAnalysisClient.structure.test.mjs`

Expected: modifier와 24px 규칙이 없어 FAIL.

- [x] **Step 3: 최소 구현**

분석 결과 분기의 하단 액션에 modifier를 추가하고 CSS에서 24px 상단 여백을 적용한다. 미분석 상세 패널 내부 액션에는 modifier를 추가하지 않는다.

- [x] **Step 4: GREEN과 회귀 검증**

Run: `cd web && npm run lint && npx tsc --noEmit && node --test src/components/experiences/ExperienceAnalysisClient.structure.test.mjs src/components/ui/aiExecutionActions.structure.test.mjs && git diff --check`

Expected: lint, typecheck, 테스트와 diff 검사 통과.

- [x] **Step 5: 브라우저 확인과 문서 기록**

로그인된 독립 분석 화면에서 결과 카드와 버튼 사이 간격이 24px이고 가로 overflow가 없는지 확인한 뒤 활성 디자인·화면 명세와 작업 로그에 기록한다.
