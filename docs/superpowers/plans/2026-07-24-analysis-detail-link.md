# AI Analysis Detail Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 나의 활동 AI 분석 스플릿뷰 하단에 독립 분석 상세 이동 버튼을 추가한다.

**Architecture:** `DashboardAnalysisSplitPanel` 하단 footer에 `/experiences/${experience.id}/analysis` 링크를 추가하고 기존 상세 primary 액션 클래스를 재사용한다. 재분석 버튼과 분석 API 계약은 유지한다.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS, Node test runner

## Global Constraints

- 링크 문구는 `분석 상세 보기`를 사용한다.
- `활동 상세 보기`와 같은 primary 프레임과 오른쪽 `ArrowRight`를 사용한다.
- 링크는 `다시 분석하기` 왼쪽에 배치한다.
- API·schema·repository·저장 데이터는 변경하지 않는다.
- commit은 별도 사용자 승인 전 실행하지 않는다.

---

### Task 1: 분석 상세 이동 액션 추가

**Files:**
- Create: `web/src/components/experiences/DashboardAnalysisSplitPanel.structure.test.mjs`
- Modify: `web/src/components/experiences/DashboardAnalysisSplitPanel.tsx`
- Modify: `web/src/app/globals.css`
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TASK_LOG.md`

- [x] **Step 1: 링크가 없는 상태를 재현하는 실패 구조 테스트 작성**
- [x] **Step 2: 테스트를 실행해 RED 확인**
- [x] **Step 3: 상세 링크와 반응형 스타일 최소 구현**
- [x] **Step 4: lint, typecheck, 관련 테스트와 `git diff --check` 실행**
- [x] **Step 5: 로그인 브라우저에서 순서·경로·overflow 확인 후 문서 기록**
