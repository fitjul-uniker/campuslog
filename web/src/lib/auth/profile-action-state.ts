export type NicknameUpdateState =
  | { status: "idle" }
  | { status: "success"; nickname: string }
  | { status: "error"; message: string; nickname: string };

export const initialNicknameUpdateState: NicknameUpdateState = {
  status: "idle",
};
