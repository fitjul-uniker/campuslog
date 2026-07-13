"use server";

import { redirect } from "next/navigation";

import {
  type AuthFormState,
  createAuthErrorState,
  normalizeReturnTo,
} from "@/lib/auth/contract";
import {
  createCampusLogProfile,
  isValidFullName,
  isValidNickname,
  normalizeProfileText,
} from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
