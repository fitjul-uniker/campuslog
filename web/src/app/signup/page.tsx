import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { normalizeReturnTo } from "@/lib/auth/contract";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type AuthPageSearchParams = Promise<{
  authError?: string | string[];
  authNotice?: string | string[];
  returnTo?: string | string[];
}>;

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: AuthPageSearchParams;
}) {
  const params = await searchParams;
  const returnTo = normalizeReturnTo(getSearchParam(params.returnTo));
  const user = await getCurrentUser();

  if (user) {
    redirect(returnTo);
  }

  return (
    <AuthForm
      authError={getSearchParam(params.authError)}
      authNotice={getSearchParam(params.authNotice)}
      isSupabaseConfigured={isSupabaseConfigured()}
      mode="signup"
      returnTo={returnTo}
    />
  );
}
