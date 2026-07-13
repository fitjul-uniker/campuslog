export const AUTH_DEFAULT_RETURN_TO = "/";
export const AUTH_MIN_PASSWORD_LENGTH = 8;
export const AUTH_ONBOARDING_PATH = "/onboarding";

export const AUTH_ERROR_MESSAGES = {
  CONFIGURATION_MISSING:
    "Supabase 환경 변수가 아직 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.",
  INVALID_INPUT: "입력값을 다시 확인해주세요.",
  INVALID_EMAIL: "이메일 형식을 확인해주세요.",
  INVALID_PASSWORD: `비밀번호는 ${AUTH_MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`,
  INVALID_NAME: "이름을 확인해주세요.",
  INVALID_NICKNAME: "닉네임을 확인해주세요.",
  INVALID_CREDENTIALS: "이메일 또는 비밀번호를 확인해주세요.",
  SIGNUP_FAILED:
    "회원가입을 완료하지 못했습니다. 입력값을 확인하거나 잠시 후 다시 시도해주세요.",
  OAUTH_FAILED: "Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.",
  CALLBACK_FAILED: "로그인을 완료하지 못했습니다. 다시 시도해주세요.",
  PROFILE_SAVE_FAILED:
    "프로필을 저장하지 못했습니다. 입력값을 유지했으니 다시 시도해주세요.",
  SESSION_REQUIRED: "로그인이 필요한 화면입니다.",
  RATE_LIMITED: "요청이 많습니다. 잠시 후 다시 시도해주세요.",
  NETWORK_ERROR: "네트워크 상태를 확인한 뒤 다시 시도해주세요.",
  UNKNOWN_ERROR: "예상하지 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
} as const;

export const AUTH_NOTICE_MESSAGES = {
  EMAIL_CONFIRMATION_REQUIRED:
    "가입 정보를 저장했습니다. 메일함에서 이메일 인증을 완료해주세요.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES;
export type AuthNoticeCode = keyof typeof AUTH_NOTICE_MESSAGES;

export type AuthFeedback =
  | {
      status: "error";
      code: AuthErrorCode;
      message: string;
    }
  | {
      status: "success";
      code: AuthNoticeCode;
      message: string;
    };

export type AuthFormValues = {
  email?: string;
  fullName?: string;
  nickname?: string;
};

export type AuthFormState =
  | ({
      status: "idle";
    } & AuthFormValues)
  | ({
      status: "error";
      code: AuthErrorCode;
      message: string;
    } & AuthFormValues)
  | ({
      status: "success";
      code: AuthNoticeCode;
      message: string;
    } & AuthFormValues);

export const initialAuthFormState: AuthFormState = {
  status: "idle",
};

export function getAuthErrorFeedback(
  code: string | null | undefined,
): AuthFeedback | null {
  if (!code || !(code in AUTH_ERROR_MESSAGES)) {
    return null;
  }

  const authCode = code as AuthErrorCode;

  return {
    status: "error",
    code: authCode,
    message: AUTH_ERROR_MESSAGES[authCode],
  };
}

export function getAuthNoticeFeedback(
  code: string | null | undefined,
): AuthFeedback | null {
  if (!code || !(code in AUTH_NOTICE_MESSAGES)) {
    return null;
  }

  const noticeCode = code as AuthNoticeCode;

  return {
    status: "success",
    code: noticeCode,
    message: AUTH_NOTICE_MESSAGES[noticeCode],
  };
}

export function createAuthErrorState(
  code: AuthErrorCode,
  values?: string | AuthFormValues,
): AuthFormState {
  const formValues =
    typeof values === "string" ? { email: values } : (values ?? {});

  return {
    status: "error",
    code,
    message: AUTH_ERROR_MESSAGES[code],
    ...formValues,
  };
}

export function createAuthSuccessState(
  code: AuthNoticeCode,
  values?: string | AuthFormValues,
): AuthFormState {
  const formValues =
    typeof values === "string" ? { email: values } : (values ?? {});

  return {
    status: "success",
    code,
    message: AUTH_NOTICE_MESSAGES[code],
    ...formValues,
  };
}

export function normalizeEmail(value: FormDataEntryValue | string | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizePassword(value: FormDataEntryValue | string | null) {
  return typeof value === "string" ? value : "";
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPassword(value: string) {
  return value.length >= AUTH_MIN_PASSWORD_LENGTH;
}

export function normalizeReturnTo(
  value: FormDataEntryValue | string | null | undefined,
) {
  if (typeof value !== "string") {
    return AUTH_DEFAULT_RETURN_TO;
  }

  const trimmedValue = value.trim();

  if (
    !trimmedValue.startsWith("/") ||
    trimmedValue.startsWith("//") ||
    trimmedValue.includes("\\")
  ) {
    return AUTH_DEFAULT_RETURN_TO;
  }

  try {
    const parsedUrl = new URL(trimmedValue, "https://campuslog.local");
    const normalizedPath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

    if (!isAllowedReturnPath(parsedUrl.pathname)) {
      return AUTH_DEFAULT_RETURN_TO;
    }

    return normalizedPath;
  } catch {
    return AUTH_DEFAULT_RETURN_TO;
  }
}

export function isAllowedReturnPath(pathname: string) {
  if (pathname === "/") {
    return true;
  }

  const allowedPrefixes = [
    "/dashboard",
    "/activities",
    "/experiences",
    "/recommend",
  ];

  return allowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function createLoginPath(
  returnTo: string,
  errorCode?: AuthErrorCode,
) {
  return createAuthPagePath("/login", returnTo, errorCode);
}

export function createSignupPath(
  returnTo: string,
  errorCode?: AuthErrorCode,
) {
  return createAuthPagePath("/signup", returnTo, errorCode);
}

function createAuthPagePath(
  pathname: "/login" | "/signup",
  returnTo: string,
  errorCode?: AuthErrorCode,
) {
  const authUrl = new URL(`https://campuslog.local${pathname}`);
  const normalizedReturnTo = normalizeReturnTo(returnTo);

  if (normalizedReturnTo !== AUTH_DEFAULT_RETURN_TO) {
    authUrl.searchParams.set("returnTo", normalizedReturnTo);
  }

  if (errorCode) {
    authUrl.searchParams.set("authError", errorCode);
  }

  return `${authUrl.pathname}${authUrl.search}`;
}

export function createOnboardingPath(returnTo: string) {
  const onboardingUrl = new URL(
    `https://campuslog.local${AUTH_ONBOARDING_PATH}`,
  );
  const normalizedReturnTo = normalizeReturnTo(returnTo);

  if (normalizedReturnTo !== AUTH_DEFAULT_RETURN_TO) {
    onboardingUrl.searchParams.set("returnTo", normalizedReturnTo);
  }

  return `${onboardingUrl.pathname}${onboardingUrl.search}`;
}
