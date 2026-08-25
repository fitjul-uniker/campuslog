import type { RecommendationResult } from "./types";

const IMAGE_COVER_LETTER_TITLE_MAX_LENGTH = 60;
const IMAGE_COVER_LETTER_KEYWORD_LIMIT = 3;

export const IMAGE_COVER_LETTER_TITLE_FALLBACK =
  "자기소개서 문항과 경험 적합도 분석";
export const LONG_JD_TITLE_FALLBACK = "JD 요구사항과 경험 적합도 분석";

type RecommendationTitleSource = Pick<
  RecommendationResult,
  "purpose" | "prompt" | "inputSource" | "extractedRequirements"
>;

function normalizeTitleText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[•·▪▫◦\-–—]+\s*/, "")
    .replace(/[.!?。！？]+$/, "")
    .trim();
}

function getImageCoverLetterTitle(
  result: RecommendationTitleSource,
): string {
  const intent = normalizeTitleText(result.extractedRequirements.intent);

  if (
    intent.length > 0 &&
    intent.length <= IMAGE_COVER_LETTER_TITLE_MAX_LENGTH
  ) {
    return intent;
  }

  const keywordTitle = result.extractedRequirements.keywords
    .map(normalizeTitleText)
    .filter((keyword, index, keywords) => {
      return (
        keyword.length > 0 &&
        keyword.length <= 20 &&
        keywords.indexOf(keyword) === index
      );
    })
    .slice(0, IMAGE_COVER_LETTER_KEYWORD_LIMIT)
    .join(" · ");

  return keywordTitle.length > 0 &&
    keywordTitle.length <= IMAGE_COVER_LETTER_TITLE_MAX_LENGTH
    ? keywordTitle
    : IMAGE_COVER_LETTER_TITLE_FALLBACK;
}

export function getRecommendationResultTitle(
  result: RecommendationTitleSource,
): string {
  const prompt = result.prompt.trim();

  if (
    result.purpose === "cover_letter" &&
    result.inputSource === "image"
  ) {
    return getImageCoverLetterTitle(result);
  }

  if (result.purpose === "jd" && prompt.length > 240) {
    const intent = normalizeTitleText(result.extractedRequirements.intent);

    return intent.length > 0 && intent.length <= 100
      ? intent
      : LONG_JD_TITLE_FALLBACK;
  }

  return result.prompt;
}
