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

test("자기소개서 초안은 사용자가 글자 수 제한을 직접 입력할 수 있다", () => {
  assert.match(source, /지원서 글자 수 제한/);
  assert.match(source, /CUSTOM_ANSWER_DRAFT_MIN_CHARACTERS/);
  assert.match(source, /CUSTOM_ANSWER_DRAFT_MAX_CHARACTERS/);
  assert.match(source, /customCharacterCount/);
  assert.match(styles, /\.answer-draft-custom-length/);
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
  assert.match(source, /result\.purpose === "jd"/);
  assert.match(source, /result\.prompt\.trim\(\)\.length > 240/);
  assert.match(source, /JD 요구사항과 경험 적합도 분석/);
  assert.match(source, /<h2 id="recommendation-title">\{resultTitle\}<\/h2>/);
  assert.match(source, /입력한 JD 보기/);
  assert.match(source, /recommendation-source-disclosure-content/);
  assert.match(styles, /\.recommendation-source-disclosure/);
  assert.match(source, /recommendation-result-generated-at/);
  assert.doesNotMatch(source, /<dt>추천 생성일<\/dt>/);
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
