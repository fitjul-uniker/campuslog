import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const formSource = await readFile(
  new URL("./ExperienceForm.tsx", import.meta.url),
  "utf8",
);
const pickerSource = await readFile(
  new URL("./ExperienceAttachmentPicker.tsx", import.meta.url),
  "utf8",
);
const detailSource = await readFile(
  new URL("./ExperienceAttachmentsSection.tsx", import.meta.url),
  "utf8",
);
const dashboardDetailSource = await readFile(
  new URL("./DashboardExperienceDetail.tsx", import.meta.url),
  "utf8",
);
const repositorySource = await readFile(
  new URL("../../lib/repositories/campuslogRepository.ts", import.meta.url),
  "utf8",
);
const typesSource = await readFile(
  new URL("../../lib/types.ts", import.meta.url),
  "utf8",
);
const editSource = await readFile(
  new URL("./EditExperienceClient.tsx", import.meta.url),
  "utf8",
);
const attachmentUtilsSource = await readFile(
  new URL("../../lib/experienceAttachments.ts", import.meta.url),
  "utf8",
);

test("경험 작성 폼에 사진과 PDF 자료 첨부 진입점을 제공한다", () => {
  assert.match(formSource, /ExperienceAttachmentPicker/);
  assert.match(pickerSource, /사진 첨부/);
  assert.match(pickerSource, /자료 첨부/);
  assert.match(pickerSource, /accept=\{EXPERIENCE_PHOTO_ACCEPT\}/);
  assert.match(pickerSource, /accept=\{EXPERIENCE_MATERIAL_ACCEPT\}/);
  assert.match(attachmentUtilsSource, /image\/jpeg,image\/png,image\/webp/);
  assert.match(attachmentUtilsSource, /application\/pdf/);
  assert.match(pickerSource, /AI 분석에는 사용되지 않아요/);
});

test("경험 상세에서 첨부를 열고 독립 상세에서만 삭제할 수 있다", () => {
  assert.match(dashboardDetailSource, /ExperienceAttachmentsSection/);
  assert.match(dashboardDetailSource, /canDelete=\{isFullscreen\}/);
  assert.match(detailSource, /target="_blank"/);
  assert.match(detailSource, /첨부 파일 삭제/);
});

test("첨부는 Experience와 분리된 repository로 저장해 AI 입력에 포함하지 않는다", () => {
  const experienceTypeStart = typesSource.indexOf("export type Experience = {");
  const experienceTypeEnd = typesSource.indexOf("};", experienceTypeStart);
  const experienceType = typesSource.slice(experienceTypeStart, experienceTypeEnd);

  assert.doesNotMatch(experienceType, /attachments/);
  assert.match(typesSource, /export type ExperienceAttachment = \{/);
  assert.match(repositorySource, /attachments: \{/);
  assert.match(repositorySource, /listByExperienceId/);
  assert.match(repositorySource, /upload\(/);
  assert.match(repositorySource, /createSignedUrl/);
  assert.match(repositorySource, /EXPERIENCE_ATTACHMENTS_BUCKET/);
});

test("첨부만 추가할 때 경험 원문과 AI 분석 상태를 갱신하지 않는다", () => {
  assert.match(editSource, /hasExperienceContentChanges/);
  assert.match(
    editSource,
    /hasExperienceContentChanges\(experience, input\)[\s\S]*repository\.experiences\.update/,
  );
});
