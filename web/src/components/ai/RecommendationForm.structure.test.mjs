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
const purposeConfigSource = await readFile(
  new URL("../../lib/recommendationPurposeConfig.ts", import.meta.url),
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
  assert.match(
    pickerSource,
    /여기에 끌어다 놓거나 파일 선택을 눌러 주세요\./,
  );
  assert.doesNotMatch(pickerSource, /이미지 선택을 눌러 주세요/);
  assert.match(pickerSource, />\s*파일 선택\s*<\/button>/);
  assert.doesNotMatch(pickerSource, /<Upload aria-hidden="true" \/>/);
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
  assert.match(
    pickerSource,
    /className="recommendation-image-fieldset liquid-section"[\s\S]*data-has-files=\{files\.length > 0 \? "true" : "false"\}/,
  );
  assert.match(pickerSource, /files\.length === 0/);
  assert.match(pickerSource, /질문 또는 JD 이미지를 추가하세요/);
  assert.match(
    pickerSource,
    /JPG, PNG, WebP · 최대 3장 · 장당 5MB 이하/,
  );
  assert.match(pickerSource, /className="recommendation-image-add-tile"/);
  assert.match(
    pickerSource,
    /className="recommendation-image-clear liquid-capsule"[\s\S]*전체 삭제/,
  );
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
  assert.match(
    styles,
    /\.recommendation-image-fieldset\.liquid-section\[data-has-files="false"\]\s*\{[\s\S]*border:\s*0/,
  );
  assert.match(
    styles,
    /\.recommendation-image-fieldset\[data-has-files="false"\][\s\S]*\.recommendation-image-dropzone\s*\{[\s\S]*border:\s*1px dashed var\(--liquid-hairline-strong\)/,
  );
});

test("추천 폼은 입력과 액션을 Liquid Glass 역할로 그룹화한다", () => {
  assert.match(formSource, /experience-form liquid-form/);
  assert.match(formSource, /form-field liquid-content-field/);
  assert.match(formSource, /recommendation-example-list liquid-control-group/);
  assert.match(formSource, /className="recommendation-analysis-request"/);
  assert.doesNotMatch(formSource, /recommendation-analysis-request liquid-prominent-action/);
  assert.match(pickerSource, /recommendation-image-fieldset liquid-section/);
});

test("목적별 예시는 짧은 선택 문구와 실제 입력 문장을 분리한다", () => {
  assert.match(purposeConfigSource, /label: "맡은 역할과 성과"/);
  assert.match(purposeConfigSource, /label: "문제 해결"/);
  assert.match(purposeConfigSource, /label: "협업과 갈등"/);
  assert.match(purposeConfigSource, /label: "주도적인 실행"/);
  assert.match(purposeConfigSource, /label: "실패와 성장"/);
  assert.match(purposeConfigSource, /label: "직무 연결"/);
  assert.match(purposeConfigSource, /label: "지원동기"/);
  assert.match(purposeConfigSource, /label: "직무 역량"/);
  assert.match(purposeConfigSource, /label: "협업 경험"/);
  assert.match(purposeConfigSource, /label: "도전과 성장"/);
  assert.match(purposeConfigSource, /label: "실패와 개선"/);
  assert.match(purposeConfigSource, /label: "플랫폼·결제 서버 JD"/);
  assert.match(purposeConfigSource, /label: "커머스 백엔드 JD"/);
  assert.match(purposeConfigSource, /label: "채용공고 핵심 요약"/);
  assert.match(purposeConfigSource, /label: "요구사항과 내 경험"/);
  assert.match(purposeConfigSource, /label: "적합 경험 Top 3"/);
  assert.match(purposeConfigSource, /label: "예상 면접과 지원 전략"/);
  assert.match(purposeConfigSource, /label: "포트폴리오 대표 경험"/);
  assert.match(purposeConfigSource, /label: "이력서 문장 정리"/);
  assert.match(purposeConfigSource, /label: "1분 자기소개"/);
  assert.match(purposeConfigSource, /label: "대외활동·인턴 지원"/);
  assert.match(purposeConfigSource, /label: "프로젝트·활동 발표"/);
  assert.match(purposeConfigSource, /label: "전공과 직무 연결"/);
  assert.match(
    purposeConfigSource,
    /input:\s*PLATFORM_PAYMENT_SERVER_JD_SAMPLE/,
  );
  assert.match(
    purposeConfigSource,
    /input:\s*COMMERCE_BACKEND_JD_SAMPLE/,
  );
});

test("면접·자기소개서·JD 분석·기타는 대표 예시를 각각 6개만 제공한다", () => {
  const exampleGroups = [
    ...purposeConfigSource.matchAll(
      /examples: \[([\s\S]*?)\n    \],\n    generationOptions/g,
    ),
  ];

  assert.equal(exampleGroups.length, 4);
  assert.deepEqual(
    exampleGroups.map(([, group]) => (group.match(/label: "/g) ?? []).length),
    [6, 6, 6, 6],
  );
});
