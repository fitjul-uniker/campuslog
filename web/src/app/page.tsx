import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown } from "lucide-react";

import { AuthForm } from "@/components/auth/AuthForm";
import { HeroBook3D } from "@/components/hero/HeroBook3D";
import { LandingScrollController } from "@/components/landing/LandingScrollController";
import LayoutTextFlipDemo from "@/components/layout-text-flip-demo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { createOnboardingPath } from "@/lib/auth/contract";
import { hasCompletedCampusLogProfile } from "@/lib/auth/profile";

type HomePageSearchParams = Promise<{
  authError?: string | string[];
  authMode?: string | string[];
  authNotice?: string | string[];
}>;

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function AuthenticatedCover() {
  return (
    <section className="cover-scene" aria-labelledby="cover-title">
      <Link
        href="/dashboard"
        className="closed-notebook"
        aria-label="대시보드로 이동"
      >
        <HeroBook3D />
        <h1 id="cover-title" className="sr-only">
          CampusLog
        </h1>
      </Link>
    </section>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: HomePageSearchParams;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user && !hasCompletedCampusLogProfile(user.user_metadata)) {
    redirect(createOnboardingPath("/"));
  }

  if (user) {
    return <AuthenticatedCover />;
  }

  const mode = getSearchParam(params.authMode) === "signup" ? "signup" : "login";
  const nextMode = mode === "login" ? "signup" : "login";

  return (
    <div className="public-landing">
      <LandingScrollController />

      <Link className="landing-brand-mark" href="/" aria-label="CampusLog 홈">
        CampusLog
      </Link>

      <section className="landing-brand-screen" aria-labelledby="landing-title">
        <LayoutTextFlipDemo />

        <a
          className="landing-scroll-link"
          href={`#${mode}-title`}
          aria-label="아래로 스크롤하여 로그인 또는 회원가입"
        >
          <span>스크롤하여 로그인 또는 회원가입</span>
          <ArrowDown aria-hidden="true" />
        </a>
      </section>

      <section
        id="auth"
        className="landing-auth-section"
        aria-label="계정 인증"
      >
        <AuthForm
          key={mode}
          authError={getSearchParam(params.authError)}
          authNotice={getSearchParam(params.authNotice)}
          headingLevel="h2"
          isSupabaseConfigured={isSupabaseConfigured()}
          mode={mode}
          returnTo="/"
          switchHref={`/?authMode=${nextMode}#${nextMode}-title`}
        />
      </section>
    </div>
  );
}
