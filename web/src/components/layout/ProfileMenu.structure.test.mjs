import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const profileMenuPath = new URL("./ProfileMenu.tsx", import.meta.url);
const profileActionPath = new URL(
  "../../lib/auth/profile-actions.ts",
  import.meta.url,
);
const profileHookPath = new URL(
  "../../hooks/use-account-profile.ts",
  import.meta.url,
);

test("account menu provides an accessible nickname edit flow", async () => {
  const source = await readFile(profileMenuPath, "utf8");

  assert.match(source, />닉네임 수정</);
  assert.match(source, /<dialog/);
  assert.match(source, /aria-labelledby="nickname-edit-title"/);
  assert.match(source, /name="nickname"/);
  assert.match(source, /maxLength=\{AUTH_NICKNAME_MAX_LENGTH\}/);
  assert.match(source, /aria-invalid/);
  assert.match(source, /role="alert"/);
  assert.match(source, /useFormStatus/);
  assert.match(source, /requestAnimationFrame\(\(\) => triggerRef\.current\?\.focus\(\)\)/);
});

test("nickname updates preserve the existing private profile metadata", async () => {
  const [action, hook] = await Promise.all([
    readFile(profileActionPath, "utf8"),
    readFile(profileHookPath, "utf8"),
  ]);

  assert.match(action, /getCampusLogProfile\(user\.user_metadata\)/);
  assert.match(
    action,
    /campuslog_profile:\s*\{\s*\.\.\.profile,\s*nickname,/s,
  );
  assert.match(action, /isValidNickname\(nickname\)/);
  assert.match(hook, /campuslog:profile-updated/);
  assert.match(hook, /initial:\s*getInitial\(event\.detail\.nickname\)/);
});
