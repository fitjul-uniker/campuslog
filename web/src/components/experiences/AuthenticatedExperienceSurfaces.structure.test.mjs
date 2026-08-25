import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const formSource = await readFile(
  new URL("./ExperienceForm.tsx", import.meta.url),
  "utf8",
);
const newExperienceSource = await readFile(
  new URL("./NewExperienceClient.tsx", import.meta.url),
  "utf8",
);
const detailExperienceSource = await readFile(
  new URL("./ExperienceDetailClient.tsx", import.meta.url),
  "utf8",
);
const editExperienceSource = await readFile(
  new URL("./EditExperienceClient.tsx", import.meta.url),
  "utf8",
);
const analysisClientSource = await readFile(
  new URL("./ExperienceAnalysisClient.tsx", import.meta.url),
  "utf8",
);
const resultSource = await readFile(
  new URL("../ai/AnalysisResult.tsx", import.meta.url),
  "utf8",
);
const attachmentsSource = await readFile(
  new URL("./ExperienceAttachmentsSection.tsx", import.meta.url),
  "utf8",
);
const activityDetailSource = await readFile(
  new URL("../activities/ActivityDetailClient.tsx", import.meta.url),
  "utf8",
);
const trackedActivityDetailSource = await readFile(
  new URL("./DashboardTrackedActivityDetail.tsx", import.meta.url),
  "utf8",
);
const attachmentPickerSource = await readFile(
  new URL("./ExperienceAttachmentPicker.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("경험 작성과 수정은 frosted workspace 안에 near-solid 입력을 둔다", () => {
  assert.match(formSource, /experience-form liquid-form/);
  assert.match(newExperienceSource, /form-panel liquid-workspace/);
  assert.match(editExperienceSource, /form-panel liquid-workspace/);
  assert.match(newExperienceSource, /experience-form-page experience-new-page/);
  assert.match(editExperienceSource, /experience-form-page experience-edit-page/);
  assert.match(
    editExperienceSource,
    /experience-detail-page-heading[\s\S]*href=\{`\/experiences\/\$\{experience\.id\}`\}[\s\S]*경험 상세/,
  );
  assert.match(
    `${newExperienceSource}\n${editExperienceSource}`,
    /className="experience-form-scroll"[\s\S]*data-transient-scrollbar="true"[\s\S]*onScroll=\{handleTransientScroll\}/,
  );
  assert.match(
    styles,
    /@media \(min-width: 861px\)[\s\S]*\.experience-form-page\s*\{[^}]*--standalone-page-intro-scroll-offset:\s*0px[^}]*height:\s*100svh[^}]*padding:\s*var\(--experience-form-viewport-inset\) var\(--sub-page-gutter\)[^}]*\}[\s\S]*\.experience-form-scroll\s*\{[^}]*overflow-y:\s*auto/s,
  );
  assert.match(
    styles,
    /\.experience-form-scroll\s*\{[^}]*--experience-form-scroll-inset:\s*8px;[^}]*width:\s*calc\(100% - \(var\(--experience-form-scroll-inset\) \* 2\)\);[^}]*margin-inline:\s*var\(--experience-form-scroll-inset\);/s,
  );
  assert.doesNotMatch(formSource, /period-help/);
  assert.match(
    styles,
    /\.period-fieldset legend\s*\{[^}]*margin-bottom:\s*10px[^}]*color:\s*var\(--color-text-muted\)[^}]*font-size:\s*0\.88rem[^}]*font-weight:\s*800/is,
  );
  assert.match(
    styles,
    /\.period-fieldset\s*>\s*\.field-grid \.form-field\s*>\s*label\s*\{[^}]*color:\s*var\(--liquid-text-tertiary,[^}]*font-size:\s*0\.75rem[^}]*font-weight:\s*700/is,
  );
  assert.match(
    formSource,
    /htmlFor="experience-period-start">시작<\/label>/,
  );
  assert.match(
    formSource,
    /htmlFor="experience-period-end">종료<\/label>/,
  );
  assert.match(formSource, /function formatMonthForDisplay/);
  assert.match(
    formSource,
    /experience-period-start[\s\S]*experience-month-display[\s\S]*formatMonthForDisplay\(periodFields\.startMonth\)/,
  );
  assert.match(
    formSource,
    /experience-period-end[\s\S]*experience-month-display[\s\S]*"진행 중"[\s\S]*formatMonthForDisplay\(periodFields\.endMonth\)/,
  );
  assert.match(
    formSource,
    /id="experience-period-ongoing"[\s\S]*size="lg"/,
  );
  assert.match(
    styles,
    /\.experience-month-control input::\-webkit-datetime-edit[\s\S]*color:\s*transparent;/,
  );
  assert.match(
    styles,
    /Experience form actions[\s\S]*?\.experience-month-control[\s\S]*?input::\-webkit-datetime-edit-year-field\s*\{[^}]*color:\s*transparent;[^}]*-webkit-text-fill-color:\s*transparent;/,
  );
  assert.match(
    styles,
    /\.experience-month-display\s*\{[^}]*right:\s*52px;[^}]*left:\s*18px;[^}]*pointer-events:\s*none;/s,
  );
});

