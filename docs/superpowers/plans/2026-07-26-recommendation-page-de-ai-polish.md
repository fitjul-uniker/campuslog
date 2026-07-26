# Recommendation Page De-AI Polish Implementation Plan

> 2026-07-26 최종 사용자 결정: 아래 계획의 `추천 기록` 아이콘 제거·우측 자체 너비 단계는 원복되었으며 기존 History 아이콘·ghost 링크·반응형 배치를 유지한다. 사용자 행동 중심 문구와 16px 무그림자 표면 단계만 최종 구현에 남긴다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/recommend`의 추천 기록 액션, 빈 상태 문구, 큰 표면 스타일을 CampusLog 사용자 행동 중심으로 정리하고 범용 AI SaaS 템플릿 인상을 줄인다.

**Architecture:** 기존 `RecommendationPageHeader`와 `EmptyState` 사용 구조를 유지하되, 추천 화면에서만 문구와 인스턴스 사용 방식을 바꾼다. 전역 공용 카드 스타일을 수정하지 않고 `.recommendation-page` 하위의 페이지 한정 CSS override로 16px 모서리, 무그림자, 왼쪽 정렬을 적용한다.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS, Node.js `node:test`

## Global Constraints

- 적용 범위는 `/recommend` 한 화면으로 제한한다.
- H1 `AI 기반 활동 추천`, Breadcrumb, 추천 로직, 저장, API, schema, repository, 이미지 첨부와 추천 결과 데이터 구조는 변경하지 않는다.
- 다른 화면에서 사용하는 공용 `EmptyState`와 카드 시스템의 기본 표현은 유지한다.
- `추천 기록`은 기존 `/recommend/history` 경로와 최소 44px 조작 영역, focus-visible을 유지한다.
- 390×844에서 가로 overflow가 없어야 한다.
- 사용자 승인 전 stage, commit, push, PR 생성은 실행하지 않고 추천 커밋 메시지만 보고한다.
- 기존 작업 트리의 이미지 Gallery와 활동 목록 변경은 사용자 소유 변경으로 보존한다.

---

### Task 1: 추천 화면 문구와 다음 행동을 동작 테스트로 고정

**Files:**
- Create: `web/src/app/recommend/recommendationPagePresentation.test.mjs`
- Create after RED: `web/src/app/recommend/recommendationPagePresentation.ts`
- Test: `web/src/app/recommend/recommendationPagePresentation.test.mjs`

**Interfaces:**
- Consumes: 완료 경험 수와 진행 활동 수로 구분되는 현재 추천 화면 상태
- Produces: `RECOMMENDATION_PAGE_DESCRIPTION: string`, `getRecommendationEmptyStatePresentation(trackedActivityCount: number): RecommendationEmptyStatePresentation`

- [ ] **Step 1: 두 빈 상태의 사용자 문구와 이동 경로를 검사하는 실패 테스트 추가**

`web/src/app/recommend/recommendationPagePresentation.test.mjs`를 아래 내용으로 생성한다.

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  RECOMMENDATION_PAGE_DESCRIPTION,
  getRecommendationEmptyStatePresentation,
} from "./recommendationPagePresentation.ts";

test("추천 화면은 사용자가 경험을 고르는 상황을 설명한다", () => {
  assert.equal(
    RECOMMENDATION_PAGE_DESCRIPTION,
    "지원 문항이나 JD에 어떤 경험을 쓸지 고민될 때 활용해 보세요.",
  );
});

test("활동이 없으면 새 활동과 과거 활동 기록을 안내한다", () => {
  assert.deepEqual(getRecommendationEmptyStatePresentation(0), {
    title: "추천에 사용할 경험이 아직 없어요",
    description:
      "새 활동을 시작해 기록을 쌓거나, 이미 끝난 활동을 바로 등록해 주세요.",
    primaryAction: {
      href: "/activities/new",
      label: "활동 추가",
    },
    secondaryAction: {
      href: "/experiences/new",
      label: "과거 활동 기록하기",
    },
  });
});

test("진행 활동이 있으면 완료 경험 정리를 먼저 안내한다", () => {
  assert.deepEqual(getRecommendationEmptyStatePresentation(1), {
    title: "진행 중인 활동을 경험으로 정리해 주세요",
    description:
      "쌓아 둔 기록을 확인하고 완료 경험으로 정리하면 추천에 활용할 수 있어요.",
    primaryAction: {
      href: "/dashboard",
      label: "진행 활동 확인하기",
    },
    secondaryAction: {
      href: "/experiences/new",
      label: "과거 활동 기록하기",
    },
  );
});
```

