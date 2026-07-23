# AI Processing Strands Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 AI 요청 대기 화면을 Strands와 AI Text Loading 중심의 전체 화면 블러 오버레이로 통일한다.

**Architecture:** OGL 기반 `Strands`와 Motion 기반 `AITextLoading`을 독립 UI 컴포넌트로 추가한다. 기존 공용 `AIProcessingPanel`은 body portal overlay로 재구성하며 기존 title·steps·status·long-wait·cancel props를 새 시각 구조에 매핑한다. 호출부와 API·저장 계약은 변경하지 않는다.

**Tech Stack:** Next.js 15, React 19, TypeScript, OGL, Motion, CSS, Node test runner

## Global Constraints

- Strands 설정은 사용자 제공 첫 번째 프롬프트 값을 사용한다.
- 분석·추천·완료 경험 합성·답변 생성에 공통 적용한다.
- 기존 SSE/NDJSON 상태, AbortSignal, 취소, 저장과 오류 처리를 유지한다.
- 카드형 progress·step list·skeleton은 대기 overlay에서 표시하지 않는다.
- reduced motion에서는 지속적인 WebGL·gradient·이동 animation을 멈춘다.
- commit, push, PR은 별도 사용자 승인 전 실행하지 않는다.

---

### Task 1: OGL 의존성과 Strands 컴포넌트

**Files:**
- Modify: `web/package.json`
- Modify: `web/package-lock.json`
- Create: `web/src/components/ui/Strands.tsx`
- Create: `web/src/components/ui/Strands.structure.test.mjs`
- Modify: `web/src/app/globals.css`

- [x] **Step 1: Strands 계약 실패 테스트 작성**
- [x] **Step 2: `npm install ogl` 실행**
- [x] **Step 3: 첨부 소스를 TypeScript 컴포넌트로 이식하고 cleanup·reduced motion 보강**
- [x] **Step 4: Strands 테스트와 typecheck 통과 확인**

### Task 2: AI Text Loading 컴포넌트

**Files:**
- Create: `web/src/components/ui/AITextLoading.tsx`
- Create: `web/src/components/ui/AITextLoading.structure.test.mjs`

- [x] **Step 1: Motion·gradient·interval 계약 실패 테스트 작성**
- [x] **Step 2: 사용자 제공 Kokonut UI 코드를 프로젝트 `cn`과 reduced motion에 맞춰 이식**
- [x] **Step 3: 테스트와 lint 통과 확인**

### Task 3: 공용 AI 처리 오버레이 전환

**Files:**
- Modify: `web/src/components/ai/AIProcessingPanel.tsx`
- Create: `web/src/components/ai/AIProcessingPanel.structure.test.mjs`
- Modify: `web/src/app/globals.css`

- [x] **Step 1: portal·blur·Strands 설정·AITextLoading·취소 계약 실패 테스트 작성**
- [x] **Step 2: 기존 카드형 UI를 body portal overlay로 교체**
- [x] **Step 3: title·status·timed message·steps·long wait를 순환 텍스트로 연결**
- [x] **Step 4: body scroll cleanup과 WebGL fallback 확인**
- [x] **Step 5: 공용 UI와 기존 호출부 회귀 테스트 통과 확인**

### Task 4: 활성 문서와 전체 검증

**Files:**
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`

- [x] **Step 1: 적용 범위·접근성·reduced motion·로직 비변경을 기록**
- [x] **Step 2: `npm run lint`, `npx tsc --noEmit`, 관련 테스트, `npm run build`, `git diff --check` 실행**
- [x] **Step 3: 로그인 브라우저에서 실제 AI 대기 overlay·blur·중앙 정렬·텍스트 전환·취소·overflow 확인**
