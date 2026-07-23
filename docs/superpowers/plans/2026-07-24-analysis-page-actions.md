# AI Analysis Page Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 독립 AI 분석 화면의 복귀 링크를 상단으로 옮기고 분석 실행 버튼만 하단에 남긴다.

**Architecture:** `ExperienceAnalysisClient`의 공통 페이지 헤더에 두 복귀 링크를 추가하고 결과 유무에 따른 하단 `panel-actions`는 AI 실행 버튼만 렌더링한다. 기존 분석 상태와 네트워크 계약은 변경하지 않는다.

**Tech Stack:** Next.js 15, React 19, TypeScript, Node test runner, CSS

## Global Constraints

- 상단에는 활동 경험 상세와 나의 활동 복귀 링크만 둔다.
- 하단에는 다시 분석하기 또는 AI 분석 요청만 둔다.
- AI 기반 활동 추천 링크는 제거한다.
- API·schema·repository·저장 데이터는 변경하지 않는다.
- commit, push, PR은 별도 승인 전 실행하지 않는다.

---

### Task 1: 분석 페이지 액션 재배치

**Files:**
- Create: `web/src/components/experiences/ExperienceAnalysisClient.structure.test.mjs`
- Modify: `web/src/components/experiences/ExperienceAnalysisClient.tsx`
- Modify: `web/src/app/globals.css`

- [x] **Step 1: 실패 구조 테스트 작성**

상단 헤더에 두 복귀 링크가 있고 결과 하단에는 AI 실행 버튼만 남으며 `/recommend` 링크가 없는지 검사한다.

- [x] **Step 2: RED 확인**

Run: `cd web && node --test src/components/experiences/ExperienceAnalysisClient.structure.test.mjs`

Expected: 현재 복귀 링크가 하단에 있고 `/recommend` 링크가 있어 FAIL.

- [x] **Step 3: 최소 구현**

공통 `page-header`에 `analysis-page-header-actions`를 추가하고 결과 유무 양쪽 `panel-actions`에서 복귀·추천 링크를 제거한다. `panel-actions`는 왼쪽 정렬을 유지한다.

- [x] **Step 4: GREEN 확인**

Run: `cd web && node --test src/components/experiences/ExperienceAnalysisClient.structure.test.mjs`

Expected: PASS.

### Task 2: 문서와 검증

**Files:**
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`

- [x] **Step 1: 실제 액션 위계 기록**
- [x] **Step 2: lint, typecheck, 관련 테스트와 `git diff --check` 실행**
- [x] **Step 3: 로그인 브라우저에서 상단·하단 배치와 가로 overflow 확인**
