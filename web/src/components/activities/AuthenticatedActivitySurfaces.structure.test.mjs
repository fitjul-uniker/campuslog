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
    /@media \(forced-colors: active\)[\s\S]*\.activity-edit-section\.liquid-workspace/,
  );
});
