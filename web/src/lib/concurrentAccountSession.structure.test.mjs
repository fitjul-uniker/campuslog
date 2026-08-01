import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const browserClientSource = await readFile(
  new URL("./supabase/browser.ts", import.meta.url),
  "utf8",
);
const authActionsSource = await readFile(
  new URL("./auth/actions.ts", import.meta.url),
  "utf8",
);
const repositorySource = await readFile(
  new URL("./repositories/campuslogRepository.ts", import.meta.url),
  "utf8",
);
const workflowSource = await readFile(
  new URL("./experienceAnalysisWorkflow.ts", import.meta.url),
  "utf8",
);
const editExperienceSource = await readFile(
  new URL("../components/experiences/EditExperienceClient.tsx", import.meta.url),
  "utf8",
);

test("브라우저 인증 클라이언트는 명시적으로 싱글턴을 사용한다", () => {
  assert.match(browserClientSource, /isSingleton:\s*true/);
});

test("로그아웃은 현재 세션만 종료해 같은 계정의 다른 기기를 유지한다", () => {
  assert.match(authActionsSource, /signOut\(\{\s*scope:\s*"local"\s*\}\)/);
});

test("동시 AI 분석 결과는 경험별 unique key로 원자적 upsert한다", () => {
  assert.match(repositorySource, /\.upsert\(analysisPayload/);
  assert.match(
    repositorySource,
    /onConflict:\s*"user_id,experience_id"/,
  );
});

test("분석 직전에 최신 저장 경험과 보완 답변을 다시 조회한다", () => {
  assert.match(
    workflowSource,
    /Promise\.all\(\[\s*repository\.experiences\.getById\(experienceId\),\s*repository\.experienceFollowups\.listByExperienceId\(experienceId\)/s,
  );
  assert.match(
    workflowSource,
    /repository\.analyses\.save\(\s*response\.analysis,\s*experience/s,
  );
});

test("경험 수정은 기존 updatedAt을 조건으로 전달해 덮어쓰기를 막는다", () => {
  assert.match(
    editExperienceSource,
    /repository\.experiences\.update\(id, input, experience\.updatedAt\)/,
  );
  assert.match(repositorySource, /\.eq\("updated_at", expectedUpdatedAt\)/);
  assert.match(repositorySource, /\.eq\("title", expectedExperience\.title\)/);
  assert.match(
    repositorySource,
    /"related_links",\s*"eq",\s*JSON\.stringify\(expectedExperience\.relatedLinks\)/s,
  );
  assert.match(repositorySource, /"CONCURRENT_UPDATE"/);
  assert.match(
    repositorySource,
    /"분석 중 경험 내용이 다른 화면에서 수정되었습니다\./,
  );
});
