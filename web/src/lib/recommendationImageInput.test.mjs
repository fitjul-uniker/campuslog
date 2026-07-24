import assert from "node:assert/strict";
import test from "node:test";

import {
  RECOMMENDATION_IMAGE_MAX_BYTES,
  RECOMMENDATION_IMAGE_MAX_COUNT,
  createRecommendationOpenAiContent,
  getRecommendationClipboardImages,
  parseRecommendationImageInputs,
  prepareRecommendationImage,
  validateRecommendationImageSelection,
} from "./recommendationImageInput.ts";

const screenshot = {
  name: "job-description.png",
  type: "image/png",
  size: 512_000,
};

test("추천 입력에는 JPG, PNG, WebP 이미지를 최대 3장까지 첨부할 수 있다", () => {
  const result = validateRecommendationImageSelection(0, [
    screenshot,
    { ...screenshot, name: "question.jpg", type: "image/jpeg" },
    { ...screenshot, name: "interview.webp", type: "image/webp" },
  ]);

  assert.equal(result.error, "");
  assert.equal(result.accepted.length, RECOMMENDATION_IMAGE_MAX_COUNT);
});

test("추천 이미지는 빈 파일, 5MB 초과 파일, 지원하지 않는 형식을 거절한다", () => {
  assert.match(
    validateRecommendationImageSelection(0, [
      { ...screenshot, size: 0 },
    ]).error,
    /빈 이미지/,
  );
  assert.match(
    validateRecommendationImageSelection(0, [
      { ...screenshot, size: RECOMMENDATION_IMAGE_MAX_BYTES + 1 },
    ]).error,
    /5MB/,
  );
  assert.match(
    validateRecommendationImageSelection(0, [
      { ...screenshot, name: "question.gif", type: "image/gif" },
    ]).error,
    /JPG, PNG 또는 WebP/,
  );
});

test("클립보드에서는 이미지 파일만 추천 첨부 대상으로 가져온다", () => {
  const pastedImage = {
    name: "screenshot.png",
    type: "image/png",
    size: 120_000,
  };
  const pastedText = {
    name: "memo.txt",
    type: "text/plain",
    size: 30,
  };

  assert.deepEqual(
    getRecommendationClipboardImages([
      {
        kind: "string",
        type: "text/plain",
        getAsFile: () => null,
      },
      {
        kind: "file",
        type: "text/plain",
        getAsFile: () => pastedText,
      },
      {
        kind: "file",
        type: "image/png",
        getAsFile: () => pastedImage,
      },
    ]),
    [pastedImage],
  );
});

test("서버는 준비된 이미지 data URL의 형식과 MIME 타입을 다시 검증한다", () => {
  const validImage = {
    name: "job-description.png",
    mediaType: "image/png",
    dataUrl: "data:image/png;base64,aGVsbG8=",
  };

  assert.deepEqual(parseRecommendationImageInputs([validImage]), [validImage]);
  assert.equal(
    parseRecommendationImageInputs([
      { ...validImage, mediaType: "image/jpeg" },
    ]),
    null,
  );
  assert.equal(
    parseRecommendationImageInputs([
      { ...validImage, dataUrl: "https://example.com/image.png" },
    ]),
    null,
  );
  assert.equal(
    parseRecommendationImageInputs([
      { ...validImage, dataUrl: "data:image/png;base64,a" },
    ]),
    null,
  );
});

test("OpenAI 추천 요청은 텍스트 뒤에 고해상도 이미지 입력을 함께 보낸다", () => {
  const image = {
    name: "job-description.png",
    mediaType: "image/png",
    dataUrl: "data:image/png;base64,aGVsbG8=",
  };

  assert.deepEqual(
    createRecommendationOpenAiContent("추천 요청 context", [image]),
    [
      {
        type: "input_text",
        text: "추천 요청 context",
      },
      {
        type: "input_image",
        image_url: image.dataUrl,
        detail: "high",
      },
    ],
  );
});

test("전송 한도보다 작은 이미지는 원본 MIME 타입을 유지해 data URL로 준비한다", async () => {
  const bytes = new TextEncoder().encode("hello");
  const file = {
    name: "question.png",
    type: "image/png",
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer,
  };

  assert.deepEqual(await prepareRecommendationImage(file), {
    name: file.name,
    mediaType: file.type,
    dataUrl: "data:image/png;base64,aGVsbG8=",
  });
});
