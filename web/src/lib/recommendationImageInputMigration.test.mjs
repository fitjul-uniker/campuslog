import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL(
    "../../../supabase/migrations/20260724000200_recommendation_image_input.sql",
    import.meta.url,
  ),
  "utf8",
);
const repository = await readFile(
  new URL("./repositories/campuslogRepository.ts", import.meta.url),
  "utf8",
);

test("추천 기록은 이미지 원본 없이 입력 출처만 저장한다", () => {
  assert.match(migration, /input_source text not null default 'text'/);
  assert.match(
    migration,
    /input_source in \('text', 'image', 'text_and_image'\)/,
  );
  assert.doesNotMatch(migration, /data_url|base64|storage_path/);
});

test("추천 repository는 입력 출처를 읽고 저장한다", () => {
  assert.match(repository, /input_source\?:/);
  assert.match(repository, /inputSource:\s*row\.input_source/);
  assert.match(repository, /input_source:\s*result\.inputSource/);
});
