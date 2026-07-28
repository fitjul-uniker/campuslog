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
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("경험 작성과 수정은 하나의 frosted workspace 안에 near-solid 폼을 둔다", () => {
  assert.match(formSource, /experience-form liquid-form/);
  assert.match(newExperienceSource, /form-panel liquid-workspace/);
  assert.match(editExperienceSource, /form-panel liquid-workspace/);
});

test("독립 AI 분석과 임베디드 분석은 서로 다른 Liquid Glass 밀도를 사용한다", () => {
  assert.match(
    analysisClientSource,
    /detail-panel liquid-section/,
  );
  assert.match(
    resultSource,
    /isEmbedded[\s\S]*"is-embedded liquid-content-plate"[\s\S]*"liquid-section"/,
  );
});

test("첨부 목록은 상세 내부에서 안정적인 content plate로 읽힌다", () => {
  assert.match(
    attachmentsSource,
    /experience-attachments-section liquid-content-plate/,
  );
  assert.match(
    styles,
    /\.experience-attachments-section\.liquid-content-plate/,
  );
});
