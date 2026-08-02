export const EXPERIENCE_INPUT_LIMITS = {
  title: 200,
  period: 120,
  role: 1_000,
  description: 8_000,
  achievements: 4_000,
} as const;

export const EXPERIENCE_LENGTH_GUIDANCE_RATIO = 0.9;

export function getExperienceLengthState(value: string, limit: number) {
  const count = value.length;

  return {
    count,
    remaining: Math.max(limit - count, 0),
    excess: Math.max(count - limit, 0),
    showGuidance: count >= Math.ceil(limit * EXPERIENCE_LENGTH_GUIDANCE_RATIO),
    isAtLimit: count === limit,
    isOverLimit: count > limit,
  };
}
