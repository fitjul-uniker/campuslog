# CampusLog Auth Contract

## 상태

- 기준 브랜치: `feature/auth-foundation`, 진입 UX 변경 브랜치: `ux/auth-first-entry-flow`
- 범위: Supabase Auth 기반 로그인, 회원가입, 로그아웃, Google OAuth 시작, OAuth·이메일 확인 callback, 이름·닉네임 온보딩, 보호 경로 redirect
- 사용자별 DB schema와 RLS foundation은 구현되어 있으며, 이 문서에서는 Auth 사용자 metadata에 저장하는 최소 비공개 프로필 계약만 추가로 정의합니다.
- UI 원칙: 비로그인은 `/` 좌측 상단의 `CampusLog` 워드마크와 중앙 순환 기록 문구에서 작은 휠 입력 또는 링크로 다음 viewport의 중앙 카드에 이동해 인증합니다. 로그인 카드에는 별도 영문 eyebrow와 소개 문구를 두지 않습니다. 회원가입은 방식 선택 후 이메일만 자격 증명을 받고, 이메일·Google 모두 이름·닉네임 단계를 완료한 뒤 기존 v1.1 3D 책 커버 또는 안전한 `returnTo`를 표시합니다.

## 환경 변수

`web/.env.local`에는 실제 값을 넣고, 저장소에는 커밋하지 않습니다.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CAMPUSLOG_UI_PREVIEW=0
```

운영 메모:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 브라우저에서 쓰는 공개 client 설정입니다.
- `service_role` 또는 `sb_secret_...` 관리자 키는 현재 구현에서 사용하지 않으며, 브라우저나 `NEXT_PUBLIC_` 환경 변수에 넣지 않습니다.
- Vercel에는 같은 두 환경 변수를 Production / Preview 환경에 등록하고, 변경 후 재배포합니다.
- `NEXT_PUBLIC_CAMPUSLOG_UI_PREVIEW=1`은 로컬 `development`에서만 보호 페이지를 인증 없이 렌더링하는 디자인 점검용입니다. 이때 Supabase client를 만들지 않고 localStorage adapter를 사용하며, 보호 API는 우회하지 않습니다. production에서는 값이 있어도 무시합니다.

## 공개 경로와 보호 경로

| 경로 | 정책 |
| --- | --- |
| `/` | 공개. 비로그인은 순환 기록 문구와 중앙 인증 카드, 프로필을 완료한 로그인 사용자는 3D 책 커버 표시. 책 클릭 시 `/dashboard`로 진입 |
| `/login`, `/signup` | 공개 fallback. 프로필을 완료한 로그인 사용자는 안전한 `returnTo` 또는 `/`의 책 커버로, 미완료 사용자는 `/onboarding`으로 이동 |
| `/auth/callback` | 공개. Supabase OAuth·이메일 확인 code를 session으로 교환하고 실제 사용자 metadata의 프로필 완료 여부로 다음 경로 결정 |
| `/onboarding` | 세션 필요. 미완료 계정의 이름·닉네임을 저장하며 완료 metadata가 있으면 안전한 `returnTo`로 이동 |
| `/dashboard` | 로그인 필요 |
| `/activities/**` | 로그인 필요 |
| `/experiences/**` | 로그인 필요 |
| `/recommend/**` | 로그인 필요 |
| `/api/analyze`, `/api/recommend`, `/api/synthesize-activity` | 로그인 필요. 비로그인은 JSON error 반환 |

## Redirect

- 보호 화면에 비로그인으로 접근하면 `/login?returnTo=...&authError=SESSION_REQUIRED`로 이동합니다.
- `returnTo`는 같은 앱의 상대 경로만 허용합니다.
- 허용 경로는 기본 책 표지인 `/`와 보호 화면인 `/dashboard`, `/activities/**`, `/experiences/**`, `/recommend/**`입니다.
- 허용되지 않은 값, 외부 URL, `//` 시작 경로, 역슬래시 포함 경로는 `/`로 정규화합니다.
- 이메일 가입은 `이메일·비밀번호 → 이름 → 닉네임`을 모두 받은 뒤 `signUp`의 추가 metadata로 프로필을 함께 저장합니다. 즉시 세션이 생기면 안전한 `returnTo` 또는 `/`로 이동합니다.
- 이메일 확인이 필요하면 callback이 `/onboarding`을 거치며, 이미 완료된 프로필 metadata를 확인한 뒤 안전한 `returnTo` 또는 `/`로 이동합니다.
- OAuth 시작 query는 실패 시 로그인·회원가입 중 어느 화면에 오류를 표시할지에만 사용합니다. callback은 로그인·가입 버튼과 무관하게 교환된 실제 사용자의 `campuslog_profile`을 검사합니다.
- 완료된 Google 계정은 안전한 `returnTo` 또는 `/`로 이동하고, 신규 계정과 기존 계정 중 완료 metadata가 없는 계정은 `/onboarding`에서 이름·닉네임을 저장한 뒤 최종 목적지로 이동합니다.
- 미완료 사용자가 callback 이후 이탈하거나 `/`, 로그인·회원가입 fallback, 보호 화면에 직접 접근해도 middleware와 서버 화면이 `/onboarding`으로 복귀시킵니다. 기존 계정에 metadata가 없으면 최초 1회 프로필 완료를 요구합니다.
- `/onboarding`은 일반 `returnTo` allowlist에 포함하지 않습니다. 최종 목적지는 기존 `normalizeReturnTo`로 다시 검증해 중첩·외부 redirect를 막습니다.

## Supabase URL 설정

로컬과 Vercel 배포를 모두 허용합니다.

| 설정 | 값 |
| --- | --- |
| Site URL | production Vercel URL |
| Redirect URL | `http://localhost:3000/**` |
| Redirect URL | `http://localhost:3000/auth/callback` |
| Redirect URL | `https://<vercel-domain>/auth/callback` |

Google OAuth provider 설정에는 Supabase가 표시하는 `https://<project-ref>.supabase.co/auth/v1/callback`을 Google Cloud의 authorized redirect URI로 등록합니다.

## Error Code

Supabase 원문 오류는 UI에 직접 노출하지 않습니다.

| code | 사용자 문구 |
| --- | --- |
| `CONFIGURATION_MISSING` | Supabase 환경 변수 설정 필요 |
| `INVALID_INPUT` | 입력값 확인 요청 |
| `INVALID_EMAIL` | 이메일 형식 확인 |
| `INVALID_PASSWORD` | 비밀번호 최소 길이 안내 |
| `INVALID_NAME` | 이름 입력 확인 |
| `INVALID_NICKNAME` | 닉네임 입력 확인 |
| `INVALID_CREDENTIALS` | 이메일 또는 비밀번호 확인 |
| `SIGNUP_FAILED` | 회원가입 실패 일반 문구 |
| `OAUTH_FAILED` | Google 로그인 시작 실패 |
| `CALLBACK_FAILED` | OAuth callback 처리 실패 |
| `PROFILE_SAVE_FAILED` | 프로필 입력 보존과 저장 재시도 |
| `SESSION_REQUIRED` | 로그인 필요 |
| `RATE_LIMITED` | 요청 제한 |
| `NETWORK_ERROR` | 네트워크 재시도 |
| `UNKNOWN_ERROR` | 알 수 없는 오류 |

## Notice Code

| code | 의미 |
| --- | --- |
| `EMAIL_CONFIRMATION_REQUIRED` | Supabase 이메일 확인 설정이 켜진 가입 흐름 |

## 최소 프로필 metadata

이름·닉네임은 아래 형태로 `auth.users.user_metadata`에 저장합니다.

```text
campuslog_profile = {
  version: 1,
  fullName: string,   // 1~40자
  nickname: string,   // 1~20자
  completedAt: ISO timestamp
}
```

- 앞뒤 공백을 제거하고 연속 공백은 하나로 정규화합니다.
- Google의 `full_name` 또는 `name`은 수정 가능한 이름 초기값으로만 사용합니다.
- 이 metadata는 사용자가 수정할 수 있으므로 UI 온보딩 완료 확인에만 사용하고 RLS, 소유권, 관리자 권한, 요금제 같은 보안 판단에는 사용하지 않습니다.
- 닉네임 고유성, 사용자 검색, 공개 프로필은 현재 범위가 아닙니다. 해당 요구가 생기면 별도 `profiles` table과 본인 행 RLS 계약을 먼저 정의합니다.
- 비밀번호는 단계 이동 중 클라이언트 메모리에서만 유지하고 최종 제출 직전에만 `FormData`에 추가합니다. DOM hidden input, URL, localStorage, 문서, 로그에는 기록하지 않으며 성공 또는 서버 응답 후 즉시 비웁니다.

## 테스트 메모

- Google OAuth는 시작 버튼과 무관하게 callback에서 완료 metadata를 확인합니다. 완료 계정은 `/` 또는 안전한 `returnTo`, 미완료 계정은 callback → `/onboarding` → 이름·닉네임 저장 → 최종 목적지 복귀를 기준으로 합니다.
- 미완료 세션으로 `/`, `/login`, `/signup`, 보호 화면을 직접 열어도 `/onboarding`으로 이동하고, 온보딩 중 세션이 만료되면 `returnTo`를 보존한 재로그인 동선을 제공해야 합니다.
- 이메일 가입은 방식 선택 → 이메일·비밀번호 → 이름 → 닉네임 순서와 단계 이동 입력 보존을 확인합니다. 이메일 확인이 켜져 있으면 callback 뒤 완료 metadata를 유지한 채 최종 목적지로 이동해야 합니다.
- 로그아웃은 별도의 성공 알림 없이 `/`의 로그인 영역으로 복귀합니다.
- Supabase 기본 이메일 provider는 개발 중 signup 이메일 발송 rate limit에 쉽게 걸릴 수 있습니다. 테스트 계정은 Gmail alias 예: `name+test1@gmail.com`를 권장합니다.
- 이메일 확인이 켜져 있으면 회원가입 성공 후 메일 인증 전에는 로그인 완료처럼 보이지 않을 수 있습니다.
- 개발 중 빠른 확인이 필요하면 Google OAuth 또는 Supabase Email provider의 confirm email 설정을 별도로 조정합니다.
- 로그아웃은 데스크톱 좌측 하단의 원형 프로필 사진·닉네임 영역과 모바일 헤더의 원형 아바타에서 여는 계정 드롭다운에 통합합니다. 메뉴가 먼저 닫혀 form submit이 유실되지 않도록 선택 시 자동 닫힘을 막고, server action이 Supabase 세션 쿠키를 삭제한 뒤 `/` 로그인 영역으로 redirect합니다. 이메일·실명·미구현 설정 링크는 노출하지 않습니다.

## 사용자 데이터 계약과의 경계

- 활동·경험·분석·추천 등 사용자 생성 데이터는 기존 사용자별 table과 RLS를 사용하며 프로필 metadata를 권한 근거로 사용하지 않습니다.
- v1.1 localStorage 데이터는 자동 삭제하거나 새 계정 데이터로 자동 합치지 않습니다.
- 향후 프로필 검색, 공개 표시, 고유 닉네임이 승인되면 별도 schema migration과 RLS를 작은 작업으로 추가합니다.

## 미확정

- 이메일 확인을 필수로 둘지
- 비밀번호 재설정 범위
- 동일 이메일의 password 계정과 Google 계정 연결 정책
- Supabase password validation의 최종 정책
