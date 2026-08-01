"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  return createBrowserClient(config.url, config.anonKey, {
    // A single auth client coordinates refresh-token access across every
    // repository consumer mounted in the same browser tab.
    isSingleton: true,
  });
}