test("화면 이동 액션은 추천 기록과 같은 Liquid Glass capsule을 사용한다", () => {
  assert.match(
    styles,
    /Shared navigation actions[\s\S]*a\.button,[\s\S]*a\.dashboard-detail-action,[\s\S]*a\.recommendation-match-link,[\s\S]*a\.recommendation-history-new,[\s\S]*a\.recommendation-header-link[\s\S]*border-radius:\s*999px[\s\S]*background:\s*var\(--liquid-clear-fill\)/,
  );
  assert.match(
    styles,
    /button\.dashboard-detail-action:not\(\.dashboard-detail-delete\):not\([\s\S]*\.dashboard-analysis-request[\s\S]*\)/,
  );
});

test("중립 저장·수정 실행은 capsule을 공유하고 색상 의미 버튼은 제외한다", () => {
  assert.match(
    styles,
    /Neutral submit\/edit actions[\s\S]*button\.button-primary:not\(\.auth-submit\)[\s\S]*button\.activity-primary-button:not\(\.activity-create-expanding-button\)[\s\S]*border-radius:\s*999px[\s\S]*background:\s*var\(--liquid-clear-fill\)/,
  );
  const neutralActionSelector = styles.match(
    /Neutral submit\/edit actions[^]*?\.product-shell[\s\S]*?:is\(([^]*?)\)\s*\{/,
  )?.[1];
  assert.ok(neutralActionSelector);
  assert.doesNotMatch(neutralActionSelector, /dashboard-detail-delete/);
  assert.doesNotMatch(neutralActionSelector, /animated-gradient-action-button/);
});

test("삭제 액션은 danger 의미를 유지한 capsule 형태를 공유한다", () => {
  assert.match(activityDetailSource, /activity-secondary-button activity-delete-button/);
  assert.match(
    trackedActivityDetailSource,
    /dashboard-detail-action dashboard-detail-delete/,
  );
  assert.match(
    attachmentPickerSource,
    /liquid-capsule experience-attachment-clear-button/,
  );
  assert.match(
    attachmentPickerSource,
    /className="experience-attachment-remove-button"/,
  );
  assert.match(
    styles,
    /Destructive actions share the capsule geometry[\s\S]*?\.dashboard-detail-delete,[\s\S]*?\.activity-delete-button,[\s\S]*?\.experience-attachment-clear-button[\s\S]*?border-radius:\s*999px;[\s\S]*?box-shadow:\s*var\(--liquid-action-shadow\);[\s\S]*?color:\s*var\(--liquid-danger-text\);/,
  );
  assert.match(
    styles,
    /\.related-link-remove,[\s\S]*?\.experience-attachment-remove-button,[\s\S]*?\.recommendation-image-delete-button[\s\S]*?width:\s*44px;[\s\S]*?border-radius:\s*999px;/,
  );
  assert.match(
    styles,
    /--liquid-action-shadow:[\s\S]*?0 2px 7px rgb\(51 58 69 \/ 5%\);[\s\S]*?--liquid-danger-text:\s*#b42318;/,
  );
  assert.match(
    styles,
    /\.recommendation-image-delete-button[\s\S]*?\)\s*svg\s*\{[^}]*color:\s*currentColor;/,
  );
});

