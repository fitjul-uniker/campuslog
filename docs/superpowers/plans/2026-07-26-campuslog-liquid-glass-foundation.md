# CampusLog Liquid Glass Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve CampusLog’s current routes, information hierarchy, content, and product logic while applying an Apple-inspired, cool-neutral Liquid Glass material system to the authenticated app shell, navigation, menus, popovers, and overlays.

**Architecture:** Add one presentation-only `GlassSurface` primitive and one `GlassGroup` grouping primitive. Apply them only to the functional layer; keep long-form content, forms, cards, calendars, and AI results on solid surfaces. Scope global material tokens and responsive rules to `.product-shell` so the landing and authentication experiences do not regress. Existing routing, repositories, API contracts, focus management, portals, and overlay positioning stay owned by their current components.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS Modules, global CSS, Radix Dropdown Menu, Base UI Select/Combobox, Motion, Lucide, Node test runner.

## Global Constraints

- Track B only. Do not change schema, API, repository, authentication, storage, or user-data contracts.
- Treat `docs/superpowers/specs/2026-07-26-campuslog-liquid-glass-design.md` as the visual and behavioral source of truth.
- Preserve existing page DOM and product content unless this plan explicitly names a shared shell or overlay wrapper.
- Keep `#F5F5F7`, `#FFFFFF`, `#FAFAFA`, `#1D1D1F`, and `#6E6E73` as the cool-neutral foundation. Do not add beige, warm-white, decorative color blobs, or ornamental gradients.
- Use backdrop blur only on the functional layer. Do not apply Glass to activity cards, calendar bodies, long AI results, form fields, textareas, or gallery image tiles.
- Keep current keyboard, focus return, `aria-*`, portal, collision, safe-area, and `visualViewport` behavior.
- Add no dependency.
- Use test-first steps: write a failing source-structure contract, run it to confirm RED, implement the smallest change, then rerun to GREEN.
- Do not stage `.superpowers/`.
- Commit steps are gated by the repository rule: run them only after the user explicitly approves commits for the implementation.

---

## Task 1: Add the shared Glass presentation primitives

**Files:**

- Create: `web/src/components/ui/glass-surface.tsx`
- Create: `web/src/components/ui/glass-surface.module.css`
- Create: `web/src/components/ui/GlassSurface.structure.test.mjs`

### Public interface

```ts
export type GlassVariant =
  | "regular"
  | "prominent"
  | "clear"
  | "solidFallback";

export type GlassShape = "rounded" | "capsule" | "circle";
export type GlassElevation = "bar" | "popover" | "modal";

type GlassTag = "div" | "aside" | "header" | "nav" | "section";

export type GlassSurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: GlassTag;
  variant?: GlassVariant;
  shape?: GlassShape;
  elevation?: GlassElevation;
  interactive?: boolean;
};
```

- [ ] **Step 1: Write the failing primitive contract**

Create `web/src/components/ui/GlassSurface.structure.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./glass-surface.tsx", import.meta.url);
const stylesPath = new URL("./glass-surface.module.css", import.meta.url);

test("GlassSurface exposes semantic material variants without owning product logic", async () => {
  const source = await readFile(componentPath, "utf8");

  assert.match(source, /export type GlassVariant/);
  assert.match(source, /"regular"/);
  assert.match(source, /"prominent"/);
  assert.match(source, /"clear"/);
  assert.match(source, /"solidFallback"/);
  assert.match(source, /data-glass-variant/);
  assert.match(source, /data-glass-shape/);
  assert.match(source, /data-glass-elevation/);
  assert.match(source, /data-glass-interactive/);
  assert.match(source, /export function GlassGroup/);
  assert.doesNotMatch(source, /usePathname|fetch\(|repository|Action/);
});

test("Glass material provides browser and accessibility fallbacks", async () => {
  const styles = await readFile(stylesPath, "utf8");

  assert.match(styles, /backdrop-filter:\s*blur/);
  assert.match(styles, /-webkit-backdrop-filter:\s*blur/);
  assert.match(styles, /@supports not/);
  assert.match(styles, /prefers-reduced-transparency:\s*reduce/);
  assert.match(styles, /prefers-contrast:\s*more/);
  assert.match(styles, /forced-colors:\s*active/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /pointer-events:\s*none/);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
cd web
node --test src/components/ui/GlassSurface.structure.test.mjs
```

Expected: FAIL with `ENOENT` for `glass-surface.tsx` or `glass-surface.module.css`.

- [ ] **Step 3: Implement the presentation-only React primitive**

Create `web/src/components/ui/glass-surface.tsx`:

```tsx
import {
  createElement,
  type HTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

import styles from "./glass-surface.module.css";

export type GlassVariant =
  | "regular"
  | "prominent"
  | "clear"
  | "solidFallback";

export type GlassShape = "rounded" | "capsule" | "circle";
export type GlassElevation = "bar" | "popover" | "modal";

type GlassTag = "div" | "aside" | "header" | "nav" | "section";

export type GlassSurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: GlassTag;
  variant?: GlassVariant;
  shape?: GlassShape;
  elevation?: GlassElevation;
  interactive?: boolean;
};

export function GlassSurface({
  as = "div",
  variant = "regular",
  shape = "rounded",
  elevation = "bar",
  interactive = false,
  className,
  ...props
}: GlassSurfaceProps) {
  return createElement(as, {
    ...props,
    className: cn(styles.surface, className),
    "data-glass-variant": variant,
    "data-glass-shape": shape,
    "data-glass-elevation": elevation,
    "data-glass-interactive": interactive ? "true" : "false",
  });
}

export function GlassGroup({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.group, className)} {...props} />;
}
```

