import assert from "node:assert/strict";
import test from "node:test";

import { getActiveActivityItemPresentation } from "./activeActivityItemPresentation.ts";

test("진행 활동 Item은 상세 경로와 접근 가능한 메뉴 라벨을 제공한다", () => {
  const presentation = getActiveActivityItemPresentation({
    id: "activity-42",
    title: "교내 서비스 기획 프로젝트",
  });

  assert.deepEqual(presentation, {
    href: "/activities/activity-42",
    title: "교내 서비스 기획 프로젝트",
    openLabel: "교내 서비스 기획 프로젝트 활동 상세 보기",
    menuLabel: "교내 서비스 기획 프로젝트 활동 메뉴",
    deleteLabel: "교내 서비스 기획 프로젝트 활동 삭제",
  });
});
