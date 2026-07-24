import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationSource = await readFile(
  new URL(
    "../../../supabase/migrations/20260724000100_experience_attachments.sql",
    import.meta.url,
  ),
  "utf8",
);

test("첨부 메타데이터는 경험과 사용자에 귀속되고 경험 삭제 시 함께 삭제된다", () => {
  assert.match(
    migrationSource,
    /create table(?: if not exists)? public\.experience_attachments/i,
  );
  assert.match(
    migrationSource,
    /foreign key \(user_id, experience_id\)[\s\S]*references public\.experiences[\s\S]*on delete cascade/i,
  );
  assert.match(
    migrationSource,
    /alter table public\.experience_attachments enable row level security/i,
  );
  assert.match(migrationSource, /auth\.uid\(\) = user_id/i);
});

test("Storage bucket은 비공개이며 사용자 폴더에만 접근할 수 있다", () => {
  assert.match(migrationSource, /'experience-attachments'/);
  assert.match(migrationSource, /public[\s\S]*false/i);
  assert.match(migrationSource, /file_size_limit[\s\S]*5242880/i);
  assert.match(
    migrationSource,
    /image\/jpeg[\s\S]*image\/png[\s\S]*image\/webp[\s\S]*application\/pdf/i,
  );
  assert.match(
    migrationSource,
    /\(storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)::text\)/i,
  );
});