- [ ] **Step 4: Implement the material CSS with solid fallbacks**

Create `web/src/components/ui/glass-surface.module.css` with these exact responsibilities:

```css
.surface {
  --glass-fill: rgb(255 255 255 / 62%);
  --glass-edge: rgb(255 255 255 / 72%);
  --glass-border: rgb(29 29 31 / 10%);
  --glass-blur: 24px;
  --glass-saturation: 1.18;
  --glass-shadow: 0 14px 38px rgb(0 0 0 / 9%);
  position: relative;
  isolation: isolate;
  border: 1px solid var(--glass-border);
  background: var(--glass-fill);
  box-shadow:
    inset 0 1px 0 var(--glass-edge),
    var(--glass-shadow);
  -webkit-backdrop-filter:
    blur(var(--glass-blur))
    saturate(var(--glass-saturation));
  backdrop-filter:
    blur(var(--glass-blur))
    saturate(var(--glass-saturation));
}

.surface::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background:
    linear-gradient(
      145deg,
      rgb(255 255 255 / 22%),
      rgb(255 255 255 / 0%) 38%
    );
  content: "";
  pointer-events: none;
}

.surface[data-glass-shape="rounded"] {
  border-radius: 28px;
}

.surface[data-glass-shape="capsule"] {
  border-radius: 999px;
}

.surface[data-glass-shape="circle"] {
  border-radius: 50%;
}

.surface[data-glass-elevation="popover"] {
  --glass-fill: rgb(255 255 255 / 74%);
  --glass-shadow: 0 18px 48px rgb(0 0 0 / 14%);
}

.surface[data-glass-elevation="modal"] {
  --glass-fill: rgb(255 255 255 / 82%);
  --glass-blur: 30px;
  --glass-shadow: 0 28px 80px rgb(0 0 0 / 18%);
}

.surface[data-glass-variant="prominent"] {
  --glass-fill: rgb(255 255 255 / 82%);
  --glass-border: rgb(29 29 31 / 14%);
}

.surface[data-glass-variant="clear"] {
  --glass-fill: rgb(255 255 255 / 42%);
}

.surface[data-glass-variant="solidFallback"] {
  --glass-fill: #ffffff;
  --glass-blur: 0px;
  --glass-saturation: 1;
}

.surface[data-glass-interactive="true"] {
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.surface[data-glass-interactive="true"]:active {
  transform: scale(0.985);
}

.group {
  position: relative;
  isolation: isolate;
}

@supports not (
  (backdrop-filter: blur(1px)) or
  (-webkit-backdrop-filter: blur(1px))
) {
  .surface {
    --glass-fill: rgb(255 255 255 / 96%);
    --glass-blur: 0px;
    --glass-saturation: 1;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .surface {
    --glass-fill: #ffffff;
    --glass-blur: 0px;
    --glass-saturation: 1;
  }
}

@media (prefers-contrast: more) {
  .surface {
    --glass-fill: #ffffff;
    --glass-border: rgb(29 29 31 / 44%);
    --glass-blur: 0px;
  }
}

@media (forced-colors: active) {
  .surface {
    border: 1px solid CanvasText;
    background: Canvas;
    box-shadow: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }

  .surface::before {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .surface[data-glass-interactive="true"] {
    transition: none;
  }

  .surface[data-glass-interactive="true"]:active {
    transform: none;
  }
}
```

The neutral linear gradient is allowed only as the material’s optical edge highlight. Do not add decorative color stops.

- [ ] **Step 5: Run focused and static validation**

Run:

```bash
cd web
node --test src/components/ui/GlassSurface.structure.test.mjs
npx tsc --noEmit
```

Expected: both commands PASS.

- [ ] **Step 6: Commit after explicit user approval**

```bash
git add web/src/components/ui/glass-surface.tsx web/src/components/ui/glass-surface.module.css web/src/components/ui/GlassSurface.structure.test.mjs
git commit -m "feat: add liquid glass primitives"
```

---

## Task 2: Apply the approved Liquid Glass app shell

**Files:**

- Modify: `web/src/components/layout/AppShell.tsx`
- Modify: `web/src/components/layout/ProfileMenu.module.css`
- Modify: `web/src/app/globals.css`
- Create: `web/src/components/layout/AppShell.structure.test.mjs`

### Required behavior

- The landing route and auth routes keep their existing wrappers and styles.
- Authenticated routes receive `data-liquid-glass="true"`.
- Desktop uses the approved inset Glass sidebar.
- Mobile uses a single inset Glass app bar; it does not render a second blur layer behind the nav items.
- Wordmark, route order, active-route semantics, profile trigger, and product content remain present.

- [ ] **Step 1: Write the failing app-shell contract**