test("관련 링크의 열 제목은 첫 행에만 보이고 추가 행은 입력만 반복한다", () => {
  assert.match(formSource, /related-link-row\$\{index === 0 \? "" : " is-continuation"\}/);
  assert.match(
    formSource,
    /className=\{index === 0 \? undefined : "sr-only"\}[\s\S]*?URL/,
  );
  assert.match(
    formSource,
    /className=\{index === 0 \? undefined : "sr-only"\}[\s\S]*?설명/,
  );
  assert.match(
    styles,
    /\.related-link-row\.is-continuation[\s\S]*?margin-top:\s*2px/,
  );
  assert.match(
    styles,
    /\.experience-form\.liquid-form[\s\S]*?\.related-link-rows\s*\{[^}]*gap:\s*7px/,
  );
  assert.match(
    styles,
    /\.experience-form\.liquid-form[\s\S]*?\.related-link-row\s*\{[^}]*border:\s*0[^}]*padding:\s*0/,
  );
  assert.match(
    styles,
    /\.related-link-url-field\s*>\s*label\s*\{[^}]*margin-left:\s*-46px/,
  );
});

test("관련 링크 제목은 다른 필드 라벨과 정렬하고 중복 설명을 표시하지 않는다", () => {
  assert.match(formSource, /<legend>관련 링크<\/legend>/);
  assert.doesNotMatch(
    formSource,
    /작업 결과나 참고 자료를 링크와 설명으로 나누어 정리해보세요\./,
  );
  assert.match(formSource, /최대 \{MAX_RELATED_LINKS\}개까지 추가할 수 있습니다\./);
  assert.match(
    styles,
    /\.related-links-fieldset legend\s*\{[^}]*width:\s*100%[^}]*margin:\s*0[^}]*padding:\s*0/,
  );
  assert.match(
    styles,
    /\.related-links-fieldset\s*\{[^}]*gap:\s*8px/,
  );
});

test("경험 폼의 활동 내용과 관련 링크 액션은 명확한 라벨과 안정된 capsule을 사용한다", () => {
  assert.match(
    formSource,
    /<label htmlFor="experience-description">활동 내용<\/label>/,
  );
  assert.match(
    styles,
    /Experience form actions[\s\S]*?\.related-link-add\s*\{[^}]*border-radius:\s*999px;[^}]*background:\s*var\(--liquid-clear-fill\);/,
  );
  assert.match(
    styles,
    /\.related-link-row\s*\.related-link-remove\s*\{[^}]*align-self:\s*end;[^}]*margin:\s*0 0 3px;/,
  );
});

test("경험 폼의 파일 선택과 저장 액션은 단색이며 hover에서 움직이지 않는다", () => {
  assert.match(
    styles,
    /\.experience-attachment-select\s*\{[^}]*background:\s*#17181b;/,
  );
  assert.match(formSource, /disabled=\{isSubmitting\}[\s\S]*hoverScale=\{1\}/);
  assert.match(
    styles,
    /\.experience-form\.liquid-form[\s\S]*?\.panel-actions[\s\S]*?\.button-primary\s*\{[^}]*background:\s*#17181b;[^}]*color:\s*#ffffff;/,
  );
  assert.match(
    styles,
    /\.panel-actions[\s\S]*?:is\(\.button-primary, \.button-secondary\):is\(:hover, :focus-visible\)\s*\{[^}]*transform:\s*none;/,
  );
});

test("역할 입력은 여러 줄을 수용하는 넓은 textarea를 사용한다", () => {
  assert.match(
    formSource,
    /<textarea[\s\S]*?id="experience-role"[\s\S]*?rows=\{3\}/,
  );
  assert.match(
    styles,
    /\.experience-form #experience-role\s*\{[^}]*min-height:\s*96px/,
  );
});

test("첨부 파일 제목과 dropzone은 다른 label-control과 같은 간격을 사용한다", () => {
  assert.match(
    styles,
    /\.experience-attachment-fieldset\.liquid-section\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*gap:\s*8px;/s,
  );
  assert.match(
    styles,
    /\.experience-attachment-legend\s*\{[^}]*width:\s*100%;[^}]*margin:\s*0 0 8px;/s,
  );
});

