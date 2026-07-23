# AI Recommendation Result Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 추천 결과와 추천 기록 상세에서 필수 역량·키워드·제약·1순위 요약·참고 문장을 화면에서 제거한다.

**Architecture:** 두 화면이 공유하는 `RecommendationResult`의 JSX만 간소화한다. API 응답 타입과 저장 필드는 유지하고, 구조 테스트로 제거 대상이 다시 렌더링되지 않으며 핵심 추천 영역이 남는지 고정한다.

**Tech Stack:** Next.js 15, React 19, TypeScript, Node test runner

## Global Constraints

- `/recommend`와 `/recommend/history`에 모두 적용한다.
- 추천 API, schema, repository와 기존 저장 데이터는 변경하지 않는다.
- 추천 Top 3, 추천 근거, JD 분석과 답변 생성 흐름은 유지한다.
- `참고 문장` 복사 버튼과 복사 성공·실패 상태도 함께 제거한다.
- 현재 작업 트리의 관련 없는 기존 변경은 보존한다.
- commit, push, PR은 별도 사용자 승인 전 실행하지 않는다.

---

### Task 1: 공용 추천 결과 표시 간소화

**Files:**
- Create: `web/src/components/ai/RecommendationResult.structure.test.mjs`
- Modify: `web/src/components/ai/RecommendationResult.tsx`

**Interfaces:**
- Consumes: `RecommendationResultProps`와 기존 `Result` 데이터
- Produces: 동일한 props 계약을 유지하면서 보조 블록을 렌더링하지 않는 `RecommendationResult`

- [x] **Step 1: 제거 대상과 유지 대상을 고정하는 실패 테스트 작성**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./RecommendationResult.tsx", import.meta.url),
  "utf8",
);

test("추천 결과는 보조 정보 블록을 렌더링하지 않는다", () => {
  for (const label of ["필수 역량", "키워드", "제약", "1순위 요약", "참고 문장"]) {
    assert.doesNotMatch(source, new RegExp(`>${label}<`));
  }
  assert.doesNotMatch(source, /recommendation-copy-button/);
});

test("추천 결과는 핵심 비교와 생성 흐름을 유지한다", () => {
  assert.match(source, /requirements\.preferredCompetencies/);
  assert.match(source, /matches\.map/);
  assert.match(source, /추천 이유/);
  assert.match(source, /AnswerDraftViewer/);
  assert.match(source, /초안 본문을 클립보드에 복사했습니다/);
});
```

- [x] **Step 2: 테스트를 실행해 RED 확인**

Run:

```bash
cd web
node --test src/components/ai/RecommendationResult.structure.test.mjs
```

Expected: 제거 대상 제목과 복사 버튼이 현재 JSX에 있어 FAIL.

- [x] **Step 3: 공용 결과 JSX에서 보조 블록 제거**

`RecommendationResult.tsx`에서 다음 렌더링만 제거한다.

```tsx
requirements.requiredCompetencies
requirements.keywords
requirements.constraints
recommendation-legacy-summary
참고 문장 detail-section
```

최상위 참고 문장에만 연결된 `copyStatus`, `setCopyStatus` 상태는 제거한다. `AnswerDraftViewer`의 `CopyButton`, `CopyStatus`와 복사 상태는 답변 초안 기능이므로 유지한다.

- [x] **Step 4: 테스트를 실행해 GREEN 확인**

Run:

```bash
cd web
node --test src/components/ai/RecommendationResult.structure.test.mjs
```

Expected: 2 tests PASS.

### Task 2: 활성 문서와 전체 검증

**Files:**
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`

**Interfaces:**
- Consumes: Task 1의 최종 화면 구조
- Produces: 실제 구현과 일치하는 Track B 기록

- [x] **Step 1: 표시 정책과 작업 기록 갱신**

현재 추천과 추천 기록에서 보조 블록을 숨기되 API·저장 구조는 유지한 사실만 기록한다.

- [x] **Step 2: 정적·회귀 검사 실행**

Run:

```bash
cd web
npm run lint
npx tsc --noEmit
node --test src/components/ai/RecommendationResult.structure.test.mjs
git diff --check
```

Expected: 모든 명령 성공.

- [x] **Step 3: 로그인 브라우저 화면 확인**

- `/recommend` 결과에서 제거 대상 제목이 보이지 않는다.
- `/recommend/history` 상세에서 제거 대상 제목과 복사 버튼이 보이지 않는다.
- 추천 경험과 근거 영역은 유지된다.
- 가로 overflow가 없다.