Create `web/src/components/layout/AppShell.structure.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appShellPath = new URL("./AppShell.tsx", import.meta.url);
const navigationPath = new URL("./Navigation.tsx", import.meta.url);
const globalsPath = new URL("../../app/globals.css", import.meta.url);

test("authenticated shell uses one Glass surface per navigation layer", async () => {
  const source = await readFile(appShellPath, "utf8");

  assert.match(source, /GlassSurface/);
  assert.match(source, /data-liquid-glass="true"/);
  assert.match(source, /as="aside"/);
  assert.match(source, /as="header"/);
  assert.match(source, /<Navigation \/>/);
  assert.match(source, /<Navigation variant="mobile" \/>/);
  assert.match(source, /<ProfileMenu \/>/);
  assert.match(source, /<ProfileMenu variant="mobile" \/>/);
  assert.match(source, /pathname === "\/"/);
  assert.match(source, /isAuthRoute/);
});

test("active navigation keeps route semantics and the shell is responsive", async () => {
  const [navigation, globals] = await Promise.all([
    readFile(navigationPath, "utf8"),
    readFile(globalsPath, "utf8"),
  ]);

  assert.match(navigation, /aria-current/);
  assert.match(navigation, /prefers-reduced-motion: reduce/);
  assert.match(globals, /\.product-shell\[data-liquid-glass="true"\]/);
  assert.match(globals, /#f5f5f7/i);
  assert.match(globals, /@media \(min-width: 861px\)/);
  assert.match(globals, /@media \(max-width: 860px\)/);
  assert.match(globals, /padding-top:\s*calc\([^;]*safe-area-top/);
  assert.doesNotMatch(globals, /\.product-shell\[data-liquid-glass="true"\][^{]*\{[^}]*#f8f7f3/is);
});
```

- [ ] **Step 2: Run the test and confirm RED**

```bash
cd web
node --test src/components/layout/AppShell.structure.test.mjs
```

Expected: FAIL because `AppShell` does not import `GlassSurface` and the scoped Liquid Glass rules do not exist.

- [ ] **Step 3: Wrap only the authenticated functional navigation layers**

Update the authenticated return path in `AppShell.tsx`:

```tsx
import { GlassSurface } from "@/components/ui/glass-surface";

// ...

return (
  <div
    className="app-shell product-shell"
    data-liquid-glass="true"
  >
    <Link href="/" className="app-brand" aria-label="CampusLog 홈">
      <span className="brand-name">CampusLog</span>
    </Link>

    <GlassSurface
      as="aside"
      className="app-sidebar"
      variant="regular"
      shape="rounded"
      elevation="bar"
      aria-label="CampusLog 주요 메뉴"
    >
      <Navigation />
      <ProfileMenu />
    </GlassSurface>

    <GlassSurface
      as="header"
      className="mobile-header"
      variant="regular"
      shape="rounded"
      elevation="bar"
    >
      <Link href="/" className="mobile-brand" aria-label="CampusLog 홈">
        <span className="brand-name">CampusLog</span>
      </Link>
      <Navigation variant="mobile" />
      <ProfileMenu variant="mobile" />
    </GlassSurface>

    <main className="app-main product-main">
      <div className="product-surface">{children}</div>
    </main>
  </div>
);
```

Do not change the `/`, `/login`, `/signup`, or `/onboarding` branches.

- [ ] **Step 4: Add scoped cool-neutral shell and responsive geometry**

Append one final, clearly labeled `CampusLog Liquid Glass foundation` section to `globals.css`. It must override older shell declarations only inside `.product-shell[data-liquid-glass="true"]`.

Implement these concrete layout values:

```css
.product-shell[data-liquid-glass="true"] {
  --liquid-app-background: #f5f5f7;
  --liquid-content-surface: #ffffff;
  --liquid-subtle-surface: #fafafa;
  --liquid-text-primary: #1d1d1f;
  --liquid-text-secondary: #6e6e73;
  --liquid-sidebar-width: 204px;
  min-height: 100svh;
  overflow-x: clip;
  background: var(--liquid-app-background);
  color: var(--liquid-text-primary);
}

.product-shell[data-liquid-glass="true"] .product-surface {
  background: transparent;
}

@media (min-width: 861px) {
  .product-shell[data-liquid-glass="true"] .app-brand {
    position: fixed;
    top: 42px;
    left: 42px;
    z-index: 31;
  }

  .product-shell[data-liquid-glass="true"] .app-sidebar {
    position: fixed;
    inset: 20px auto 20px 20px;
    z-index: 30;
    display: flex;
    width: var(--liquid-sidebar-width);
    min-height: 0;
    padding: 96px 14px 14px;
    overflow: visible;
    flex-direction: column;
  }

  .product-shell[data-liquid-glass="true"] .app-main {
    min-width: 0;
    margin-left: calc(var(--liquid-sidebar-width) + 40px);
  }

  .product-shell[data-liquid-glass="true"] .navigation-link {
    min-height: 48px;
    border-radius: 999px;
  }

  .product-shell[data-liquid-glass="true"] .navigation-link.is-active {
    border: 1px solid rgb(29 29 31 / 8%);
    background: rgb(255 255 255 / 72%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 80%),
      0 5px 16px rgb(0 0 0 / 6%);
  }
}

@media (min-width: 861px) and (max-width: 1179px) {
  .product-shell[data-liquid-glass="true"] {
    --liquid-sidebar-width: 188px;
  }

  .product-shell[data-liquid-glass="true"] .app-sidebar {
    inset: 14px auto 14px 14px;
  }

  .product-shell[data-liquid-glass="true"] .app-main {
    margin-left: calc(var(--liquid-sidebar-width) + 28px);
  }
}

@media (max-width: 860px) {
  .product-shell[data-liquid-glass="true"] {
    padding-top:
      calc(82px + max(10px, var(--safe-area-top)));
  }

  .product-shell[data-liquid-glass="true"] .app-sidebar,
  .product-shell[data-liquid-glass="true"] > .app-brand {
    display: none;
  }

  .product-shell[data-liquid-glass="true"] .mobile-header {
    position: fixed;
    top: max(10px, var(--safe-area-top));
    right: max(10px, var(--safe-area-right));
    left: max(10px, var(--safe-area-left));
    z-index: 40;
    display: grid;
    min-width: 0;
    min-height: 64px;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    padding: 8px;
  }

  .product-shell[data-liquid-glass="true"] .app-main {
    min-width: 0;
    margin-left: 0;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .product-shell[data-liquid-glass="true"] {
    background: #f5f5f7;
  }
}
```