- [ ] **Step 2: 테스트가 승인된 변경 부재로 실패하는지 확인**

Run:

```bash
cd web
node --test src/app/recommend/recommendationPagePresentation.test.mjs
```

Expected: `recommendationPagePresentation.ts`가 아직 없어 module not found로 FAIL한다. 테스트 파일 자체의 구문 오류로 실패하면 테스트를 바로잡고 다시 실행한다.

---

### Task 2: 헤더 액션과 빈 상태 표현 구현

**Files:**
- Create: `web/src/app/recommend/recommendationPagePresentation.ts`
- Modify: `web/src/app/recommend/page.tsx:1-83`
- Modify: `web/src/app/recommend/page.tsx:313-342`
- Modify: `web/src/app/globals.css:5840-5851`
- Modify: `web/src/app/globals.css:10773-10851`
- Test: `web/src/app/recommend/recommendationPagePresentation.test.mjs`

**Interfaces:**
- Consumes: 공용 `EmptyState`, `button-secondary`, `recommendation-page` 클래스와 `trackedActivityCount`
- Produces: 텍스트 전용 `추천 기록` 보조 버튼, 사용자 행동 중심 빈 상태, `/recommend` 한정 표면 스타일

- [ ] **Step 1: 테스트를 통과할 presentation 모듈 구현**

`web/src/app/recommend/recommendationPagePresentation.ts`에 승인된 문구와 상태 분기를 구현한다.

```ts
type EmptyStateAction = {
  href: string;
  label: string;
};

export type RecommendationEmptyStatePresentation = {
  title: string;
  description: string;
  primaryAction: EmptyStateAction;
  secondaryAction: EmptyStateAction;
};

export const RECOMMENDATION_PAGE_DESCRIPTION =
  "지원 문항이나 JD에 어떤 경험을 쓸지 고민될 때 활용해 보세요.";

export function getRecommendationEmptyStatePresentation(
  trackedActivityCount: number,
): RecommendationEmptyStatePresentation {
  const hasTrackedActivity = trackedActivityCount > 0;

  return {
    title: hasTrackedActivity
      ? "진행 중인 활동을 경험으로 정리해 주세요"
      : "추천에 사용할 경험이 아직 없어요",
    description: hasTrackedActivity
      ? "쌓아 둔 기록을 확인하고 완료 경험으로 정리하면 추천에 활용할 수 있어요."
      : "새 활동을 시작해 기록을 쌓거나, 이미 끝난 활동을 바로 등록해 주세요.",
    primaryAction: {
      href: hasTrackedActivity ? "/dashboard" : "/activities/new",
      label: hasTrackedActivity ? "진행 활동 확인하기" : "활동 추가",
    },
    secondaryAction: {
      href: "/experiences/new",
      label: "과거 활동 기록하기",
    },
  };
}
```

- [ ] **Step 2: presentation 동작 테스트가 통과하는지 확인**

Run:

```bash
cd web
node --test src/app/recommend/recommendationPagePresentation.test.mjs
```

Expected: 3 tests PASS.

- [ ] **Step 3: 페이지에서 presentation 모듈을 사용하고 장식 아이콘 제거**

`web/src/app/recommend/page.tsx`의 Lucide import에서 `BookOpenText`, `History`를 제거한다.

```ts
import Link from "next/link";
import { useReducedMotion } from "motion/react";
```

