import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./ExperienceDashboard.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("나의 활동 페이지 제목은 목록 Glass 밖에 있고 목록은 전체 활동 H2로 시작한다", () => {
  const pageHeaderStart = source.indexOf(
    '<header className="dashboard-experience-heading primary-page-heading">',
  );
  const workspaceStart = source.indexOf(
    'className="dashboard-experience-workspace"',
  );
  const listPaneStart = source.indexOf(
    'className="dashboard-experience-list-pane liquid-workspace"',
  );
  const sectionHeadingStart = source.indexOf(
    '<header className="dashboard-experience-section-heading">',
  );

  assert.ok(pageHeaderStart > -1);
  assert.ok(workspaceStart > pageHeaderStart);
  assert.ok(listPaneStart > workspaceStart);
  assert.ok(sectionHeadingStart > listPaneStart);
  assert.match(
    source.slice(pageHeaderStart, workspaceStart),
    /<h1 id="dashboard-experience-heading">나의 활동<\/h1>[\s\S]*primary-page-description/,
  );
  assert.match(
    source.slice(sectionHeadingStart),
    /<h2 id="dashboard-experience-list-heading">전체 활동<\/h2>/,
  );
  assert.match(
    source,
    /aria-labelledby="dashboard-experience-list-heading"/,
  );
});

test("목록과 상세는 다른 주요 탭과 같은 frosted 외곽 표면을 사용한다", () => {
  assert.match(
    styles,
    /\.dashboard-experience-list-pane\.liquid-workspace\s*\{[^}]*background:\s*var\(--liquid-frosted-fill\)/,
  );
  assert.match(
    styles,
    /\.dashboard-experience-detail\.liquid-section\s*\{[^}]*background:\s*var\(--liquid-frosted-fill\)/,
  );
});

test("나의 활동 검색은 기존 차콜 Gooey morph를 유지한다", () => {
  assert.match(source, /className="dashboard-experience-search"/);
  assert.doesNotMatch(
    source,
    /className="dashboard-experience-search liquid-capsule"/,
  );
  assert.match(
    styles,
    /\.gooey-input-trigger,\s*\.gooey-input-surface,\s*\.gooey-input-bubble\s*\{[^}]*background:\s*#1d1d1f[^}]*color:\s*#ffffff/,
  );
});
