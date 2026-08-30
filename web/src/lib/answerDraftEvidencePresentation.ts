const RECOMMENDATION_MATCH_EVIDENCE_PREFIX = /^추천 매칭 근거\s*:\s*/;

export function getAnswerDraftRecommendationEvidence(
  matchedEvidence: string[],
): string[] {
  const seenEvidence = new Set<string>();

  return matchedEvidence
    .map((item) =>
      item.trim().replace(RECOMMENDATION_MATCH_EVIDENCE_PREFIX, "").trim(),
    )
    .filter(Boolean)
    .filter((item) => {
      if (seenEvidence.has(item)) {
        return false;
      }

      seenEvidence.add(item);
      return true;
    });
}
