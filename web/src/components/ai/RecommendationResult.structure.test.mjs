import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./RecommendationResult.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);
const titleSource = await readFile(
  new URL("../../lib/recommendationResultTitle.ts", import.meta.url),
  "utf8",
);
const evidencePresentationSource = await readFile(
  new URL("../../lib/answerDraftEvidencePresentation.ts", import.meta.url),
  "utf8",
);

function extractCssBlock(css, marker) {
  const markerIndex = css.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${marker} block should exist`);
  const openingBraceIndex = css.indexOf("{", markerIndex);
  let depth = 0;

  for (let index = openingBraceIndex; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(openingBraceIndex + 1, index);
  }

  assert.fail(`${marker} block should close`);
}

const readabilityMarker =
  "/* Recommendation readability — preserve the existing fields and order. */";
const readabilityStyles = styles.slice(styles.indexOf(readabilityMarker));
const readabilityForcedColors = extractCssBlock(
  readabilityStyles,
  "@media (forced-colors: active)",
);

test("추천 결과는 요청한 보조 정보 블록을 렌더링하지 않는다", () => {
  assert.doesNotMatch(source, /requirements\.requiredCompetencies/);
  assert.doesNotMatch(source, /requirements\.keywords/);
  assert.doesNotMatch(source, /requirements\.constraints/);
  assert.doesNotMatch(source, /recommendation-legacy-summary/);
  assert.doesNotMatch(source, /<h3>참고 문장<\/h3>/);
  assert.doesNotMatch(source, /recommendation-copy-button/);
});

test("추천 결과는 핵심 비교와 생성 흐름을 유지한다", () => {
  assert.match(source, /requirements\.preferredCompetencies/);
  assert.match(source, /matches\.map/);
  assert.match(source, /추천 이유/);
  assert.match(source, /AnswerDraftViewer/);
  assert.match(source, /초안 본문을 클립보드에 복사했습니다/);
});

test("답변 초안의 사용된 근거는 추천 매칭 문장만 중복 제목 없이 표시한다", () => {
  assert.match(source, /getAnswerDraftRecommendationEvidence/);
  assert.match(source, /matchedEvidence=\{match\.matchedEvidence\}/);
  assert.match(source, /items=\{displayedEvidence\}/);
  assert.match(source, /<h6>사용된 근거<\/h6>/);
  assert.match(
    evidencePresentationSource,
    /\^추천 매칭 근거\\s\*:\\s\*/,
  );
  assert.doesNotMatch(source, /items=\{activeDraft\.usedEvidence\}/);
});

test("답변 초안은 형식 선택과 생성·복사 행동을 하나의 작업 영역으로 묶는다", () => {
  assert.match(source, /<h5>답변 초안<\/h5>/);
  assert.match(source, /선택한 경험의 기록을 바탕으로 작성합니다/);
  assert.match(
    source,
    /role="tab"[\s\S]*?aria-controls=\{`answer-draft-panel-\$\{experienceId\}`\}/,
  );
  assert.match(
    source,
    /role="tabpanel"[\s\S]*?aria-labelledby=\{`answer-draft-tab-\$\{experienceId\}-\$\{selectedType\}`\}/,
  );
  assert.match(
    source,
    /className="answer-draft-heading-actions"[\s\S]*?<CopyButton[\s\S]*?<RippleButton/,
  );
  assert.match(source, /"만드는 중\.\.\."/);
  assert.match(source, /"다시 만들기"/);
  assert.match(source, /"초안 만들기"/);
  assert.doesNotMatch(source, /선택한 버전의 초안을 아직 생성하지 않았습니다/);
  assert.match(
    styles,
    /\.answer-draft-tabs\s*\{[^}]*display:\s*grid;[^}]*border-radius:\s*15px;[^}]*backdrop-filter:\s*blur\(18px\) saturate\(125%\);/s,
  );
  assert.match(
    styles,
    /\.answer-draft-body\s*\{[^}]*border-radius:\s*16px;[^}]*background:\s*rgb\(255 255 255 \/ 62%\);[^}]*padding:\s*18px;/s,
  );
  assert.match(
    styles,
    /\.answer-draft-heading-actions\s*\{[^}]*display:\s*inline-flex;[^}]*gap:\s*8px;/s,
  );
  assert.match(
    styles,
    /\.answer-draft-tab:focus-visible\s*\{[^}]*outline:\s*2px solid #34363a;/s,
  );
  assert.doesNotMatch(
    styles,
    /\.answer-draft-tab\.is-active\s*\{[^}]*background:\s*#1d1f23;/s,
  );
});

test("추천 상세는 기존 정보 형식과 순서를 유지한 채 읽기 밀도만 완화한다", () => {
  const matchDetailSource = source.slice(
    source.indexOf('className="recommendation-match-reason"'),
  );
  const labels = [
    "추천 이유",
    "직접 근거",
    "부족한 근거",
    "과장 주의점",
    "활용 각도",
  ];
  const positions = labels.map((label) => matchDetailSource.indexOf(label));

  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((left, right) => left - right));
  assert.match(
    readabilityStyles,
    /\/\* Recommendation readability — preserve the existing fields and order\. \*\//,
  );
  assert.match(
    readabilityStyles,
    /\.recommendation-match-card\s+\.recommendation-match-details\s*\{[^}]*gap:\s*0;[^}]*border-top:\s*1px solid[^}]*border-bottom:\s*1px solid/s,
  );
  assert.match(
    readabilityStyles,
    /\.recommendation-match-card\s+\.recommendation-match-angle\s*\{[^}]*margin-top:\s*18px;[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*padding:\s*0;/s,
  );
  assert.doesNotMatch(
    readabilityStyles,
    /\.recommendation-result\s+\.recommendation-match-details\s*\{/s,
  );
});

test("자기소개서 초안은 사용자가 글자 수 제한을 직접 입력할 수 있다", () => {
  assert.match(source, /최대 글자 수/);
  assert.match(source, /약 \$\{customCharacterLimit\.min\}~\$\{customCharacterLimit\.max\}자로 생성/);
  assert.doesNotMatch(source, /지원서 글자 수 제한/);
  assert.match(source, /CUSTOM_ANSWER_DRAFT_MIN_CHARACTERS/);
  assert.match(source, /CUSTOM_ANSWER_DRAFT_MAX_CHARACTERS/);
  assert.match(source, /customCharacterCount/);
  assert.match(styles, /\.answer-draft-custom-length/);
  assert.match(
    styles,
    /\.answer-draft-custom-length-control:focus-within\s*\{[^}]*border-color:[^}]*background:[^}]*box-shadow:/s,
  );
  assert.match(
    styles,
    /\.answer-draft-custom-length-control:has\(input\[aria-invalid="true"\]\)/,
  );
  assert.match(
    styles,
    /\.answer-draft-custom-length-control\s*\{[^}]*width:\s*116px;[^}]*height:\s*44px;[^}]*backdrop-filter:\s*blur\(18px\) saturate\(135%\);/s,
  );
  assert.match(
    styles,
    /\.answer-draft-custom-length-control input\s*\{[^}]*height:\s*100%;[^}]*min-height:\s*44px;/s,
  );
  assert.match(
    styles,
    /\.answer-draft-custom-length-control input::-webkit-inner-spin-button,[\s\S]*?input::-webkit-outer-spin-button\s*\{[^}]*-webkit-appearance:\s*none;/,
  );
  assert.match(
    styles,
    /\.answer-draft-custom-length-control:has\(input:disabled\)\s*\{[^}]*cursor:\s*not-allowed;[^}]*opacity:/s,
  );
  assert.match(
    readabilityForcedColors,
    /\.answer-draft-custom-length-control:focus-within\s*\{[^}]*outline:\s*2px solid Highlight;/,
  );
});

test("이미지로 생성한 추천 결과는 출처를 명확히 표시한다", () => {
  assert.match(source, /result\.inputSource !== "text"/);
  assert.match(source, /이미지에서 추출된 내용 기반/);
});

test("추천 결과는 긴 내용을 보호하는 Liquid Glass section을 사용한다", () => {
  assert.match(source, /recommendation-result is-embedded liquid-section/);
  assert.match(
    source,
    /detail-panel recommendation-result liquid-section/,
  );
});

test("짧은 질문은 제목으로 유지하고 긴 JD 원문은 접힌 영역에서 확인한다", () => {
  assert.match(source, /getRecommendationResultTitle\(result\)/);
  assert.match(titleSource, /result\.purpose === "jd"/);
  assert.match(titleSource, /prompt\.length > 240/);
  assert.match(titleSource, /JD 요구사항과 경험 적합도 분석/);
  assert.match(source, /<h2 id="recommendation-title">\{resultTitle\}<\/h2>/);
  assert.match(source, /입력한 JD 보기/);
  assert.match(source, /recommendation-source-disclosure-content/);
  assert.match(styles, /\.recommendation-source-disclosure/);
  assert.match(source, /recommendation-result-generated-at/);
  assert.doesNotMatch(source, /<dt>추천 생성일<\/dt>/);
});

test("이미지 단독 자기소개서 제목은 추출 의도와 키워드로 정리한다", () => {
  assert.match(titleSource, /result\.purpose === "cover_letter"/);
  assert.match(titleSource, /result\.inputSource === "image"/);
  assert.match(titleSource, /result\.extractedRequirements\.intent/);
  assert.match(titleSource, /result\.extractedRequirements\.keywords/);
  assert.match(titleSource, /자기소개서 문항과 경험 적합도 분석/);
});

test("현재 추천과 추천 기록은 활동 메타와 질문을 하단에 중복하지 않는다", () => {
  assert.doesNotMatch(source, /className="dashboard-detail-meta recommendation-meta"/);
  assert.doesNotMatch(source, /<dt>활동 기간<\/dt>/);
  assert.doesNotMatch(source, /<dt>역할<\/dt>/);
  assert.doesNotMatch(source, /채용공고 \/ 질문/);
  assert.doesNotMatch(source, /질문 \/ 문항/);
});

test("추천 결과 헤더는 첫 경험으로만 이동하는 활동 링크를 표시하지 않는다", () => {
  assert.doesNotMatch(source, /<ExternalLink/);
  assert.doesNotMatch(
    source,
    /href=\{`\/experiences\/\$\{experience\.id\}`\}/,
  );
});

test("제목과 활용 목적 사이에는 한 줄의 hairline만 사용한다", () => {
  assert.match(
    styles,
    /\.recommendation-result \.detail-header\s*\{[^}]*border-bottom:\s*1px solid/,
  );
  assert.match(
    styles,
    /\.recommendation-result \.detail-header \+ \.detail-section\s*\{[^}]*border-top:\s*0/,
  );
});
