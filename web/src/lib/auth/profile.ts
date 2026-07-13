export const CAMPUSLOG_PROFILE_VERSION = 1;
export const AUTH_FULL_NAME_MAX_LENGTH = 40;
export const AUTH_NICKNAME_MAX_LENGTH = 20;

export type CampusLogProfile = {
  version: typeof CAMPUSLOG_PROFILE_VERSION;
  fullName: string;
  nickname: string;
  completedAt: string;
};

type UserMetadata = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasControlCharacters(value: string) {
  return /[\u0000-\u001f\u007f]/.test(value);
}

export function normalizeProfileText(
  value: FormDataEntryValue | string | null | undefined,
) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function isValidFullName(value: string) {
  const normalizedValue = normalizeProfileText(value);

  return (
    normalizedValue.length >= 1 &&
    normalizedValue.length <= AUTH_FULL_NAME_MAX_LENGTH &&
    !hasControlCharacters(normalizedValue)
  );
}

export function isValidNickname(value: string) {
  const normalizedValue = normalizeProfileText(value);

  return (
    normalizedValue.length >= 1 &&
    normalizedValue.length <= AUTH_NICKNAME_MAX_LENGTH &&
    !hasControlCharacters(normalizedValue)
  );
}

export function createCampusLogProfile(
  fullName: string,
  nickname: string,
): CampusLogProfile {
  return {
    version: CAMPUSLOG_PROFILE_VERSION,
    fullName: normalizeProfileText(fullName),
    nickname: normalizeProfileText(nickname),
    completedAt: new Date().toISOString(),
  };
}

export function getCampusLogProfile(
  metadata: UserMetadata | null | undefined,
): CampusLogProfile | null {
  const profile = metadata?.campuslog_profile;

  if (!isRecord(profile)) {
    return null;
  }

  const { version, fullName, nickname, completedAt } = profile;

  if (
    version !== CAMPUSLOG_PROFILE_VERSION ||
    typeof fullName !== "string" ||
    typeof nickname !== "string" ||
    typeof completedAt !== "string" ||
    !isValidFullName(fullName) ||
    !isValidNickname(nickname) ||
    Number.isNaN(Date.parse(completedAt))
  ) {
    return null;
  }

  return {
    version,
    fullName: normalizeProfileText(fullName),
    nickname: normalizeProfileText(nickname),
    completedAt,
  };
}

export function hasCompletedCampusLogProfile(
  metadata: UserMetadata | null | undefined,
) {
  return getCampusLogProfile(metadata) !== null;
}

export function getProfileDefaults(
  metadata: UserMetadata | null | undefined,
) {
  const profile = getCampusLogProfile(metadata);

  if (profile) {
    return {
      fullName: profile.fullName,
      nickname: profile.nickname,
    };
  }

  const providerName = metadata?.full_name ?? metadata?.name;

  return {
    fullName:
      typeof providerName === "string"
        ? normalizeProfileText(providerName).slice(0, AUTH_FULL_NAME_MAX_LENGTH)
        : "",
    nickname: "",
  };
}
