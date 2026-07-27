# Analysis Gap Warning Alert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 부족 정보의 보완 이유를 답변 textarea 아래 ReUI 참고 Warning Alert로 표시하고 textarea placeholder를 제거한다.

**Architecture:** 공용 합성형 Alert primitive를 추가하고 기존 `AnalysisGapAnswerList`의 열린 MorphSurface 안에서만 사용한다. 저장·초점·repository 흐름은 변경하지 않고 표시 구조와 스타일만 조정한다.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS, lucide-react, Node test runner

## Global Constraints

- 기존 CampusLog 웜 화이트·차콜 디자인과 MorphSurface 동작을 유지한다.
- 새 npm dependency를 추가하지 않는다.
- API, schema, repository, 사용자 데이터 계약을 변경하지 않는다.
- 사용자가 승인하기 전 commit, push, PR을 진행하지 않는다.

---

### Task 1: Warning Alert 구조

**Files:**
- Create: `web/src/components/reui/alert.tsx`
- Modify: `web/src/components/ai/AnalysisGapAnswerList.tsx`
- Modify: `web/src/app/globals.css`
- Test: `web/src/components/ai/AnalysisGapAnswerList.structure.test.mjs`

**Interfaces:**
- Produces: `Alert`, `AlertTitle`, `AlertDescription`
- Consumes: `item.reason`, `AlertTriangleIcon`, 기존 `MorphSurface`

- [ ] **Step 1: 실패 테스트 작성**

  구조 테스트가 warning Alert import·합성, textarea 뒤 Alert 배치, placeholder 제거를 요구하도록 수정한다.

- [ ] **Step 2: RED 확인**

  Run: `node --test src/components/ai/AnalysisGapAnswerList.structure.test.mjs`

  Expected: Alert primitive와 새 순서가 없어 FAIL.

- [ ] **Step 3: 최소 구현**

  `components/reui/alert.tsx`에 합성형 primitive를 만들고, 질문 다음에 빈 textarea, 그 아래 `variant="warning"` Alert를 렌더링한다. 실제 부족 정보 화면은 제목 없이 `AlertTriangleIcon`과 `AlertDescription`의 `item.reason`만 사용한다.

- [ ] **Step 4: CampusLog 스타일 적용**

  `.reui-alert` 계열에 12px radius, 웜 앰버 경계·배경, 18px 아이콘, 조밀한 설명 계층을 적용한다.

- [ ] **Step 5: GREEN 확인**

  Run: `node --test src/components/ai/AnalysisGapAnswerList.structure.test.mjs`

  Expected: PASS.

### Task 2: 문서·회귀·브라우저 검증

**Files:**
- Modify: `docs/CURRENT_PHASE.md`
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TODO.md`
- Modify: `docs/ISSUE_LOG.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `design-qa.md`

- [ ] **Step 1: 활성 문서 갱신**

  부족 정보의 최종 순서와 Warning Alert 표현, textarea placeholder 제거를 한 번만 기록한다.

- [ ] **Step 2: 전체 자동 검증**

  Run:

  ```bash
  find src -name '*.test.mjs' -print0 | xargs -0 node --test
  npm run lint
  npx tsc --noEmit
  npm run build
  git diff --check
  ```

- [ ] **Step 3: 실제 브라우저 QA**

  로그인된 `http://localhost:3000/experiences`에서 부족 정보 질문을 열고 textarea 아래 Warning Alert, placeholder 부재, 저장 버튼, 가로 overflow 0, 런타임 오류 overlay 부재를 확인한다.

- [ ] **Step 4: 변경 범위 확인**

  API·schema·repository·사용자 데이터 변경이 없고 기존 작업 트리의 관련 없는 변경이 보존됐는지 확인한다.
