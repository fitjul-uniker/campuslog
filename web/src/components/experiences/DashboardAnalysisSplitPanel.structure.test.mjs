import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./DashboardAnalysisSplitPanel.tsx", import.meta.url),
  "utf8",
);

test("분석 스플릿뷰 하단에 독립 분석 상세 링크를 제공한다", () => {
  assert.match(
    source,
    /href=\{`\/experiences\/\$\{experience\.id\}\/analysis`\}/,
  );
  assert.match(source, /분석 상세 보기\s*<ArrowRight/);
  assert.match(
    source,
    /분석 상세 보기[\s\S]*?AnimatedGradientActionButton[\s\S]*?다시 분석하기/,
  );
});
