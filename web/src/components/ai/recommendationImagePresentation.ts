type SizedFile = {
  size: number;
};

export function getRecommendationImageSelectionSummary(
  files: readonly SizedFile[],
  maxCount: number,
) {
  return {
    heading: `첨부 이미지 (${files.length}/${maxCount})`,
    totalBytes: files.reduce((sum, file) => sum + file.size, 0),
  };
}
