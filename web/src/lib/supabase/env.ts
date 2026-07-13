export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export function isDevelopmentUiPreview() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_CAMPUSLOG_UI_PREVIEW === "1"
  );
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  if (isDevelopmentUiPreview()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return getSupabasePublicConfig() !== null;
}
