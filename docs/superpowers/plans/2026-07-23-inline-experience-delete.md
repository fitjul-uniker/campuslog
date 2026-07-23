# Inline Experience Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an icon-and-text delete action to the completed experience inline detail shown on the right side of `/experiences`.

**Architecture:** Reuse `DashboardExperienceDetail`'s existing confirmation UI and `onDelete` contract. `ExperienceDashboard` owns repository deletion and updates its experience, analysis, request, split-view, and selection state only after deletion succeeds.

**Tech Stack:** Next.js 15, React 19, TypeScript, Lucide React, Node test runner, CSS container queries

## Global Constraints

- Scope is only the completed experience inline detail opened from `/experiences`.
- Action order is `활동 상세 보기`, `수정`, `삭제`, `AI 분석 요청/결과`.
- The delete action uses `Trash2` plus visible `삭제` text.
- Do not change schema, API contracts, repository deletion behavior, tracked activity detail, or fullscreen experience detail.
- Do not commit until the user explicitly requests a commit.

---

### Task 1: Connect inline completed-experience deletion

**Files:**
- Create: `web/src/components/experiences/DashboardExperienceDetail.structure.test.mjs`
- Modify: `web/src/components/experiences/DashboardExperienceDetail.tsx`
- Modify: `web/src/components/experiences/ExperienceDashboard.tsx`
- Modify: `web/src/app/globals.css`
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/ISSUE_LOG.md`
- Modify: `docs/TASK_LOG.md`

**Interfaces:**
- Consumes: `DashboardExperienceDetailProps.onDelete?: () => void`
- Consumes: `CampusLogRepository.experiences.delete(id: string): Promise<boolean>`
- Produces: `handleDeleteExperience(experience: Experience): Promise<void>`

- [x] **Step 1: Write the failing structure test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const detailSource = await readFile(
  new URL("./DashboardExperienceDetail.tsx", import.meta.url),
  "utf8",
);
const dashboardSource = await readFile(
  new URL("./ExperienceDashboard.tsx", import.meta.url),
  "utf8",
);

test("인라인 완료 경험 상세에 삭제 액션을 연결한다", () => {
  const inlineBranch = detailSource.slice(
    detailSource.indexOf(") : ("),
    detailSource.indexOf("</div>", detailSource.indexOf(") : (")),
  );

  assert.match(inlineBranch, /dashboard-detail-delete/);
  assert.match(inlineBranch, /<Trash2/);
  assert.match(inlineBranch, /삭제/);
  assert.match(dashboardSource, /onDelete=\{\(\) =>/);
  assert.match(dashboardSource, /handleDeleteExperience\(selectedExperience\)/);
});
```

- [x] **Step 2: Run the test and verify RED**

Run:

```bash
node --test src/components/experiences/DashboardExperienceDetail.structure.test.mjs
```

Expected: FAIL because the inline branch does not render `dashboard-detail-delete` and `ExperienceDashboard` does not pass `onDelete`.

- [x] **Step 3: Implement dashboard-owned deletion**

Add `experienceDeleteError`, clear it on selection, and add:

```ts
const handleDeleteExperience = async (experience: Experience) => {
  setExperienceDeleteError("");
  const repository = getCampusLogRepository();
  let didDelete = false;

  try {
    didDelete = await repository.experiences.delete(experience.id);
  } catch {
    didDelete = false;
  }

  if (!didDelete) {
    setExperienceDeleteError(
      "경험을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
    return;
  }

  setExperiences((current) =>
    current?.filter((item) => item.id !== experience.id) ?? current,
  );
  setAnalysesByExperienceId((current) => {
    const next = { ...current };
    delete next[experience.id];
    return next;
  });
  setAnalysisRequestByExperienceId((current) => {
    const next = { ...current };
    delete next[experience.id];
    return next;
  });
  setIsAnalysisOpen(false);
  setSelectedItemKey(null);
};
```

Pass the handler and deletion error:

```tsx
onDelete={() => handleDeleteExperience(selectedExperience)}
analysisError={
  experienceDeleteError ||
  analysisRequestByExperienceId[selectedExperience.id]?.error ||
  ""
}
```

- [x] **Step 4: Render the inline delete action**

Append after `analysisAction` in the inline branch:

```tsx
{onDelete ? (
  <button
    className="dashboard-detail-action dashboard-detail-delete"
    type="button"
    onClick={handleDelete}
  >
    <Trash2 aria-hidden="true" />
    삭제
  </button>
) : null}
```

The existing container-query layout kept all four actions on one line during visual verification, so no additional delete-specific width override was added.

- [x] **Step 5: Run the structure test and verify GREEN**

Run:

```bash
node --test src/components/experiences/DashboardExperienceDetail.structure.test.mjs
```

Expected: PASS.

- [x] **Step 6: Update active product and tracking documents**

Record that completed experience inline detail now includes a destructive delete action with confirmation, success removal, failure preservation, and responsive toolbar behavior.

- [x] **Step 7: Run full verification**

Run:

```bash
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Expected: all commands exit `0`.

Verify `/experiences` at desktop and mobile widths:

- completed experience inline detail shows four actions;
- the narrow desktop detail slot keeps them on one line;
- cancel leaves list and detail unchanged;
- failure preserves list and detail;
- success removes the item and closes the detail.
