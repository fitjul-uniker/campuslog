import assert from "node:assert/strict";
import test from "node:test";

import {
  EXPERIENCE_ATTACHMENT_MAX_BYTES,
  EXPERIENCE_ATTACHMENT_MAX_COUNT,
  formatAttachmentSize,
  validateAttachmentSelection,
} from "./experienceAttachments.ts";

const photo = {
  name: "activity-photo.jpg",
  type: "image/jpeg",
  size: 1_024_000,
};

const material = {
  name: "project-material.pdf",
  type: "application/pdf",
  size: 2_048_000,
};

test("사진과 PDF 자료를 첨부할 수 있다", () => {
  const result = validateAttachmentSelection(0, [photo, material]);

  assert.equal(result.error, "");
  assert.deepEqual(result.accepted, [photo, material]);
});

test("경험당 첨부 파일은 최대 3개로 제한한다", () => {
  const result = validateAttachmentSelection(
    EXPERIENCE_ATTACHMENT_MAX_COUNT - 1,
    [photo, material],
  );

  assert.equal(result.accepted.length, 0);
  assert.match(result.error, /최대 3개/);
});

test("파일당 5MB를 넘거나 허용되지 않은 형식은 거절한다", () => {
  const oversized = {
    ...photo,
    size: EXPERIENCE_ATTACHMENT_MAX_BYTES + 1,
  };
  const document = {
    name: "notes.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 1_024,
  };

  assert.match(validateAttachmentSelection(0, [oversized]).error, /5MB/);
  assert.match(
    validateAttachmentSelection(0, [document]).error,
    /JPG, PNG, WebP 또는 PDF/,
  );
});

test("내용이 없는 빈 파일은 선택 단계에서 거절한다", () => {
  const emptyPhoto = {
    ...photo,
    size: 0,
  };

  assert.match(validateAttachmentSelection(0, [emptyPhoto]).error, /빈 파일/);
});

test("첨부 파일 크기를 읽기 쉬운 단위로 표시한다", () => {
  assert.equal(formatAttachmentSize(1_024), "1 KB");
  assert.equal(formatAttachmentSize(1_572_864), "1.5 MB");
});
