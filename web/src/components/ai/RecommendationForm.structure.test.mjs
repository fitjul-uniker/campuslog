import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const formSource = await readFile(
  new URL("./RecommendationForm.tsx", import.meta.url),
  "utf8",
);
const pickerSource = await readFile(
  new URL("./RecommendationImagePicker.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("추천 폼은 텍스트 또는 이미지 중 하나만 있어도 바로 제출한다", () => {
  assert.match(
    formSource,
    /if \(!prompt\.trim\(\) && images\.length === 0\)/,
  );
  assert.match(formSource, /images: preparedImages/);
  assert.doesNotMatch(formSource, /OCR|추출된 텍스트.*수정/);
});

test("추천 이미지 선택기는 최대 3장과 선명한 캡쳐 안내를 제공한다", () => {
  assert.match(pickerSource, /RECOMMENDATION_IMAGE_MAX_COUNT/);
  assert.match(pickerSource, /선명한 캡쳐일수록 정확해요/);
  assert.match(pickerSource, /aria-label=.*이미지.*삭제/);
  assert.match(pickerSource, /accept=\{RECOMMENDATION_IMAGE_ACCEPT\}/);
});

test("추천 폼은 이미지 붙여넣기를 첨부로 처리하고 일반 텍스트 붙여넣기는 유지한다", () => {
  assert.match(formSource, /onPaste=\{handlePaste\}/);
  assert.match(formSource, /getRecommendationClipboardImages/);
  assert.match(formSource, /if \(clipboardImages\.length === 0\) \{\s*return;/);
  assert.match(formSource, /event\.preventDefault\(\)/);
  assert.match(pickerSource, /복사해 붙여넣/);
});

test("추천 이미지 목록은 고정된 미리보기와 모바일 한 줄 정보를 유지한다", () => {
  assert.match(
    styles,
    /\.recommendation-image-item\s*\{[\s\S]*grid-template-columns:\s*64px minmax\(0, 1fr\) 44px/,
  );
  assert.match(
    styles,
    /\.recommendation-image-preview\s*\{[\s\S]*width:\s*64px;[\s\S]*height:\s*64px/,
  );
  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*\.recommendation-image-toolbar/,
  );
});