If the current app-shell selectors require higher specificity, extend the scoped selectors instead of editing unrelated legacy blocks.

- [ ] **Step 5: Refine the profile trigger inside the approved sidebar**

Update `ProfileMenu.module.css` without changing `ProfileMenu.tsx` behavior:

- Desktop trigger: 48px minimum height, 18px radius, translucent white inner surface, neutral border, no warm colors.
- Mobile trigger: preserve 44px touch target and current accessible label.
- Profile dropdown remains handled by Task 3; do not add another backdrop blur to `.content`.
- Keep avatar image and initial fallback unchanged.

- [ ] **Step 6: Run focused checks**

```bash
cd web
node --test src/components/ui/GlassSurface.structure.test.mjs src/components/layout/AppShell.structure.test.mjs
npx tsc --noEmit
npm run lint
```

Expected: all commands PASS.

- [ ] **Step 7: Commit after explicit user approval**

```bash
git add web/src/components/layout/AppShell.tsx web/src/components/layout/ProfileMenu.module.css web/src/app/globals.css web/src/components/layout/AppShell.structure.test.mjs
git commit -m "style: apply liquid glass app shell"
```

---

## Task 3: Unify dropdowns, selects, and comboboxes as Glass popovers

**Files:**

- Modify: `web/src/components/ui/dropdown-menu.tsx`
- Modify: `web/src/components/ui/select.tsx`
- Modify: `web/src/components/ui/combobox.tsx`
- Modify: `web/src/components/layout/ProfileMenu.module.css`
- Modify: `web/src/app/globals.css`
- Create: `web/src/components/ui/GlassPopover.structure.test.mjs`

### Required behavior

- All popovers share one `glass-popover-surface` material class.
- Radix/Base UI portals and existing collision/positioning behavior remain intact.
- The popup receives one blur layer; individual items never receive `backdrop-filter`.
- Pointer hover, keyboard highlight, selected state, and disabled state remain distinguishable.
- Menu items have at least a 44px target on touch layouts.

- [ ] **Step 1: Write the failing shared-popover contract**

Create `web/src/components/ui/GlassPopover.structure.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const directory = new URL("./", import.meta.url);

test("all popup components use one Glass material surface", async () => {
  const [dropdown, select, combobox, globals] = await Promise.all([
    readFile(new URL("dropdown-menu.tsx", directory), "utf8"),
    readFile(new URL("select.tsx", directory), "utf8"),
    readFile(new URL("combobox.tsx", directory), "utf8"),
    readFile(new URL("../../app/globals.css", directory), "utf8"),
  ]);

  for (const source of [dropdown, select, combobox]) {
    assert.match(source, /glass-popover-surface/);
    assert.match(source, /Portal/);
  }

  assert.match(dropdown, /collisionPadding\s*=\s*12/);
  assert.match(select, /alignItemWithTrigger=\{false\}/);
  assert.match(combobox, /sideOffset=\{sideOffset\}/);
  assert.match(globals, /\.glass-popover-surface/);
  assert.match(globals, /min-height:\s*44px/);
});

test("Glass blur belongs to popup surfaces, not popup items", async () => {
  const globals = await readFile(
    new URL("../../app/globals.css", directory),
    "utf8",
  );

  assert.match(
    globals,
    /\.glass-popover-surface[^{]*\{[^}]*backdrop-filter/is,
  );
  assert.doesNotMatch(
    globals,
    /\.(?:select-item|combobox-item|dropdown-menu-item)[^{]*\{[^}]*backdrop-filter/is,
  );
});
```

- [ ] **Step 2: Run the test and confirm RED**

```bash
cd web
node --test src/components/ui/GlassPopover.structure.test.mjs
```

Expected: FAIL because the shared class is absent.

- [ ] **Step 3: Add the shared class without replacing portal libraries**

Apply these class changes:

