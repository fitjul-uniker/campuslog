import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionSource = await readFile(
  new URL("./profile-actions.ts", import.meta.url),
  "utf8",
);
const stateSource = await readFile(
  new URL("./profile-action-state.ts", import.meta.url),
  "utf8",
);

test('"use server" 프로필 action 모듈은 async 함수만 런타임 export한다', () => {
  assert.match(actionSource, /^"use server";/);
  assert.doesNotMatch(actionSource, /export const /);
  assert.match(actionSource, /export async function updateNicknameAction/);
  assert.match(actionSource, /export async function completeSignupProfileAction/);
  assert.match(stateSource, /export const initialNicknameUpdateState/);
});
