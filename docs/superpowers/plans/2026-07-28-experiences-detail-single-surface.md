# Experiences Detail Single-Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `/experiences` right-hand activity detail read as one consistent near-white Liquid Glass surface without changing its content, controls, analysis panel, or data flow.

**Architecture:** Keep the existing markup and interaction hooks. Adjust only the Liquid Glass CSS override layer so the outer detail panel owns the material and its internal meta, content sections, and action row become transparent structural regions separated by the existing hairlines.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node test runner, Playwright-backed in-app browser inspection

## Global Constraints

- Apply the visual change only inside `.dashboard-experience-detail`.
- Preserve the outer border, radius, shadow, scrollbar, spacing, and existing 1px section dividers.
- Do not change `.dashboard-analysis-split-panel`, selected activity rows, button states, APIs, schemas, repositories, authentication, or user data.
- Preserve keyboard focus, forced-colors, reduced-motion, and responsive behavior.
- Do not commit, push, or open a PR without separate user approval.

---

### Task 1: Flatten the activity detail material hierarchy

**Files:**
- Modify: `web/src/app/globals.css:11855-11886`

**Interfaces:**
- Consumes: existing Liquid Glass custom properties `--liquid-content-fill`, `--liquid-regular-fill`, `--liquid-hairline`, `--liquid-edge-highlight`, and `--liquid-shadow-large`
- Produces: a single-surface visual contract scoped to `.product-shell[data-liquid-glass="true"] .dashboard-experience-detail`

- [x] **Step 1: Record the failing browser state**

At `http://localhost:3000/experiences`, select an activity and inspect computed styles:

```js
const detail = document.querySelector(".dashboard-experience-detail");
const meta = detail?.querySelector(".dashboard-detail-meta");
const section = detail?.querySelector(".dashboard-detail-content section");
const actions = detail?.querySelector(".dashboard-detail-actions");

return [detail, meta, section, actions].map((node) => {
  const style = getComputedStyle(node);
  return {
    background: style.backgroundColor,
    boxShadow: style.boxShadow,
    backdropFilter: style.backdropFilter,
  };
});
```

Expected failing state:

```text
detail: rgba(255, 255, 255, 0.64)
meta/section: rgba(255, 255, 255, 0.92) with inset shadow
actions: rgba(255, 255, 255, 0.44) with backdrop blur
```

- [x] **Step 2: Split the combined outer-panel rule**

Replace the combined detail/analysis material declaration with separate declarations:

```css
.product-shell[data-liquid-glass="true"]
  .dashboard-experience-detail.liquid-section {
  border-color: var(--liquid-hairline);
  background: var(--liquid-content-fill);
  box-shadow:
    inset 0 1px 0 var(--liquid-edge-highlight),
    var(--liquid-shadow-large);
}

.product-shell[data-liquid-glass="true"]
  .dashboard-analysis-split-panel.liquid-section {
  border-color: var(--liquid-hairline);
  background: var(--liquid-regular-fill);
  box-shadow:
    inset 0 1px 0 var(--liquid-edge-highlight),
    var(--liquid-shadow-large);
}
```

- [x] **Step 3: Make only detail internals transparent**

Keep the analysis internals on their existing content material and add a detail-only flat rule:

```css
.product-shell[data-liquid-glass="true"]
  .dashboard-experience-detail
  :is(.dashboard-detail-meta, .dashboard-detail-content section) {
  border-color: var(--liquid-hairline);
  background: transparent;
  box-shadow: none;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}

.product-shell[data-liquid-glass="true"]
  .dashboard-analysis-split-panel
  :is(.analysis-result.is-embedded, .followup-panel) {
  border-color: var(--liquid-hairline);
  background: var(--liquid-content-fill);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 88%);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
```

- [x] **Step 4: Scope and flatten the action row**

Replace the broad `.dashboard-detail-actions` Liquid Glass override with:

```css
.product-shell[data-liquid-glass="true"]
  .dashboard-experience-detail
  .dashboard-detail-actions {
  border-color: var(--liquid-hairline);
  background: transparent;
  box-shadow: none;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
```

- [x] **Step 5: Verify the computed material contract**

Repeat the Step 1 inspection. Expected:

```text
detail background: rgba(255, 255, 255, 0.92)
detail box shadow: non-none
meta/section/actions background: rgba(0, 0, 0, 0)
meta/section/actions box shadow: none
actions backdrop filter: none
```

Confirm the meta/content/action dividers still resolve to a non-transparent 1px border.

### Task 2: Verify behavior, responsive layout, and documentation

**Files:**
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`
- Modify: `design-qa.md`

**Interfaces:**
- Consumes: the single-surface CSS contract from Task 1
- Produces: verified responsive UI and an accurate project record

- [x] **Step 1: Run focused browser behavior checks**

On `/experiences`, verify:

```text
select activity → detail opens
close detail → detail closes
open AI analysis → analysis panel retains its layered material
close AI analysis → detail remains open
scroll detail → existing transient scrollbar behavior remains intact
keyboard Tab → existing focus-visible states remain visible
```

- [x] **Step 2: Run responsive checks**

Check `390×844`, `860×800`, `861×800`, `1024×800`, and `1400×900`.

For each viewport, assert:

```js
return {
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  hasHorizontalOverflow:
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
};
```

Expected: `hasHorizontalOverflow` is `false`, and the detail remains visually single-surface.

- [x] **Step 3: Run automated verification**

From `web`:

```bash
node --test
npm run lint
npx tsc --noEmit
npm run build
```

From the repository root:

```bash
git diff --check
```

Expected: every command exits with status 0.

- [x] **Step 4: Update active documentation with only verified facts**

Record:

```text
DESIGN / SCREEN_SPEC: right activity detail owns one near-white material; internal regions are transparent and use hairline separation
TODO / WORK_STATUS: this visual defect is resolved only after browser and automated verification pass
TASK_LOG: exact CSS file, reason, and command results
ISSUE_LOG: the nested-opacity material mismatch and the chosen scoped resolution
design-qa: viewport sizes, interaction checks, computed-style evidence, and any remaining observations
```

- [ ] **Step 5: Review the final diff without publishing**

Run:

```bash
git status --short
git diff -- web/src/app/globals.css docs/DESIGN.md docs/SCREEN_SPEC.md docs/TODO.md docs/WORK_STATUS.md docs/TASK_LOG.md docs/ISSUE_LOG.md design-qa.md
```

Confirm unrelated user-owned changes remain untouched. Do not stage, commit, push, or create a PR.
