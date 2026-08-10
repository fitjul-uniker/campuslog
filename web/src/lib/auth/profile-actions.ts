"use server";

import { redirect } from "next/navigation";

import {
  type AuthFormState,
  createAuthErrorState,
  normalizeReturnTo,
} from "@/lib/auth/contract";
import {
  createCampusLogProfile,
  getCampusLogProfile,
  isValidFullName,
  isValidNickname,
  normalizeProfileText,
} from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NicknameUpdateState =
  | { status: "idle" }
  | { status: "success"; nickname: string }
  | { status: "error"; message: string; nickname: string };

export const initialNicknameUpdateState: NicknameUpdateState = {
  status: "idle",
};

export async function updateNicknameAction(
  previousState: NicknameUpdateState,
  formData: FormData,
): Promise<NicknameUpdateState> {
  void previousState;

  const nickname = normalizeProfileText(formData.get("nickname"));

  if (!isValidNickname(nickname)) {
    return {
      status: "error",
      message: "닉네임은 1~20자로 입력해주세요.",
      nickname,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "프로필을 저장할 수 없습니다. 잠시 후 다시 시도해주세요.",
      nickname,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "로그인 세션이 만료되었습니다. 다시 로그인해주세요.",
      nickname,
    };
  }

  const profile = getCampusLogProfile(user.user_metadata);

  if (!profile) {
    return {
      status: "error",
      message: "프로필 정보를 확인할 수 없습니다.",
      nickname,
    };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      campuslog_profile: {
        ...profile,
        nickname,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message: "닉네임을 저장하지 못했습니다. 다시 시도해주세요.",
      nickname,
    };
  }

  return { status: "success", nickname };
}

export async function completeSignupProfileAction(
  previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  void previousState;

  const fullName = normalizeProfileText(formData.get("fullName"));
  const nickname = normalizeProfileText(formData.get("nickname"));
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  const formValues = { fullName, nickname };

  if (!isValidFullName(fullName)) {
    return createAuthErrorState("INVALID_NAME", formValues);
  }

  if (!isValidNickname(nickname)) {
    return createAuthErrorState("INVALID_NICKNAME", formValues);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return createAuthErrorState("CONFIGURATION_MISSING", formValues);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return createAuthErrorState("SESSION_REQUIRED", formValues);
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      campuslog_profile: createCampusLogProfile(fullName, nickname),
    },
  });

  if (error) {
    return createAuthErrorState("PROFILE_SAVE_FAILED", formValues);
  }

  redirect(returnTo);
}