```tsx
// dropdown-menu.tsx
className={cn(
  "glass-popover-surface z-[100] min-w-32 overflow-hidden p-1 outline-none",
  className,
)}

// select.tsx
className={cn("select-popup glass-popover-surface", className)}

// combobox.tsx
className={cn("combobox-popup glass-popover-surface", className)}
```

Keep `DropdownMenuPortal`, `collisionPadding`, Base UI `Portal`, `Positioner`, `sideOffset`, and `align` unchanged.

- [ ] **Step 4: Define one shared popover material**

In the scoped Liquid Glass section of `globals.css`, add:

```css
.glass-popover-surface {
  border: 1px solid rgb(29 29 31 / 12%);
  border-radius: 18px;
  background: rgb(255 255 255 / 76%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 82%),
    0 18px 48px rgb(0 0 0 / 14%);
  color: #1d1d1f;
  -webkit-backdrop-filter: blur(24px) saturate(1.18);
  backdrop-filter: blur(24px) saturate(1.18);
}

.glass-popover-surface :is(
  [role="menuitem"],
  [role="option"],
  .select-item,
  .combobox-item
) {
  min-height: 44px;
}

@supports not (
  (backdrop-filter: blur(1px)) or
  (-webkit-backdrop-filter: blur(1px))
) {
  .glass-popover-surface {
    background: rgb(255 255 255 / 96%);
  }
}

@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .glass-popover-surface {
    background: #ffffff;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@media (forced-colors: active) {
  .glass-popover-surface {
    border: 1px solid CanvasText;
    background: Canvas;
    box-shadow: none;
    color: CanvasText;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
```

Remove or override the old opaque white background and warm text/shadow declarations on `.select-popup`, `.combobox-popup`, and the default dropdown content. Keep their sizing, scroll, transform-origin, and open/close transition rules.

- [ ] **Step 5: Make ProfileMenu consume the same popup shell**

Keep `styles.content` for profile-specific width and spacing, but ensure it does not set a second background, shadow, or blur. The shared `DropdownMenuContent` supplies `glass-popover-surface`.

- [ ] **Step 6: Run focused checks**

```bash
cd web
node --test src/components/ui/GlassPopover.structure.test.mjs
npx tsc --noEmit
npm run lint
```

Expected: all commands PASS.

- [ ] **Step 7: Commit after explicit user approval**

```bash
git add web/src/components/ui/dropdown-menu.tsx web/src/components/ui/select.tsx web/src/components/ui/combobox.tsx web/src/components/layout/ProfileMenu.module.css web/src/app/globals.css web/src/components/ui/GlassPopover.structure.test.mjs
git commit -m "style: unify liquid glass popovers"
```

---

## Task 4: Refine FloatingPanel and ExpandableScreen as Glass overlays

**Files:**

- Modify: `web/src/components/ui/floating-panel.tsx`
- Modify: `web/src/components/ui/expandable-screen.tsx`
- Modify: `web/src/components/ui/expandable-screen.module.css`
- Modify: `web/src/app/globals.css`
- Create: `web/src/components/ui/GlassOverlay.structure.test.mjs`

### Required behavior

- Keep existing `visualViewport`, safe-area, focus trap, return-focus, inert, `aria-hidden`, Escape, and body-lock implementations.
- Keep FloatingPanel anchored/center/bottom placement.
- Keep ExpandableScreen trigger-origin morph.
- Apply Glass to the outer shell only. The scrolling content region remains opaque enough for reading and writing.
- Replace the warm `#f8f7f3` expansion color with cool-neutral `#f5f5f7`.

- [ ] **Step 1: Write the failing overlay preservation contract**

Create `web/src/components/ui/GlassOverlay.structure.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const directory = new URL("./", import.meta.url);

test("FloatingPanel keeps positioning and focus behavior while exposing Glass shell", async () => {
  const source = await readFile(
    new URL("floating-panel.tsx", directory),
    "utf8",
  );

  assert.match(source, /glass-overlay-surface/);
  assert.match(source, /window\.visualViewport/);
  assert.match(source, /--safe-area-top/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /setAttribute\("inert"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /returnFocus/);
  assert.match(source, /useReducedMotion/);
});

test("ExpandableScreen keeps morph behavior and uses cool-neutral outer material", async () => {
  const [source, styles] = await Promise.all([
    readFile(new URL("expandable-screen.tsx", directory), "utf8"),
    readFile(new URL("expandable-screen.module.css", directory), "utf8"),
  ]);

  assert.match(source, /EXPANDED_SCREEN_COLOR = "#f5f5f7"/i);
  assert.match(source, /getOriginGeometry/);
  assert.match(source, /visualViewport/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(styles, /backdrop-filter:\s*blur/);
  assert.match(styles, /background:\s*#fff(?:fff)?/i);
  assert.doesNotMatch(`${source}\n${styles}`, /#f8f7f3/i);
});
```

- [ ] **Step 2: Run the test and confirm RED**

```bash
cd web
node --test src/components/ui/GlassOverlay.structure.test.mjs
```

Expected: FAIL because FloatingPanel lacks `glass-overlay-surface` and ExpandableScreen still uses `#f8f7f3`.

