import "server-only";

/**
 * CampusLog AI route routing.
 *
 * Keep the selected model and reasoning baseline in one server-only config so
 * the model benchmark decision can be audited without changing prompts or
 * response schemas. This module must never be imported by client components.
 */
export const AI_MODELS = {
  activitySynthesis: "gpt-5.6-luna",
  analysis: "gpt-5.6-luna",
  answerDrafts: "gpt-5.6-luna",
  evidenceFollowups: "gpt-5.6-luna",
  recommendation: "gpt-4.1-mini",
} as const;

// Matches the no-reasoning baseline used in the CampusLog Luna A/B benchmark.
export const LUNA_REASONING = {
  effort: "none",
} as const;