test("긴 경험 입력은 한도에 가까울 때만 글자 수를 안내한다", () => {
  assert.match(formSource, /descriptionLengthState\.showGuidance/);
  assert.match(formSource, /achievementsLengthState\.showGuidance/);
  assert.match(formSource, /experience-length-guidance/);
  assert.match(formSource, /자를 줄여주세요/);
  assert.doesNotMatch(
    formSource,
    /id="experience-description"[\s\S]*?maxLength=\{EXPERIENCE_INPUT_LIMITS\.description\}/,
  );
  assert.match(
    styles,
    /\.experience-length-guidance\s*\{[^}]*color:\s*var\(--color-text-soft\)/s,
  );
  assert.match(
    styles,
    /\.experience-length-guidance\.is-over-limit\s*\{[^}]*color:\s*var\(--color-danger-text\)/s,
  );
});

test("독립 AI 분석과 임베디드 분석은 서로 다른 Liquid Glass 밀도를 사용한다", () => {
  assert.match(
    analysisClientSource,
    /detail-panel analysis-result liquid-section/,
  );
  assert.match(
    resultSource,
    /isEmbedded[\s\S]*"is-embedded liquid-content-plate"[\s\S]*"liquid-section"/,
  );
});

test("경험 상세·수정·분석의 초기 로딩은 접근성 상태만 제공한다", () => {
  assert.match(
    detailExperienceSource,
    /<LoadingStatus message="저장된 경험을 불러오는 중입니다\."/,
  );
  assert.match(
    editExperienceSource,
    /<LoadingStatus message="저장된 경험을 불러오는 중입니다\."/,
  );
  assert.match(
    analysisClientSource,
    /<LoadingStatus message="분석 상태를 불러오는 중입니다\."/,
  );
  assert.doesNotMatch(
    `${detailExperienceSource}\n${editExperienceSource}\n${analysisClientSource}`,
    /<LoadingState\b/,
  );
});

test("AI 분석 결과는 생성일·대표 제목 위계를 사용한다", () => {
  assert.doesNotMatch(resultSource, /AI 경험 분석 결과/);
  assert.match(resultSource, /analysis-result-generated-at/);
  assert.match(
    resultSource,
    /<h2 id="analysis-result-title">\{experience\.title\}<\/h2>/,
  );
  assert.doesNotMatch(resultSource, /저장된 분석 결과/);
  assert.doesNotMatch(resultSource, /분석 생성일/);
  assert.doesNotMatch(
    resultSource,
    /원본 경험이 바뀌면 업데이트 필요로 표시됩니다/,
  );
  assert.match(
    styles,
    /\.analysis-result-header\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/s,
  );
  assert.match(
    styles,
    /\.dashboard-analysis-split-panel\.liquid-section\s*\{[^}]*background:\s*var\(--liquid-frosted-fill\)/s,
  );
});

test("독립 분석 결과는 후속 액션을 같은 결과 표면 안에 넣을 수 있다", () => {
  assert.match(resultSource, /footer\?: ReactNode/);
  assert.match(resultSource, /analysis-result-footer/);
  assert.match(resultSource, /className="analysis-result-scroll"/);
  assert.match(resultSource, /data-transient-scrollbar="true"/);
  assert.match(resultSource, /data-scroll-page-intro="true"/);
  assert.match(resultSource, /onScroll=\{handleTransientScroll\}/);
});

test("첨부 목록은 관련 링크와 같은 평평한 상세 구획과 행 밀도를 사용한다", () => {
  assert.match(attachmentsSource, /className="experience-attachments-section"/);
  assert.doesNotMatch(
    attachmentsSource,
    /experience-attachments-section liquid-content-plate/,
  );
  assert.match(
    styles,
    /\.experience-attachments-list a,[\s\S]*?grid-template-columns:\s*36px minmax\(0, 1fr\) 16px;[\s\S]*?border-radius:\s*10px;[\s\S]*?padding:\s*11px 12px;/,
  );
  assert.match(
    styles,
    /\.experience-attachment-preview\s*\{[^}]*width:\s*36px;[^}]*height:\s*36px;[^}]*border-radius:\s*10px;/s,
  );
});