`추천 기록` 링크 내부의 `<History ... />`와 `EmptyState`의 `icon={<BookOpenText />}` prop을 제거한다.

- [ ] **Step 4: 페이지 설명과 빈 상태에 presentation 결과 연결**

로컬 `RECOMMENDATION_PAGE_DESCRIPTION`을 제거하고 모듈을 import한다.

```ts
import {
  RECOMMENDATION_PAGE_DESCRIPTION,
  getRecommendationEmptyStatePresentation,
} from "./recommendationPagePresentation";
```

`experiences.length === 0` 분기 직전에 presentation을 만들고 props로 전달한다.

```tsx
const emptyStatePresentation =
  getRecommendationEmptyStatePresentation(trackedActivityCount);

<EmptyState
  title={emptyStatePresentation.title}
  description={emptyStatePresentation.description}
  primaryAction={emptyStatePresentation.primaryAction}
  secondaryAction={emptyStatePresentation.secondaryAction}
/>
```

- [ ] **Step 5: 추천 기록을 명확한 보조 버튼으로 변경**

링크 class를 아래처럼 바꾼다.

```tsx
className="button button-secondary recommendation-header-link"
```

기존 공용 `button-secondary`의 border, 중립 배경, focus-visible을 재사용하고 새 컴포넌트는 만들지 않는다.

- [ ] **Step 6: `/recommend` 한정 표면 스타일 추가**

`web/src/app/globals.css`의 추천 화면 관련 규칙 가까이에 아래 스타일을 추가한다.

```css
.product-surface .recommendation-page > .empty-state {
  min-height: 0;
  justify-items: start;
  gap: 0;
  border-radius: 16px;
  padding: clamp(28px, 4vw, 40px);
  box-shadow: none;
  text-align: left;
}

.product-surface .recommendation-page > .empty-state > * {
  max-width: 640px;
}

.product-surface .recommendation-page > .empty-state h2 {
  margin-bottom: 10px;
}

.product-surface .recommendation-page > .empty-state p {
  margin-bottom: 26px;
}

.product-surface .recommendation-page > .empty-state .empty-state-actions {
  justify-content: flex-start;
}

.product-surface
  .recommendation-page
  :is(.form-panel, .detail-panel, .placeholder-panel) {
  border-radius: 16px;
  box-shadow: none;
}
```

- [ ] **Step 7: 모바일에서 추천 기록 액션을 오른쪽 자체 너비로 유지**

기존 `@media (max-width: 860px)` 안에 다음 override를 추가한다.

```css
.product-surface .recommendation-header-actions {
  width: auto;
  align-self: flex-end;
}

.product-surface .recommendation-header-link {
  width: auto;
  flex: 0 0 auto;
}
```

640px 이하의 공용 `.button { width: 100%; }`보다 선택자 특이도가 높아 추천 기록만 자체 너비를 유지해야 한다. 빈 상태 CTA는 기존 전체 폭 모바일 동작을 유지한다.

- [ ] **Step 8: presentation 테스트와 기존 추천 구조 테스트가 통과하는지 확인**

Run:

```bash
cd web
node --test \
  src/app/recommend/recommendationPagePresentation.test.mjs \
  src/app/recommend/page.structure.test.mjs
```

Expected: presentation 3개와 기존 추천 2개 테스트가 모두 PASS한다.

---

### Task 3: 활성 문서와 작업 기록 정합성 갱신

