import { redirect } from "next/navigation";

import { ProfileSetupForm } from "@/components/auth/ProfileSetupForm";
import {
  createSignupPath,
  normalizeReturnTo,
} from "@/lib/auth/contract";
import {
  getProfileDefaults,
  hasCompletedCampusLogProfile,
} from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/supabase/server";

type OnboardingPageSearchParams = Promise<{
  returnTo?: string | string[];
}>;

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: OnboardingPageSearchParams;
}) {
  const params = await searchParams;
  const returnTo = normalizeReturnTo(getSearchParam(params.returnTo));
  const user = await getCurrentUser();

  if (!user) {
    redirect(createSignupPath(returnTo, "SESSION_REQUIRED"));
  }

  if (hasCompletedCampusLogProfile(user.user_metadata)) {
    redirect(returnTo);
  }

  const defaults = getProfileDefaults(user.user_metadata);

  return (
    <ProfileSetupForm
      initialFullName={defaults.fullName}
      initialNickname={defaults.nickname}
      returnTo={returnTo}
    />
  );
}
