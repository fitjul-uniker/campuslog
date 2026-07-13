"use client";

import { useEffect, useState } from "react";

import { getCampusLogProfile } from "@/lib/auth/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type AccountProfile = {
  nickname: string;
  avatarUrl: string | null;
  initial: string;
};

const FALLBACK_PROFILE: AccountProfile = {
  nickname: "계정",
  avatarUrl: null,
  initial: "계",
};

let accountProfileRequest: Promise<AccountProfile> | null = null;
let activeProfileConsumers = 0;

function getTrustedGoogleAvatarUrl(metadata: Record<string, unknown>) {
  const candidates = [metadata.avatar_url, metadata.picture];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    try {
      const url = new URL(candidate);
      const hostname = url.hostname.toLowerCase();
      const isGoogleUserContent =
        hostname === "googleusercontent.com" ||
        hostname.endsWith(".googleusercontent.com");

      if (url.protocol === "https:" && isGoogleUserContent) {
        return url.toString();
      }
    } catch {
      // Invalid or non-URL metadata falls through to the monogram avatar.
    }
  }

  return null;
}

function getInitial(nickname: string) {
  return Array.from(nickname.trim())[0]?.toLocaleUpperCase("ko-KR") ?? "계";
}

async function loadAccountProfile(): Promise<AccountProfile> {
  const supabase = createSupabaseBrowserClient();

  if (!supabase) {
    return FALLBACK_PROFILE;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return FALLBACK_PROFILE;
  }

  const metadata = data.user.user_metadata as Record<string, unknown>;
  const profile = getCampusLogProfile(metadata);
  const nickname = profile?.nickname ?? FALLBACK_PROFILE.nickname;

  return {
    nickname,
    avatarUrl: getTrustedGoogleAvatarUrl(metadata),
    initial: getInitial(nickname),
  };
}

function getAccountProfileRequest() {
  accountProfileRequest ??= loadAccountProfile().catch(() => FALLBACK_PROFILE);
  return accountProfileRequest;
}

export function useAccountProfile() {
  const [profile, setProfile] = useState<AccountProfile>(FALLBACK_PROFILE);

  useEffect(() => {
    let isMounted = true;
    activeProfileConsumers += 1;

    void getAccountProfileRequest().then((nextProfile) => {
      if (isMounted) {
        setProfile(nextProfile);
      }
    });

    return () => {
      isMounted = false;
      activeProfileConsumers = Math.max(0, activeProfileConsumers - 1);

      if (activeProfileConsumers === 0) {
        accountProfileRequest = null;
      }
    };
  }, []);

  return profile;
}
