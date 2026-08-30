import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appShellPath = new URL("./AppShell.tsx", import.meta.url);
const navigationPath = new URL("./Navigation.tsx", import.meta.url);
const routeTransitionPath = new URL(
  "./RouteTransitionProvider.tsx",
  import.meta.url,
);
const globalsPath = new URL("../../app/globals.css", import.meta.url);

test("authenticated shell uses one Glass surface per navigation layer", async () => {
  const source = await readFile(appShellPath, "utf8");

  assert.match(source, /GlassSurface/);
  assert.match(source, /data-liquid-glass="true"/);
  assert.match(source, /as="aside"/);
  assert.match(source, /as="header"/);
  assert.match(source, /<Navigation \/>/);
  assert.match(source, /<Navigation variant="mobile" \/>/);
  assert.match(source, /<RouteTransitionProvider>/);
  assert.match(source, /<ProfileMenu \/>/);
  assert.match(source, /<ProfileMenu variant="mobile" \/>/);
  assert.match(source, /usePageTransientScrollbar\(\)/);
  assert.match(source, /function handleProductBrandNavigation/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /window\.location\.assign\("\/"\)/);
  assert.equal(
    source.match(/onClick=\{handleProductBrandNavigation\}/g)?.length,
    2,
  );
  assert.match(source, /pathname === "\/"/);
  assert.match(source, /isAuthRoute/);
  assert.match(
    source,
    /<main className="cover-main" data-liquid-glass="true">/,
  );
  assert.match(
    source,
    /<div className="auth-shell" data-liquid-glass="true">/,
  );
});

test("active navigation keeps route semantics and the shell is responsive", async () => {
  const [navigation, routeTransition, globals] = await Promise.all([
    readFile(navigationPath, "utf8"),
    readFile(routeTransitionPath, "utf8"),
    readFile(globalsPath, "utf8"),
  ]);

  assert.match(navigation, /aria-current/);
  assert.match(navigation, /pendingHref/);
  assert.match(navigation, /setPendingHref\(item\.href\)/);
  assert.match(navigation, /startRouteTransition\(item\.href\)/);
  assert.match(routeTransition, /pendingPathname/);
  assert.match(routeTransition, /setPendingPathname\(null\)/);
  assert.match(navigation, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(navigation, /mobileLabel/);
  assert.doesNotMatch(navigation, /mobileMark/);
  assert.match(
    navigation,
    /label: "오늘의 기록"[\s\S]*label: "나의 활동"[\s\S]*label: "CampusLog AI"/,
  );
  assert.match(
    navigation,
    /aria-label=\{item\.href === "\/recommend" \? item\.label : undefined\}/,
  );
  assert.match(
    navigation,
    /item\.href === "\/recommend" && "is-campuslog-ai"[\s\S]*item\.href === "\/recommend" \?[\s\S]*navigation-campuslog-brand[\s\S]*CampusLog[\s\S]*<span>AI<\/span>/,
  );
  assert.match(
    globals,
    /\.navigation-campuslog-brand\s*\{[^}]*font-family:\s*var\(--font-serif\);[^}]*font-weight:\s*800;/,
  );
  assert.match(globals, /\.product-shell\[data-liquid-glass="true"\]/);
  assert.match(globals, /#eef1f6/i);
  assert.match(globals, /@media \(min-width: 861px\)/);
  assert.match(globals, /@media \(max-width: 860px\)/);
  assert.match(globals, /padding-top:\s*calc\([^;]*safe-area-top/);
  assert.doesNotMatch(
    globals,
    /html\s*\{[^}]*scroll-behavior:\s*smooth/is,
  );
  assert.doesNotMatch(
    globals,
    /\.product-shell\[data-liquid-glass="true"\][^{]*\{[^}]*#f8f7f3/is,
  );
});

test("desktop wordmark shares the widened liquid sidebar geometry", async () => {
  const globals = await readFile(globalsPath, "utf8");
  const liquidFoundation = globals.slice(
    globals.indexOf("/* CampusLog Liquid Glass foundation */"),
  );

  assert.match(liquidFoundation, /--liquid-sidebar-width:\s*224px/);
  assert.match(
    liquidFoundation,
    /@media \(min-width: 861px\)[\s\S]*?\.product-shell\[data-liquid-glass="true"\] \.app-brand\s*\{[^}]*left:\s*20px;[^}]*display:\s*flex;[^}]*width:\s*var\(--liquid-sidebar-width\);[^}]*justify-content:\s*center;[^}]*text-align:\s*center;/i,
  );
  assert.match(
    liquidFoundation,
    /@media \(min-width: 861px\) and \(max-width: 1179px\)[\s\S]*?--liquid-sidebar-width:\s*200px;[\s\S]*?\.product-shell\[data-liquid-glass="true"\] \.app-brand\s*\{[^}]*left:\s*14px;/i,
  );
  assert.match(
    liquidFoundation,
    /@media \(max-width: 860px\)[\s\S]*?\.product-shell\[data-liquid-glass="true"\] > \.app-brand\s*\{[^}]*display:\s*none;/i,
  );
});
