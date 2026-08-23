import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const detailSource = await readFile(
  new URL("./ActivityDetailClient.tsx", import.meta.url),
  "utf8",
);
const formSource = await readFile(
  new URL("./ActivityCreateForm.tsx", import.meta.url),
  "utf8",
);
const screenSource = await readFile(
  new URL("./ActivityCreateScreen.tsx", import.meta.url),
  "utf8",
);
const newActivitySource = await readFile(
  new URL("./NewActivityClient.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("활동 작성 화면은 폼과 워크스페이스의 Liquid Glass 역할을 구분한다", () => {
  assert.match(formSource, /activity-create-form liquid-form/);
  assert.match(
    screenSource,
    /activity-create-expanded-card liquid-workspace/,
  );
  assert.match(newActivitySource, /activity-form-surface liquid-workspace/);
});

test("활동 상세의 요약, 편집, AI 초안과 타임라인은 목적별 Glass 계층을 사용한다", () => {
  assert.match(
    detailSource,
    /activity-detail-primary-actions liquid-control-group/,
  );
  assert.match(detailSource, /activity-detail-meta liquid-content-plate/);
  assert.match(detailSource, /activity-edit-section liquid-workspace/);
  assert.match(detailSource, /activity-synthesis-draft liquid-workspace/);
  assert.match(detailSource, /activity-timeline liquid-section/);
  assert.match(detailSource, /activity-detail-description/);
  assert.doesNotMatch(detailSource, /activity-detail-heading>[\s\S]*?<p>/);
  assert.match(styles, /\.activity-detail-description\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1/);
  assert.match(
    styles,
    /\.activity-detail-meta\.liquid-content-plate[\s\S]*?\.activity-detail-description\s*\{[\s\S]*?border-bottom:/,
  );
});

test("활동 상세는 활동 현황과 같은 색상 상태 capsule을 사용한다", () => {
  assert.match(detailSource, /getTrackedActivityWorkflowState\(activity\)/);
  assert.match(
    detailSource,
    /className="activity-workflow-status"[\s\S]*?data-status=\{detailStatus\}/,
  );
  assert.match(
    styles,
    /\.activity-workflow-status\[data-status="active"\][\s\S]*?background:\s*#e4f7eb[\s\S]*?color:\s*#126a3b/,
  );
  assert.match(
    styles,
    /\.activity-workflow-status:is\([\s\S]*?completion_required[\s\S]*?background:\s*#fde9e7[\s\S]*?color:\s*#91352f/,
  );
});

test("AI 활동 정리 초안은 중복 가로선과 주요 성과 보조 문구를 표시하지 않는다", () => {
  const draftHeader =
    styles.match(/\.activity-synthesis-draft > header \{([\s\S]*?)\}/)?.[1] ?? "";
  const draftMeta =
    styles.match(
      /\.product-shell\[data-liquid-glass="true"\][\s\S]*?\.activity-synthesis-draft[\s\S]*?\.activity-draft-fixed-meta \{([\s\S]*?)\}/,
    )?.[1] ?? "";

  assert.doesNotMatch(draftHeader, /border-bottom/);
  assert.doesNotMatch(draftMeta, /border-block/);
  assert.doesNotMatch(
    detailSource,
    /한 줄에 하나씩 입력합니다\. 성과가 확인되지 않으면 비워도 됩니다\./,
  );
});

test("활동 상세 초기 로딩은 이전 카드형 shimmer 대신 접근성 안내만 제공한다", () => {
  assert.match(detailSource, /<LoadingState message="진행 활동을 불러오는 중입니다\." \/>/);
  assert.doesNotMatch(detailSource, /activity-page-loading/);
  assert.doesNotMatch(styles, /\.activity-page-loading/);
  assert.doesNotMatch(styles, /@keyframes activity-loading/);
});

test("활동 상세와 작성 Glass 계층은 좁은 화면과 강제 색상 대체 스타일을 가진다", () => {
  assert.match(
    styles,
    /\.activity-create-expanded-card\.liquid-workspace[\s\S]*backdrop-filter/,
  );
  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*\.activity-detail-meta\.liquid-content-plate/,
  );
  assert.match(
    styles,
    /@media \(min-width: 861px\)[\s\S]*?\.activity-detail-primary-actions\s*\{[^}]*flex-wrap:\s*nowrap/,
  );
  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*?\.activity-detail-primary-actions\s*\{[^}]*flex-wrap:\s*wrap/,
  );
  assert.match(
    styles,
    /@media \(forced-colors: active\)[\s\S]*\.activity-edit-section\.liquid-workspace/,
  );
});
