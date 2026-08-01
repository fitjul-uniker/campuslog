"use client";

import { useEffect } from "react";

import { createLoginPath } from "@/lib/auth/contract";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

let isRedirectingToLogin = false;

function redirectToLogin() {
  if (isRedirectingToLogin || typeof window === "undefined") {
    return;
  }

  isRedirectingToLogin = true;
  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.replace(createLoginPath(returnTo, "SESSION_REQUIRED"));
}

export function useAuthSessionGuard() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (isMounted && event === "SIGNED_OUT") {
        redirectToLogin();
      }
    });

    void supabase.auth.getSession().then(({ error }) => {
      if (isMounted && error) {
        redirectToLogin();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
}