- [ ] **Step 3: Add one Glass class to FloatingPanel**

Change only the panel shell class:

```tsx
className={cn(
  "floating-panel-content glass-overlay-surface",
  className,
)}
```

Do not move the portal, dialog role, labels, focus ref, position styles, or animation.

- [ ] **Step 4: Add modal-strength material while keeping content readable**

In `globals.css`, make `.glass-overlay-surface` the translucent outer shell:

```css
.glass-overlay-surface {
  border: 1px solid rgb(29 29 31 / 12%);
  background: rgb(255 255 255 / 84%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 88%),
    0 28px 80px rgb(0 0 0 / 18%);
  -webkit-backdrop-filter: blur(30px) saturate(1.14);
  backdrop-filter: blur(30px) saturate(1.14);
}

.glass-overlay-surface .floating-panel-body {
  background: #ffffff;
}
```

Retain the current header/body flex and scroll rules. Use the same no-filter, reduced-transparency, contrast, and forced-colors fallback pattern from Task 3.

- [ ] **Step 5: Convert ExpandableScreen’s outer layer and inner content**

In `expandable-screen.tsx`:

```ts
const EXPANDED_SCREEN_COLOR = "#f5f5f7";
```

In `expandable-screen.module.css`:

- `.backdrop`: neutral dimming, one restrained blur.
- `.surface`: cool-neutral translucent Glass outer shell, neutral border, specular inset edge, and modal shadow.
- `.dialog`: preserve 28px radius and clipping.
- `.content`: solid `#ffffff` reading surface.
- `.close`: translucent neutral control with at least 44px dimensions.
- Add `@supports not`, `prefers-reduced-transparency`, `prefers-contrast`, and `forced-colors` fallbacks.
- Preserve the current mobile safe-area offsets and reduced-motion rule.

- [ ] **Step 6: Run overlay regressions**

```bash
cd web
node --test src/components/ui/GlassOverlay.structure.test.mjs src/components/ui/MorphSurface.structure.test.mjs
npx tsc --noEmit
npm run lint
```

Expected: all commands PASS.

- [ ] **Step 7: Commit after explicit user approval**

```bash
git add web/src/components/ui/floating-panel.tsx web/src/components/ui/expandable-screen.tsx web/src/components/ui/expandable-screen.module.css web/src/app/globals.css web/src/components/ui/GlassOverlay.structure.test.mjs
git commit -m "style: refine liquid glass overlays"
```

---

## Task 5: Lock responsive behavior, accessibility fallbacks, and content preservation

**Files:**

- Modify: `web/src/app/globals.css`
- Create: `web/src/app/LiquidGlassFoundation.structure.test.mjs`
- Modify only if a verified regression requires it: existing page-level CSS selectors in `web/src/app/globals.css`

### Required behavior

- Desktop sidebar: `861px+`.
- Compact desktop: `861–1179px`.
- Mobile app bar: `360–860px`.
- No horizontal overflow at 1440px, 1024px, 861px, 860px, 390px, or 360px.
- Content cards and form surfaces remain solid.
- Reduced transparency, increased contrast, reduced motion, forced colors, and unsupported backdrop-filter all have useful fallbacks.
- Landing and auth shells do not inherit the product Glass background.

- [ ] **Step 1: Write the failing foundation contract**

Create `web/src/app/LiquidGlassFoundation.structure.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const globalsPath = new URL("./globals.css", import.meta.url);

test("Liquid Glass stays scoped to authenticated product routes", async () => {
  const styles = await readFile(globalsPath, "utf8");

  assert.match(styles, /\.product-shell\[data-liquid-glass="true"\]/);
  assert.match(styles, /--liquid-app-background:\s*#f5f5f7/i);
  assert.match(styles, /--liquid-content-surface:\s*#fff(?:fff)?/i);
  assert.match(styles, /\.product-shell\[data-liquid-glass="true"\][^{]*\.form-panel[^}]*background:\s*(?:#fff(?:fff)?|var\(--liquid-content-surface\))/is);
  assert.doesNotMatch(styles, /\.auth-shell\[data-liquid-glass/);
  assert.doesNotMatch(styles, /\.cover-main\[data-liquid-glass/);
});

test("Liquid Glass has explicit responsive and preference fallbacks", async () => {
  const styles = await readFile(globalsPath, "utf8");

  assert.match(styles, /@media \(min-width: 861px\)/);
  assert.match(styles, /@media \(max-width: 860px\)/);
  assert.match(styles, /overflow-x:\s*clip/);
  assert.match(styles, /prefers-reduced-transparency:\s*reduce/);
  assert.match(styles, /prefers-contrast:\s*more/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /forced-colors:\s*active/);
  assert.match(styles, /@supports not/);
});
```

- [ ] **Step 2: Run the test and confirm RED**

```bash
cd web
node --test src/app/LiquidGlassFoundation.structure.test.mjs
```

Expected: FAIL until the final scoped solid-surface and preference contracts exist.

- [ ] **Step 3: Add the final product-surface protections**

In the final scoped section of `globals.css`, explicitly keep content surfaces solid:

