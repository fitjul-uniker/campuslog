# AI Loading Text Cadence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strands 기반 공용 AI 처리 화면의 문구 전환을 2.4초로 늦추고 모든 표시 문구를 `...`로 끝낸다.

**Architecture:** 원본 API·SSE·NDJSON 메시지는 변경하지 않고 `AIProcessingPanel`의 화면 표시용 문구 정규화 경계에서만 끝맺음을 변환한다. 같은 컴포넌트가 모든 AI 처리 흐름에 사용되므로 호출부별 중복 수정 없이 공통 적용한다.

**Tech Stack:** React 19, TypeScript, Motion, Node test runner

## Global Constraints

- 전환 간격은 정확히 2,400ms를 사용한다.
- 화면 표시용 문구만 `...`로 끝내고 원본 상태 이벤트와 저장 데이터는 변경하지 않는다.
- 기존 `.`, `..`, `...`, `…` 끝맺음은 중복되지 않게 하나의 `...`로 정규화한다.
- 기존 빈 문자열 제거, 중복 제거, 취소, 접근성, reduced motion 동작을 유지한다.
- 사용자 승인 전 commit, push, PR은 실행하지 않는다.

---

### Task 1: AI 처리 문구 간격과 끝맺음 정규화

**Files:**
- Modify: `web/src/components/ai/AIProcessingPanel.tsx`
- Modify: `web/src/components/ai/AIProcessingPanel.structure.test.mjs`
- Modify: `docs/TASK_LOG.md`

**Interfaces:**
- Consumes: `AIProcessingPanel`의 `title`, `statusMessage`, `steps`, `description`, `longWaitMessage`
- Produces: `normalizeLoadingText(text: string): string` 화면 표시용 정규화 함수와 2,400ms `AITextLoading` interval

- [x] **Step 1: 실패 구조 테스트 작성**

```js
test("AI 처리 문구는 2.4초 간격과 말줄임 끝맺음을 사용한다", () => {
  assert.match(source, /function normalizeLoadingText/);
  assert.match(source, /replace\\(\\/\\[\\.\\.\\.\\u2026\\]\\+\\$\\/u, ""\\)/);
  assert.match(source, /return `\\$\\{normalizedText\\}\\.\\.\\.`/);
  assert.match(source, /interval=\\{2_400\\}/);
});
```

- [x] **Step 2: 테스트를 실행해 승인 동작이 아직 없어 실패하는지 확인**

Run:

```bash
cd web
node --test src/components/ai/AIProcessingPanel.structure.test.mjs
```

Expected: 새 테스트가 `normalizeLoadingText` 또는 `interval={2_400}` 부재로 FAIL

- [x] **Step 3: 표시 문구 정규화와 2.4초 간격 구현**

`AIProcessingPanel.tsx`에 아래 함수를 추가한다.

```ts
function normalizeLoadingText(text: string): string {
  const normalizedText = text.trim().replace(/[.…]+$/u, "");
  return `${normalizedText}...`;
}
```

`uniqueTexts`는 trim·filter 이후 `normalizeLoadingText`를 적용한 값으로 `Set`을 구성한다.

```ts
function uniqueTexts(texts: Array<string | undefined>): string[] {
  return Array.from(
    new Set(
      texts
        .map((text) => text?.trim())
        .filter(Boolean)
        .map((text) => normalizeLoadingText(text as string)),
    ),
  );
}
```

`AITextLoading` 호출 간격을 변경한다.

```tsx
<AITextLoading
  texts={loadingTexts}
  interval={2_400}
  className="ai-processing-loading-text"
/>
```

- [x] **Step 4: 관련 테스트와 정적 검사 실행**

Run:

```bash
cd web
node --test src/components/ai/AIProcessingPanel.structure.test.mjs src/components/ui/AITextLoading.structure.test.mjs
npm run lint
npx tsc --noEmit
git diff --check
```

Expected: 모든 명령 PASS

- [x] **Step 5: 실제 AI 처리 화면 확인**

로그인 `/experiences` 또는 `/recommend`에서 AI 요청을 시작하고 다음을 확인한다.

- 표시 문구가 약 2.4초 간격으로 전환됨
- 표시 문구가 정확히 `...`로 끝남
- Strands, 취소 버튼, overlay와 body scroll 복구가 유지됨

- [x] **Step 6: 작업 기록 갱신**

`docs/TASK_LOG.md` 최상단에 수정 파일, 2.4초 간격, 표시 전용 `...` 정규화, 테스트와 브라우저 검증 결과를 기록한다. 실제 확인하지 않은 흐름은 완료로 적지 않는다.

### Task 2: 추천 취소 피드백과 공용 취소 액션 간소화

**Files:**
- Modify: `web/src/app/recommend/page.tsx`
- Create: `web/src/app/recommend/page.structure.test.mjs`
- Modify: `web/src/components/ai/AIProcessingPanel.structure.test.mjs`
- Modify: `web/src/app/globals.css`

- [x] **Step 1: 추천 취소 alert 제거와 프레임 없는 취소 액션 실패 테스트 작성**
- [x] **Step 2: 테스트를 실행해 취소 문구와 pill 스타일 때문에 실패하는지 확인**
- [x] **Step 3: `REQUEST_CANCELLED`에서 오류 상태를 설정하지 않고 반환**
- [x] **Step 4: 취소 버튼의 배경·테두리·그림자를 제거하고 44px 클릭 영역 유지**
- [x] **Step 5: 관련 테스트와 실제 로그인 추천 취소 흐름 확인**
