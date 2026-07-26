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

test("추천 이미지 선택기는 최대 개수와 삭제 접근성 계약을 제공한다", () => {
  assert.match(pickerSource, /RECOMMENDATION_IMAGE_MAX_COUNT/);
  assert.match(pickerSource, /aria-label=.*이미지.*삭제/);
  assert.match(pickerSource, /accept=\{RECOMMENDATION_IMAGE_ACCEPT\}/);
});

test("추천 폼은 이미지 붙여넣기를 첨부로 처리하고 일반 텍스트 붙여넣기는 유지한다", () => {
  assert.match(formSource, /onPaste=\{handlePaste\}/);
  assert.match(formSource, /getRecommendationClipboardImages/);
  assert.match(formSource, /if \(clipboardImages\.length === 0\) \{\s*return;/);
  assert.match(formSource, /event\.preventDefault\(\)/);
});

test("추천 이미지 입력은 빈 업로드 안내에서 선택 Gallery로 전환한다", () => {
  assert.match(
    pickerSource,
    /<legend className="sr-only">이미지 첨부<\/legend>/,
  );
  assert.match(pickerSource, /files\.length === 0/);
  assert.match(pickerSource, /질문 또는 JD 이미지를 추가하세요/);
  assert.match(
    pickerSource,
    /JPG, PNG, WebP · 최대 3장 · 장당 5MB 이하/,
  );
  assert.match(pickerSource, /className="recommendation-image-add-tile"/);
  assert.match(pickerSource, /전체 삭제/);
  assert.match(pickerSource, /이미지 크게 보기/);
  assert.match(pickerSource, /<dialog/);
  assert.match(
    pickerSource,
    /onCancel=\{\(event\) => \{[\s\S]*event\.preventDefault\(\);[\s\S]*onClose\(\);/,
  );
  assert.doesNotMatch(pickerSource, /recommendation-image-help/);
  assert.match(
    styles,
    /\.recommendation-image-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*\.recommendation-image-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  );
});
