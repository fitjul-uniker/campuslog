# CampusLog Auth Contract

## 상태

- 브랜치: `feature/auth-foundation`
- 범위: Supabase Auth 기반 로그인, 회원가입, 로그아웃, Google OAuth 시작, OAuth callback, 보호 경로 redirect
- DB schema, RLS, localStorage migration, AI 고도화는 후속 작업에서 진행합니다.
- UI 원칙: 기존 v1.1 커버, 대시보드, 나의 활동, CampusLog AI 화면 구조는 유지하고 인증 화면과 보호 레이어만 추가합니다.

## 환경 변수

`web/.env.local`에는 실제 값을 넣고, 저장소에는 커밋하지 않습니다.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

운영 메모:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 브라우저에서 쓰는 공개 client 설정입니다.
- `service_role` 또는 `sb_secret_...` 관리자 키는 현재 구현에서 사용하지 않으며, 브라우저나 `NEXT_PUBLIC_` 환경 변수에 넣지 않습니다.
- Vercel에는 같은 두 환경 변수를 Production / Preview 환경에 등록하고, 변경 후 재배포합니다.

## 공개 경로와 보호 경로

| 경로 | 정책 |
| --- | --- |
| `/` | 공개. 기존 3D 책 커버를 유지하고 책 클릭 시 `/dashboard`로 진입 |
| `/login`, `/signup` | 공개. 로그인 상태에서 접근하면 안전한 `returnTo` 또는 `/dashboard`로 이동 |
| `/auth/callback` | 공개. Supabase OAuth code를 session으로 교환 |
| `/dashboard` | 로그인 필요 |
| `/activities/**` | 로그인 필요 |
| `/experiences/**` | 로그인 필요 |
| `/recommend/**` | 로그인 필요 |
| `/api/analyze`, `/api/recommend`, `/api/synthesize-activity` | 로그인 필요. 비로그인은 JSON error 반환 |

## Redirect

- 보호 화면에 비로그인으로 접근하면 `/login?returnTo=...&authError=SESSION_REQUIRED`로 이동합니다.
- `returnTo`는 같은 앱의 상대 경로만 허용합니다.
- 허용 경로는 `/dashboard`, `/activities/**`, `/experiences/**`, `/recommend/**`입니다.
- 허용되지 않은 값, 외부 URL, `//` 시작 경로, 역슬래시 포함 경로는 `/dashboard`로 정규화합니다.
- 로그인, 회원가입, Google OAuth 성공 후 안전한 `returnTo`가 있으면 해당 경로로 이동하고 없으면 `/dashboard`로 이동합니다.
- Google OAuth callback은 `/auth/callback`에서 code를 session으로 교환하고, 세션 쿠키를 redirect 응답에 실어 보호 화면으로 복귀합니다.

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
| `INVALID_CREDENTIALS` | 이메일 또는 비밀번호 확인 |
| `SIGNUP_FAILED` | 회원가입 실패 일반 문구 |
| `OAUTH_FAILED` | Google 로그인 시작 실패 |
| `CALLBACK_FAILED` | OAuth callback 처리 실패 |
| `SESSION_REQUIRED` | 로그인 필요 |
| `RATE_LIMITED` | 요청 제한 |
| `NETWORK_ERROR` | 네트워크 재시도 |
| `UNKNOWN_ERROR` | 알 수 없는 오류 |

## Notice Code

| code | 의미 |
| --- | --- |
| `SIGNED_OUT` | 로그아웃 완료 |
| `EMAIL_CONFIRMATION_REQUIRED` | Supabase 이메일 확인 설정이 켜진 가입 흐름 |

## 테스트 메모

- Google OAuth는 로컬에서 provider 설정 후 callback → `/dashboard` 진입을 확인했습니다.
- 로그아웃은 로컬에서 `/login?authNotice=SIGNED_OUT` 복귀를 확인했습니다.
- Supabase 기본 이메일 provider는 개발 중 signup 이메일 발송 rate limit에 쉽게 걸릴 수 있습니다. 테스트 계정은 Gmail alias 예: `name+test1@gmail.com`를 권장합니다.
- 이메일 확인이 켜져 있으면 회원가입 성공 후 메일 인증 전에는 로그인 완료처럼 보이지 않을 수 있습니다.
- 개발 중 빠른 확인이 필요하면 Google OAuth 또는 Supabase Email provider의 confirm email 설정을 별도로 조정합니다.
- 로그아웃은 기존 앱 shell을 유지하기 위해 데스크톱 사이드바 하단 텍스트, 모바일 헤더 우측 아이콘으로 노출합니다.

## 다음 DB 계약

- 다음 브랜치에서는 Supabase Auth user id를 기준으로 사용자별 테이블을 설계합니다.
- 모든 사용자 생성 데이터는 `user_id` 또는 동등한 owner 컬럼을 갖고 RLS로 본인 데이터만 접근하게 합니다.
- v1.1 localStorage 데이터는 자동 삭제하지 않고, 이전 대상 탐지 → 사용자 확인 → DB upsert → 성공 확인 후 보존/정리 정책 적용 순서로 다룹니다.
- localStorage migration 전까지 기존 localStorage 데이터는 현재 브라우저에 남아 있으며, 계정별 DB 저장은 다음 DB/RLS 작업에서 연결합니다.

## 미확정

- 이메일 확인을 필수로 둘지
- 비밀번호 재설정 범위
- 동일 이메일의 password 계정과 Google 계정 연결 정책
- Supabase password validation의 최종 정책