```css
.product-shell[data-liquid-glass="true"] :is(
  .form-panel,
  .detail-panel,
  .placeholder-panel,
  .empty-state,
  .alert-panel,
  .dashboard-ongoing-card,
  .dashboard-calendar,
  .dashboard-daily-log,
  .recommendation-image-preview
) {
  background: var(--liquid-content-surface);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
```

Before committing this selector list, use `rg` to confirm every class exists. Remove nonexistent selectors instead of inventing class names, and add the actual equivalent class only where the rendered screen needs protection.

Add these shared guarantees:

```css
.product-shell[data-liquid-glass="true"],
.product-shell[data-liquid-glass="true"] * {
  box-sizing: border-box;
}

.product-shell[data-liquid-glass="true"] :is(
  .app-main,
  .product-main,
  .product-surface
) {
  min-width: 0;
  max-width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .product-shell[data-liquid-glass="true"] *,
  .product-shell[data-liquid-glass="true"] *::before,
  .product-shell[data-liquid-glass="true"] *::after {
    scroll-behavior: auto;
  }
}
```

Do not use a blanket animation reset that would remove loading or state communication. Existing component-level reduced-motion handling remains authoritative.

- [ ] **Step 4: Run all source-structure tests**

```bash
cd web
node --test \
  src/components/ui/GlassSurface.structure.test.mjs \
  src/components/layout/AppShell.structure.test.mjs \
  src/components/ui/GlassPopover.structure.test.mjs \
  src/components/ui/GlassOverlay.structure.test.mjs \
  src/app/LiquidGlassFoundation.structure.test.mjs
```

Expected: PASS with five test files and no skipped tests.

- [ ] **Step 5: Run static and production verification**

```bash
cd web
npm run lint
npx tsc --noEmit
npm run build
cd ..
git diff --check
```

Expected: all commands exit 0. Record existing dependency or framework warnings separately; do not claim they were fixed.

- [ ] **Step 6: Commit after explicit user approval**

```bash
git add web/src/app/globals.css web/src/app/LiquidGlassFoundation.structure.test.mjs
git commit -m "test: verify liquid glass responsiveness"
```

---

## Task 6: Perform browser comparison and correct visible regressions

**Files:**

- Modify only when the comparison proves a mismatch:
  - `web/src/app/globals.css`
  - `web/src/components/ui/glass-surface.module.css`
  - `web/src/components/layout/ProfileMenu.module.css`
  - `web/src/components/ui/expandable-screen.module.css`
  - The Task 1–5 structure tests that express the corrected contract
- Update: `design-qa.md`

### Comparison sources

- Approved mock: `.superpowers/brainstorm/6030-1785025676/content/liquid-glass-refined-dashboard.html`
- Implemented routes:
  - `/dashboard`
  - `/experiences`
  - `/recommend`

- [ ] **Step 1: Start the existing app in the approved local preview mode**

Use the repository’s existing environment and current local data. Do not create a new app or starter.

```bash
cd web
npm run dev
```

Expected: Next.js reports a local URL and authenticated product routes render through the existing preview/login setup.

- [ ] **Step 2: Compare the approved mock and dashboard at the same viewport**

Using the user’s in-app browser:

1. Capture the approved mock at `1440×900`.
2. Capture `/dashboard` at `1440×900`.
3. Place both captures in one visual comparison input.
4. Check:
   - cool-neutral background rather than warm white;
   - inset sidebar geometry and 28–30px curvature;
   - active capsule prominence;
   - wordmark, nav order, and profile preservation;
   - readable solid content cards;
   - no decorative background blobs;
   - optical alignment, border radius, padding, text weight, border, and shadow quality.
5. Fix visible mismatches and repeat the same-viewport comparison.

Screenshots alone are not completion evidence; the side-by-side comparison and resulting corrections must be recorded in `design-qa.md`.

- [ ] **Step 3: Verify responsive shell and route preservation**

Check these viewport/route pairs:

| Viewport | Routes | Required checks |
| --- | --- | --- |
| `1440×900` | dashboard, experiences, recommend | inset sidebar, content frame, menus, no content deletion |
| `1024×800` | dashboard, experiences, recommend | compact sidebar, no overlap, panel collision |
| `861×800` | dashboard, recommend | final desktop breakpoint, no horizontal clipping |
| `860×800` | dashboard, recommend | mobile app bar replaces sidebar exactly once |
| `390×844` | dashboard, experiences, recommend | safe-area inset, 44px controls, vertical content, no overflow |
| `360×800` | dashboard, recommend | narrow mobile labels, profile trigger, gallery/form survival |

For every viewport:

```js
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

Expected: `true`.

- [ ] **Step 4: Verify interaction and accessibility states**

In the in-app browser, verify:

- Tab order reaches mobile/desktop navigation and the profile trigger.
- `aria-current` follows the route.
- Profile dropdown opens beside its trigger, receives visible keyboard highlight, closes with Escape, and restores focus.
- One Select and one Combobox popup render inside viewport bounds.
- A FloatingPanel opens, traps focus, closes with Escape, and returns focus.
- An ExpandableScreen opens from its trigger, preserves the morph when motion is allowed, closes, and restores focus.
- Reduced-motion emulation removes scale/translation without hiding state changes.
- Reduced-transparency or a temporary CSS emulation produces opaque, readable surfaces.
- Browser console contains no new warning or error caused by this work.

- [ ] **Step 5: Re-run the full verification after visual corrections**

```bash
cd web
node --test \
  src/components/ui/GlassSurface.structure.test.mjs \
  src/components/layout/AppShell.structure.test.mjs \
  src/components/ui/GlassPopover.structure.test.mjs \
  src/components/ui/GlassOverlay.structure.test.mjs \
  src/app/LiquidGlassFoundation.structure.test.mjs
