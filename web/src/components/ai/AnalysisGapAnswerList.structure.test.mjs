import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./AnalysisGapAnswerList.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("부족한 정보는 질문별 controlled MorphSurface를 사용한다", () => {
  assert.match(source, /import \{ MorphSurface \}/);
  assert.match(source, /openGapId/);
  assert.match(source, /<MorphSurface/);
  assert.match(source, /const isOpen = openGapId === item\.id/);
  assert.match(source, /isOpen=\{isOpen\}/);
  assert.match(source, /setOpenGapId\(open \? item\.id : null\)/);
});

test("저장 성공 때만 완료 상태를 보이고 surface를 닫는다", () => {
  assert.match(
    source,
    /async function handleSaveAnswer[\s\S]*Promise<boolean>/,
  );
  assert.match(source, /return false/);
  assert.match(source, /return true/);
  assert.match(source, /const didSave = await handleSaveAnswer\(item\)/);
  assert.match(source, /if \(didSave\)/);
  assert.match(source, /setOpenGapId\(\(current\)/);
});

test("textarea는 포커스와 키보드 제출 계약을 유지한다", () => {
  assert.match(source, /focusTargetId=/);
  assert.match(source, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(source, /handleSaveAnswer\(item\)/);
  assert.match(source, /role="alert"/);
});

test("부족 정보 질문은 흰색 command surface와 간결한 편집 액션을 사용한다", () => {
  assert.match(source, /triggerMeta=\{getCategoryLabel\(item\.category\)\}/);
  assert.match(source, /analysis-gap-answer-meta/);
  assert.match(
    source,
    /\{statusText \? <span>\{statusText\}<\/span> : null\}/,
  );
  assert.match(source, /draftAnswer\.length/);
  assert.doesNotMatch(source, /<span>⌘\/Ctrl \+ Enter<\/span>/);
  assert.doesNotMatch(source, /:\s*"답변 없음";/);
  assert.match(source, /analysis-gap-save-button/);
  assert.doesNotMatch(source, /<Save /);

  const surface = styles.match(/\.morph-surface \{([\s\S]*?)\}/)?.[1] ?? "";
  const input =
    styles.match(/\.analysis-gap-answer-input \{([\s\S]*?)\}/)?.[1] ?? "";

  assert.match(surface, /background:\s*#fff/);
  assert.match(surface, /transform-origin:\s*50% 100%/);
  assert.doesNotMatch(input, /repeating-linear-gradient/);
});

test("질문 표면은 16px 간격을 유지하고 모바일에서도 서로 겹치지 않는다", () => {
  const list =
    styles.match(/\.analysis-gap-answer-list \{([\s\S]*?)\}/)?.[1] ?? "";
  const openSurface =
    styles.match(
      /\.morph-surface\[data-open="true"\] \{([\s\S]*?)\}/,
    )?.[1] ?? "";

  assert.match(list, /gap:\s*16px/);
  assert.match(openSurface, /z-index:\s*1/);
  assert.doesNotMatch(
    styles,
    /\.morph-surface\[data-open="true"\]\[data-reduced-motion="false"\][\s\S]*?translate:/,
  );
});
