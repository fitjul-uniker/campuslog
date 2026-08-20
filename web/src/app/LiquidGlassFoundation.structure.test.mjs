import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const globalsPath = new URL("./globals.css", import.meta.url);

test("Liquid Glass covers product, authentication, and cover routes", async () => {
  const styles = await readFile(globalsPath, "utf8");

  assert.match(styles, /\.product-shell\[data-liquid-glass="true"\]/);
  assert.match(styles, /--liquid-app-background:\s*#eef1f6/i);
  assert.match(styles, /--liquid-content-surface:\s*#fff(?:fff)?/i);
  assert.match(
    styles,
    /\.product-shell\[data-liquid-glass="true"\][^{]*\.liquid-workspace\s*\{/is,
  );
  assert.match(styles, /\.liquid-content-plate/);
  assert.match(styles, /\.liquid-control-group/);
  assert.match(styles, /\.liquid-capsule/);
  assert.match(styles, /\.liquid-prominent-action/);
  assert.match(
    styles,
    /:is\(\s*\.auth-shell,\s*\.cover-main\s*\)\[data-liquid-glass="true"\]/,
  );
  assert.match(styles, /--liquid-hover-fill:\s*rgb\(56 63 74 \/ 6%\)/i);
  assert.match(styles, /--color-surface-muted:\s*#eef1f5/i);
  assert.match(
    styles,
    /--liquid-frosted-fill:\s*rgb\(255 255 255 \/ 64%\)/i,
  );
  assert.match(
    styles,
    /Cool-neutral Liquid Glass unification — all CampusLog routes/,
  );
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

test("compact desktop preserves dashboard control width beside the sidebar", async () => {
  const styles = await readFile(globalsPath, "utf8");

  assert.match(
    styles,
    /@media \(min-width: 861px\) and \(max-width: 1179px\)[\s\S]*?\.product-shell\[data-liquid-glass="true"\][^{]*\.activity-dashboard-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/i,
  );
});

test("authenticated pages reveal the cool canvas and keep glass search controls legible", async () => {
  const styles = await readFile(globalsPath, "utf8");

  assert.match(
    styles,
    /\.product-shell\[data-liquid-glass="true"\]\s+\.product-surface\s+:is\(\.primary-page,\s*\.sub-page\)\s*\{[^}]*background:\s*transparent/is,
  );
  assert.match(
    styles,
    /\.gooey-input\.liquid-capsule[\s\S]{0,180}\.gooey-input-trigger,\s*\.product-shell\[data-liquid-glass="true"\][\s\S]{0,180}\.gooey-input-surface input\s*\{[^}]*color:\s*var\(--liquid-text-primary\)/is,
  );
  assert.match(
    styles,
    /\.gooey-input\.liquid-capsule[\s\S]{0,220}\.gooey-input-surface\s+input::placeholder\s*\{[^}]*color:\s*var\(--liquid-text-secondary\)/is,
  );
  assert.match(
    styles,
    /\.gooey-input\.liquid-capsule[\s\S]{0,180}\.gooey-input-filter-wrap\s*\{[^}]*filter:\s*none\s*!important/is,
  );
});

test("desktop primary and sub pages share one breadcrumb navigation rail", async () => {
  const styles = await readFile(globalsPath, "utf8");

  assert.match(
    styles,
    /@media \(min-width: 861px\)[\s\S]*?\.product-shell\[data-liquid-glass="true"\][\s\S]*?\.product-surface[\s\S]*?:is\(\.primary-page,\s*\.sub-page\)\s*\{[^}]*--primary-page-gutter:\s*clamp\(24px,\s*3\.2vw,\s*48px\)[^}]*--sub-page-gutter:\s*clamp\(24px,\s*3\.2vw,\s*48px\)[^}]*width:\s*min\(100%,\s*1200px\)[^}]*max-width:\s*1200px/is,
  );
});

test("authenticated page workspaces share one top-left anchor", async () => {
  const styles = await readFile(globalsPath, "utf8");

  assert.match(
    styles,
    /\.product-surface\s+:is\(\.primary-page,\s*\.sub-page\)\s*\{[^}]*--product-page-heading-min-height:\s*78px[^}]*--product-workspace-gap:\s*30px/is,
  );
  assert.match(
    styles,
    /\.product-surface\s+\.primary-page-heading\s*\{[^}]*min-height:\s*var\(--product-page-heading-min-height\)[^}]*margin-bottom:\s*var\(--product-workspace-gap\)/is,
  );
  assert.match(
    styles,
    /\.product-surface\s+\.recommendation-page\s*\{[^}]*gap:\s*var\(--product-workspace-gap\)/is,
  );
  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*?\.product-surface\s+:is\(\.primary-page,\s*\.sub-page\)\s*\{[^}]*--product-page-heading-min-height:\s*99px/is,
  );
  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*?\.product-surface\s+\.recommendation-history-page\.sub-page\s*\{[^}]*--sub-page-gutter:\s*16px/is,
  );
});

test("authenticated routes reserve one root scrollbar width", async () => {
  const styles = await readFile(globalsPath, "utf8");

  assert.match(
    styles,
    /html:has\(\.product-shell\[data-liquid-glass="true"\]\)\s*\{[^}]*scrollbar-width:\s*thin/is,
  );
  assert.match(
    styles,
    /html:has\(\.product-shell\[data-liquid-glass="true"\]\)::\-webkit-scrollbar\s*\{[^}]*width:\s*8px/is,
  );
  assert.doesNotMatch(
    styles,
    /html:has\(\.dashboard-experience-page\)::\-webkit-scrollbar\s*\{[^}]*width:/is,
  );
});