npm run lint
npx tsc --noEmit
npm run build
cd ..
git diff --check
```

Expected: all commands PASS.

- [ ] **Step 6: Commit visual corrections after explicit user approval**

Stage only files actually changed during comparison:

```bash
git add design-qa.md web/src/app/globals.css web/src/components/ui/glass-surface.module.css web/src/components/layout/ProfileMenu.module.css web/src/components/ui/expandable-screen.module.css
git commit -m "style: polish liquid glass presentation"
```

If some listed files were unchanged, omit them from `git add`.

---

## Task 7: Update active product and work-log documentation

**Files:**

- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/CURRENT_PHASE.md` only if the active Track or phase status actually changes
- Modify: `docs/TODO.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `docs/ISSUE_LOG.md`

### Required documentation truthfulness

- Record only implemented and verified behavior.
- Do not mark browser, reduced-transparency, mobile, or build verification complete unless it was actually performed.
- Do not restate the full design spec in every active document.
- Preserve Track A ownership and existing unresolved AI/data issues.

- [ ] **Step 1: Update the design and screen contracts**

In `docs/DESIGN.md`, add the implemented cool-neutral token values, Glass functional-layer rule, solid content-surface rule, responsive breakpoints, and accessibility fallbacks.

In `docs/SCREEN_SPEC.md`, update only the shared authenticated app shell, navigation, popover, and overlay presentation. Keep page inputs, outputs, button behavior, and API states unchanged.

- [ ] **Step 2: Update progress records with actual results**

- `docs/TODO.md`: mark the Liquid Glass foundation items complete or partial based on the verification results; list remaining page-specific refinement separately.
- `docs/WORK_STATUS.md`: update current Track B status and next work only if project progress changed.
- `docs/TASK_LOG.md`: list changed files, reason, commands, browser viewports, and exact pass/fail results.
- `docs/ISSUE_LOG.md`: record the approved cool-neutral decision, functional-layer-only Glass constraint, and any deferred browser/performance risk.
- `docs/CURRENT_PHASE.md`: leave unchanged unless the active phase or Track status truly changed.

- [ ] **Step 3: Verify documentation consistency**

Run:

```bash
rg -n "warm white|웜화이트|Liquid Glass|리퀴드 글래스|861|860" \
  docs/DESIGN.md \
  docs/SCREEN_SPEC.md \
  docs/CURRENT_PHASE.md \
  docs/TODO.md \
  docs/WORK_STATUS.md \
  docs/TASK_LOG.md \
  docs/ISSUE_LOG.md
git diff --check
```

Expected: one current direction, no contradictory active requirement, and no whitespace errors.

- [ ] **Step 4: Run the final repository verification**

```bash
cd web
npm run lint
npx tsc --noEmit
npm run build
cd ..
git status --short
git diff --stat
git diff --check
```

Expected:

- lint, typecheck, build, and diff check exit 0;
- only intended Track B source, tests, docs, and the pre-existing untracked `.superpowers/` appear;
- no `.env`, user data, API key, token, schema, API route, repository, or migration file is changed.

- [ ] **Step 5: Commit documentation after explicit user approval**

```bash
git add docs/DESIGN.md docs/SCREEN_SPEC.md docs/TODO.md docs/WORK_STATUS.md docs/TASK_LOG.md docs/ISSUE_LOG.md
git add docs/CURRENT_PHASE.md
git commit -m "docs: record liquid glass foundation"
```

Only add `docs/CURRENT_PHASE.md` if it actually changed. If the user does not approve commits, report the recommended message without committing.

---

## Final Acceptance Checklist

- [ ] Existing routes, page sections, wording, and core controls remain present.
- [ ] Desktop uses the approved inset Liquid Glass sidebar.
- [ ] Mobile uses one responsive Liquid Glass app bar.
- [ ] Background is cool `#F5F5F7`; content surfaces are white; no warm-white or decorative backdrop remains in the authenticated shell.
- [ ] Dropdown, Select, Combobox, ProfileMenu, FloatingPanel, and ExpandableScreen share a coherent functional material hierarchy.
- [ ] No nested backdrop blur is applied to content cards or popup items.
- [ ] 1440, 1024, 861, 860, 390, and 360 widths have no horizontal overflow.
- [ ] Keyboard, focus return, Escape, safe-area, and `visualViewport` behavior still work.
- [ ] Reduced motion, reduced transparency, increased contrast, forced colors, and unsupported blur have readable fallbacks.
- [ ] Approved mock and implementation were compared together at the same viewport and visible mismatches were corrected.
- [ ] Structure tests, lint, typecheck, build, and `git diff --check` pass.
- [ ] Active docs describe only the behavior actually implemented and verified.
- [ ] No Track A contract or sensitive configuration changed.