**Files:**
- Modify: `docs/CURRENT_PHASE.md`
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TODO.md`
- Modify: `docs/ISSUE_LOG.md`
- Modify: `docs/TASK_LOG.md`
- Modify after browser QA: `design-qa.md`

**Interfaces:**
- Consumes: 승인된 디자인 명세와 실제 구현·검증 결과
- Produces: `/recommend` 헤더·빈 상태·표면 기준과 실제 테스트 결과가 일치하는 활성 문서

- [ ] **Step 1: 활성 디자인 기준 갱신**

`docs/CURRENT_PHASE.md`, `docs/DESIGN.md`, `docs/SCREEN_SPEC.md`의 `CampusLog AI` 또는 `/recommend` 기준에 아래 내용을 한 번만 반영한다.

```text
/recommend의 추천 기록은 데스크톱 제목 오른쪽과 모바일 오른쪽 자체 너비의 텍스트 보조 버튼으로 표시한다. 빈 상태는 AI 기능을 반복 설명하지 않고 사용자의 현재 상태와 다음 행동을 안내하며, 책 아이콘을 제거한 왼쪽 정렬 16px 무그림자 표면을 사용한다. 추천 화면의 입력·결과·로딩 큰 표면도 페이지 한정 16px 무그림자 표현을 사용하되 내부 입력·Gallery·오류 경계는 유지한다.
```

- [ ] **Step 2: 상태·이슈·작업 기록 갱신**

`docs/WORK_STATUS.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/TASK_LOG.md`에 다음 사실을 현재 문서 형식에 맞춰 기록한다.

```text
- Track B `/recommend` 시각 밀도 개선
- API/schema/repository/사용자 데이터 영향 없음
- 공용 EmptyState와 다른 화면의 카드 시스템 변경 없음
- 추천 기록의 경로와 키보드 접근성 유지
- 테스트·브라우저 결과는 실제 실행 뒤 수치와 viewport를 기록
```

- [ ] **Step 3: 문서 diff 정합성 확인**

Run:

```bash
git diff --check
```

Expected: 출력 없이 종료 코드 0.

---

### Task 4: 전체 회귀와 브라우저 검증

**Files:**
- Modify after QA: `design-qa.md`
- Verify: `web/src/app/recommend/page.tsx`
- Verify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: Task 1~3의 코드·스타일·문서 변경
- Produces: 자동 테스트와 실제 화면에서 검증된 `/recommend` 개선

- [ ] **Step 1: 전체 Node 테스트 실행**

Run:

```bash
cd web
find src -name "*.test.mjs" -print0 | xargs -0 node --test
```

Expected: 모든 테스트 PASS, 오류와 경고 없음.

- [ ] **Step 2: lint와 TypeScript 검증**

Run:

```bash
cd web
npm run lint
npx tsc --noEmit
```

Expected: 두 명령 모두 종료 코드 0.

- [ ] **Step 3: production build 검증**

Run:

```bash
cd web
npm run build
```

Expected: Next.js production build 성공.

- [ ] **Step 4: 브라우저에서 빈 상태 확인**

`http://localhost:3000/recommend`에서 아래를 확인한다.

```text
- 추천 기록이 중립 테두리 보조 버튼이며 데스크톱 제목 오른쪽에 있음
- 모바일에서 추천 기록이 전체 폭이나 중앙 정렬이 아닌 오른쪽 자체 너비임
- 빈 상태가 왼쪽 정렬되고 책 아이콘이 없음
- 문구가 승인된 상태별 문구와 일치함
- 빈 상태와 추천 화면 큰 표면의 그림자가 제거되고 16px 모서리임
- 활동 추가와 과거 활동 기록하기 링크가 정상 이동함
- 390×844에서 document.scrollWidth === document.clientWidth
- 브라우저 콘솔에 새 오류나 경고가 없음
```

- [ ] **Step 5: QA 기록과 최종 diff 확인**

`design-qa.md`와 작업 기록 문서에 실제 viewport, 화면 상태, 콘솔, overflow, 자동 검증 결과만 추가한다.

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: whitespace 오류 없음. 사용자 소유의 기존 변경은 그대로 남아 있고, 이번 작업 파일만 의도한 내용이 추가됨.

- [ ] **Step 6: 커밋 없이 완료 보고**

아래 추천 커밋 메시지만 보고하고, 별도 사용자 승인이 있기 전에는 stage, commit, push, PR 생성은 하지 않는다.

```text
refactor: simplify recommendation page presentation
```
