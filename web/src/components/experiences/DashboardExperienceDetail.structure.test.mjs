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
  const actionsStart = detailSource.indexOf(
    '<div className="dashboard-detail-actions">',
  );
  const inlineBranchStart = detailSource.indexOf(") : (", actionsStart);
  const inlineBranchEnd = detailSource.indexOf("</div>", inlineBranchStart);
  const inlineBranch = detailSource.slice(inlineBranchStart, inlineBranchEnd);

  assert.notEqual(actionsStart, -1, "상세 액션 영역을 찾을 수 없습니다.");
  assert.notEqual(
    inlineBranchStart,
    -1,
    "인라인 상세 액션 분기를 찾을 수 없습니다.",
  );
  assert.match(inlineBranch, /dashboard-detail-delete/);
  assert.match(inlineBranch, /<Trash2/);
  assert.match(inlineBranch, /삭제/);
  assert.ok(
    inlineBranch.indexOf("{editAction}") <
      inlineBranch.indexOf("dashboard-detail-delete"),
    "삭제 액션은 수정 다음에 표시되어야 합니다.",
  );
  assert.ok(
    inlineBranch.indexOf("dashboard-detail-delete") <
      inlineBranch.indexOf("{analysisAction}"),
    "삭제 액션은 AI 분석 액션보다 먼저 표시되어야 합니다.",
  );
  assert.match(dashboardSource, /onDelete=\{\(\) =>/);
  assert.match(
    dashboardSource,
    /handleDeleteExperience\(selectedExperience\)/,
  );
});

test("분석 스플릿뷰가 열리면 왼쪽 상세는 중복 로딩 오버레이를 만들지 않는다", () => {
  assert.match(detailSource, /\{isAnalyzing && !isAnalysisOpen \? \(/);
  assert.match(detailSource, /\{analysisError && !isAnalysisOpen \? \(/);
});
