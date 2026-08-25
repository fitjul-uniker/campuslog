import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RecommendationLoadingLayout = "empty" | "form";

export const getRecommendationLoadingLayout = cache(
  async (): Promise<RecommendationLoadingLayout> => {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return "empty";
    }

    const { count, error } = await supabase
      .from("experiences")
      .select("id", { count: "exact", head: true });

    if (error) {
      return "empty";
    }

    return (count ?? 0) > 0 ? "form" : "empty";
  },
);
