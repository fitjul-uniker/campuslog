# CampusLog Task Log

## 목적

이 문서는 날짜별 작업 기록을 남기고, 어떤 파일을 왜 수정했는지 추적하기 위한 문서입니다.

## 작성 규칙

- 작업이 끝날 때마다 최신 항목을 위에 추가합니다.
- 문서, 코드, 설정 파일 변경을 모두 기록합니다.
- 검증하지 못한 내용은 "미검증"으로 명확히 적습니다.
- 실제 개인정보, API Key, 토큰, 비밀번호는 기록하지 않습니다.

## 로그 템플릿

```md
### YYYY-MM-DD - 작업 제목

| 항목 | 내용 |
| --- | --- |
| 날짜 | YYYY-MM-DD |
| 작업자 | 이름 또는 Codex |
| 작업 요약 |  |
| 수정한 파일 |  |
| 변경 내용 |  |
| 검증한 내용 |  |
| 남은 작업 |  |
| 관련 커밋 메시지 |  |
```

## 작업 로그

### 2026-07-14 - AI API 보호 foundation 추가

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-14 |
| 작업자 | Codex |
| 작업 요약 | 최신 main에서 `feature/ai-api-protection` 브랜치를 만들고 세 AI API Route의 서버 세션 검증과 호출 방어 foundation을 추가 |
| 수정한 파일 | `web/src/lib/aiApiProtection.ts`, `web/src/app/api/analyze/route.ts`, `web/src/app/api/recommend/route.ts`, `web/src/app/api/synthesize-activity/route.ts`, `web/src/lib/types.ts`, `web/src/lib/activitySynthesisApi.ts`, `docs/AI_API_CONTRACT.md`, `docs/AUTH_CONTRACT.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md` |
| 변경 내용 | `git pull`로 최신 main `a603eaa`까지 fast-forward한 뒤 브랜치를 생성. middleware 보호에 더해 route handler 내부에서 Supabase `auth.getUser()`를 확인하고 비로그인 요청을 공통 401 `SESSION_REQUIRED` JSON으로 반환하도록 고정. 공통 AI API error helper, `retryAfter` contract, `PAYLOAD_TOO_LARGE` / `RATE_LIMITED` code, `Content-Length` 기반 요청 크기 상한, route별 필드 길이 상한, OpenAI timeout, 사용자별 runtime-local rate guard를 추가. `service_role` key는 사용하지 않고 서버 cookie 기반 Supabase session만 사용. AI 분석 품질, JD 추천, OCR, 부족 경험 비교, 답변 초안은 시작하지 않음 |
| 검증한 내용 | `npm install`로 최신 main의 새 의존성을 설치한 뒤 `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. `npm run dev -- --port 3100`에서 쿠키 없는 `/api/analyze`, `/api/recommend`, `/api/synthesize-activity` POST가 모두 HTTP 401과 `SESSION_REQUIRED` JSON을 반환하는 것을 확인하고 dev 서버를 종료. `npm install` 중 현재 Node v22.5.1과 `eslint-visitor-keys` 권장 engine 차이 경고, 기존 moderate advisory 2건이 출력됐으며 별도 `ISSUE-036` 범위로 유지 |
| 남은 작업 | runtime-local rate guard는 Vercel 다중 인스턴스에 durable하지 않으므로 Supabase / 별도 store 기반 rate limit, AI route 자체 중복 요청 멱등성, OpenAI project spend limit / alert 운영 설정이 후속 hardening으로 남음. 실제 Supabase 세션이 있는 브라우저에서 세 AI API 성공 경로 smoke test 필요 |
| 관련 커밋 메시지 | `feat: protect AI API routes` |

### 2026-07-14 - 활동 추가·공용 컨트롤·프로필 메뉴 고도화

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-14 |
| 작업자 | Codex |
| 작업 요약 | Cult UI·Animate UI·Kokonut UI 레퍼런스를 CampusLog 검정·차콜 디자인과 실제 인증·저장 계약에 맞춰 활동 추가, Checkbox, 복사, 프로필 메뉴에 통합 |
| 수정한 파일 | `web/package.json`, `web/package-lock.json`, `web/src/components/ui/expandable-screen.tsx`, `web/src/components/ui/expandable-screen.module.css`, `web/src/components/ui/dropdown-menu.tsx`, `web/src/components/activities/ActivityCreateForm.tsx`, `web/src/components/activities/ActivityCreateScreen.tsx`, `web/src/components/activities/NewActivityClient.tsx`, `web/src/components/activities/TodayDashboard.tsx`, `web/src/components/animate-ui/components/radix/checkbox.tsx`, `web/src/components/animate-ui/components/buttons/copy.tsx`, `web/src/components/experiences/ExperienceForm.tsx`, `web/src/components/ai/RecommendationResult.tsx`, `web/src/components/auth/SignOutButton.tsx` 삭제, `web/src/components/layout/AppShell.tsx`, `web/src/components/layout/ProfileMenu.tsx`, `web/src/components/layout/ProfileMenu.module.css`, `web/src/hooks/use-account-profile.ts`, `web/src/app/recommend/page.tsx`, `web/src/lib/auth/actions.ts`, `web/src/lib/auth/contract.ts`, `web/src/app/globals.css`, `docs/CURRENT_PHASE.md`, `docs/USER_FLOW.md`, `docs/DESIGN.md`, `docs/SCREEN_SPEC.md`, `docs/AUTH_CONTRACT.md`, `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md` |
| 변경 내용 | 대시보드 상단·빈 상태의 활동 추가를 누른 버튼 원점에서 화면 가장자리 8px 여백과 28px 둥근 모서리의 near-white 대형 패널로 확장하고, 닫을 때 패널 좌표·크기·색을 원래 CTA로 연속 축소하도록 조정. `CampusLog`, 단계 라벨, 소개 문구를 제거하고 `어떤 활동을 기록할까요?`와 필수 폼만 남겼으며, 팝업 저장 CTA는 아이콘+`저장`으로 축약. dialog semantics, 배경 inert·스크롤 잠금, Escape, focus trap·복귀와 reduced motion을 보존하고 저장 중 닫기를 막음. 빠른 기록은 소개 문단을 제거하고 도움말을 자세한 기록이 AI 분석 정확도에 도움이 된다는 문장으로 교체했으며, 제목을 `현재 진행 중인 활동`으로 변경. 네이티브 체크박스 2곳과 참고 문장 복사를 Radix·motion 공용 컨트롤로 교체하되 날짜/기간 상태, 성공 status와 실패 alert를 보존하고 체크박스 라벨 전체를 44px 조작 영역으로 확장. 활동 폼 오류는 해당 필드의 `aria-invalid`·`aria-describedby`에 연결하고 모바일 버튼의 시각·Tab 순서 및 실제 실행 CTA의 `aria-expanded` 상태를 일치시킴. 좌측 로그아웃과 미사용 전용 컴포넌트·스타일을 제거하고 구분선·중립 표면의 실제 원형 아바타+닉네임 계정 메뉴에 통합하며 모바일은 44px 터치 영역 안에 36px 원형 아바타로 축약. Radix 항목이 form submit 전에 닫히지 않도록 로그아웃 선택 기본 동작을 막아 server action redirect를 안정화. Google 사진은 허용된 HTTPS host만 사용하고 fallback initial을 제공. 로그아웃 완료 알림과 추천 제목 위 중복 `CampusLog AI` eyebrow를 제거 |
| 검증한 내용 | 최종 `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. 실제 로그인 세션의 데스크톱 브라우저에서 새 대시보드 문구, 상단·빈 상태의 Expandable Screen, 가장자리가 보이는 대형 둥근 패널, 제목 초기 초점, 아이콘+`저장`, 닫기 뒤 실행 CTA 초점 복귀, 원형 마스크·외곽 링·구분된 표면의 프로필 영역과 닉네임·로그아웃 메뉴를 확인. 로그아웃을 실제 실행해 `/?authMode=login#auth` 복귀 후 `/dashboard` 재접근이 `SESSION_REQUIRED` 로그인 화면으로 차단되는 것을 확인. development 전용 localStorage 미리보기에서는 테스트 활동 저장 → 상세 이동 → 대시보드에서 날짜별 기록 저장과 캘린더·목록 반영까지 확인했으며 실제 계정 DB에는 테스트 데이터를 쓰지 않음 |
| 남은 작업 | 새 Expandable Screen과 프로필 메뉴의 실제 390px 기기 시각 smoke test, 실제 Google OAuth callback → 온보딩 → metadata 저장 smoke test. 저장되지 않은 전역 입력의 로그아웃 경고는 공통 dirty-state 계약이 없어 기존 미완료 상태로 유지. 로그아웃 실패 안내·재시도와 현재 기기/전체 기기 scope 정책은 `ISSUE-043`에서 결정. 기존 Next.js/PostCSS moderate advisory는 `ISSUE-036`에서 별도 해결 |
| 관련 커밋 메시지 | `feat: refine dashboard creation and account controls` |

### 2026-07-14 - CampusLog AI 추천 헤더 위계 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-14 |
| 작업자 | Codex |
| 작업 요약 | `/recommend`의 반복 분할 탭을 제거하고 추천 설명과 추천·기록 간 이동 위치를 사용자 피드백에 맞게 정리 |
| 수정한 파일 | `web/src/app/recommend/page.tsx`, `web/src/app/recommend/history/page.tsx`, `web/src/components/ai/CampusLogAiMenu.tsx` 삭제, `web/src/app/globals.css`, `docs/DESIGN.md`, `docs/SCREEN_SPEC.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/ISSUE_LOG.md`, `docs/TASK_LOG.md` |
| 변경 내용 | 설명을 `활용 목적과 질문에 맞는 경험을 찾고, 어떻게 풀어낼지 함께 제안합니다.`로 교체. 로딩·빈 상태·정상 상태가 공유하는 헤더 컴포넌트로 중복을 제거하고 `추천 기록`을 헤더 우측 보조 액션으로 이동. 추천 기록 화면에서는 활성 탭 대신 `새 추천 받기` 단일 복귀 액션을 제공. 데스크톱 우측 정렬, 모바일 2열 버튼, visible label, 44px 이상 터치 영역과 focus-visible을 유지 |
| 검증한 내용 | `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. 브라우저에서 기존 설명·분할 탭이 제거되고 새 설명과 교차 이동 링크가 표시되는지 확인. 기본 데스크톱, 861×800, 390×844, 320×700에서 가로 overflow가 없고 390px 모바일 헤더 버튼이 각 166.5×46px, 320px에서 각 131.5×46px인지 확인. `추천 기록` → `/recommend/history`와 `새 추천 받기` → `/recommend` 양방향 이동 및 깨끗하게 다시 연 브라우저 탭의 warning/error 0건 확인 |
| 남은 작업 | 추천 결과·근거·입력 구조의 전체 위계 고도화는 Track A AI 계약과 함께 기존 TODO에서 계속 진행. 사용자가 현재 변경 전체를 하나의 Draft PR로 게시하도록 승인했으므로 인증·대시보드·추천 영역을 PR 설명과 리뷰 포인트에서 분리해 검토 |
| 관련 커밋 메시지 | `refactor: simplify recommendation navigation` |

### 2026-07-14 - 오늘의 기록 플로팅 작성 패널 고도화

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-14 |
| 작업자 | Codex |
| 작업 요약 | `/dashboard`의 항상 펼쳐진 빠른 기록 폼을 Cult UI Add Note 방식의 반응형 플로팅 패널로 재구성 |
| 수정한 파일 | `web/src/components/activities/TodayDashboard.tsx`, `web/src/components/ui/floating-panel.tsx`, `web/src/app/globals.css`, `docs/DESIGN.md`, `docs/SCREEN_SPEC.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/ISSUE_LOG.md`, `docs/TASK_LOG.md` |
| 변경 내용 | 날짜 맥락과 단일 `기록 남기기` CTA를 먼저 표시하고 활동 radio·textarea·글자 수·취소·저장을 controlled panel로 이동. 일반 닫기·배경·Escape에서는 draft를 보존하고 명시적 작성 취소만 초기화하며, 저장 중에는 중복 제출과 dismiss를 막고 저장 성공 후에만 패널을 닫음. create/update 결과 객체와 delete 결과로 목록을 즉시 갱신해 후속 목록 조회 실패 오인을 제거. 활동 상세 `activityId` 진입과 기존 수정 버튼이 같은 패널을 열도록 유지. desktop anchor flip/clamp, mobile visualViewport·safe area·짧은 viewport fallback, 내부 스크롤·sticky footer, focus trap·복귀, inert 배경, exit 완료 시점 복구, reduced motion을 적용. 320px에서 캘린더 최소 너비가 페이지를 밀던 기존 가로 overflow도 grid item `min-width: 0`으로 수정 |
| 검증한 내용 | `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. 개발 전용 localStorage 미리보기에서 빈 상태, `activityId` 자동 열기, CTA 열기, textarea 초기 초점, Escape 닫기·초점 복귀, draft 보존, 필수 입력 오류, 기록 저장·수정·삭제를 확인. 1280×720, 390×844, 320×700에서 가로 overflow 없음과 패널 경계를 확인하고 320×240 짧은 visual viewport에서도 panel top 16px / bottom 228px, footer 접근과 내부 스크롤을 확인. 실제 모바일 키보드처럼 visual viewport만 320×160으로 줄어든 조건에서는 `data-compact-height`가 적용되어 footer가 고정되지 않고 textarea와 저장 버튼 모두 내부 스크롤로 접근 가능한지 확인. 닫힘 중 dialog가 남아 있는 동안 shell inert·body lock이 유지되고 완료 뒤 trigger로 초점이 돌아오는지 확인. 콘솔 warning/error 없음. 저장 검증용 기록은 삭제했고, 패널을 바로 볼 수 있도록 개발 미리보기 저장소에만 진행 활동 1개를 유지 |
| 남은 작업 | 기존 Supabase repository의 daily log write와 AI 합성 상태 무효화가 단일 DB transaction이 아니어서 부분 성공을 실패로 오인할 수 있는 위험을 Track A의 `ISSUE-039`에서 해결. 사용자가 현재 변경 전체를 하나의 Draft PR로 게시하도록 승인했으므로 인증 진입과 dashboard 영역을 리뷰 포인트에서 분리해 확인 |
| 관련 커밋 메시지 | `feat: add floating daily record panel` |

### 2026-07-14 - 인증 없는 로컬 UI 미리보기 추가

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-14 |
| 작업자 | Codex |
| 작업 요약 | Supabase 환경 변수 없이 로그인 이후 대시보드 디자인을 확인할 수 있는 development 전용 미리보기 모드 추가 |
| 수정한 파일 | `web/src/lib/supabase/env.ts`, `web/src/middleware.ts`, `web/.env.example`, `README.md`, `docs/AUTH_CONTRACT.md`, `docs/TASK_LOG.md` |
| 변경 내용 | `NEXT_PUBLIC_CAMPUSLOG_UI_PREVIEW=1`일 때 development 환경의 보호 페이지 middleware만 통과시키고 Supabase client 대신 localStorage repository를 사용. 보호 API는 계속 차단하며 production build에서는 미리보기 값을 무시하도록 제한 |
| 검증한 내용 | `NEXT_PUBLIC_CAMPUSLOG_UI_PREVIEW=1` development 서버에서 `/dashboard` 200과 localStorage repository 기반 달력·기록 화면 렌더 확인. `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. production build에서는 `NODE_ENV` 조건으로 preview가 비활성화됨을 확인 |
| 남은 작업 | 디자인 확인이 끝나면 일반 개발 서버는 preview 변수 없이 다시 실행 |
| 관련 커밋 메시지 | `chore: add local UI preview mode` |

### 2026-07-14 - 이메일·Google 회원가입 프로필 Stepper 추가

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-14 |
| 작업자 | Codex |
| 작업 요약 | 회원가입을 가입 방식 선택부터 이름·닉네임 저장까지 단계형 흐름으로 재구성하고 Google OAuth 후 온보딩 복귀 추가 |
| 수정한 파일 | `web/src/components/auth/AuthForm.tsx`, `web/src/components/auth/SignupForm.tsx`, `web/src/components/auth/GoogleIcon.tsx`, `web/src/components/auth/ProfileStepperFields.tsx`, `web/src/components/auth/ProfileSetupForm.tsx`, `web/src/components/ui/stepper.tsx`, `web/src/components/ui/stepper.module.css`, `web/src/app/onboarding/page.tsx`, `web/src/app/auth/callback/route.ts`, `web/src/app/globals.css`, `web/src/components/layout/AppShell.tsx`, `web/src/lib/auth/actions.ts`, `web/src/lib/auth/contract.ts`, `web/src/lib/auth/profile.ts`, `web/src/lib/auth/profile-actions.ts`, `web/src/middleware.ts`, `PRD.md`, `README.md`, `docs/CURRENT_PHASE.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/DESIGN.md`, `docs/AUTH_CONTRACT.md`, `docs/WORK_STATUS.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/TASK_LOG.md` |
| 변경 내용 | 회원가입 첫 화면에 `이메일로 회원가입`, `Google로 회원가입`만 표시. 이메일은 이메일·비밀번호를 클라이언트 단계 상태에 보존한 뒤 이름 → 닉네임 Stepper 최종 제출에서 Supabase signup과 `campuslog_profile` metadata 저장을 함께 수행하며, 비밀번호는 최종 제출 직전에만 FormData에 넣고 응답 후 제거. Google은 OAuth callback의 실제 완료 metadata를 기준으로 신규·미완료 계정을 `/onboarding`에 보내 provider 이름을 수정 가능한 초기값으로 사용하고 프로필 저장 뒤 안전한 `returnTo`로 이동. `/`, 인증 fallback, 보호 화면은 미완료 세션을 온보딩으로 복귀시키고 기존 계정은 metadata가 없을 때 최초 1회 입력. 온보딩 세션 만료에는 재로그인 CTA 제공. React Bits Stepper의 방향·진행 표시를 TypeScript/CSS module로 옮기고 semantic `ol`, 단계 검증, 입력 보존, 이전 단계 초점 복구, 모바일 시각·키보드 순서 일치, 텍스트 대비, reduced motion을 보강. metadata는 공개 프로필이나 RLS·권한 근거로 사용하지 않음 |
| 검증한 내용 | 최종 코드에서 `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. 임시 공개 설정을 사용한 별도 로컬 포트의 인앱 브라우저에서 가입 방식 선택 → 이메일·비밀번호 → 이름 → 닉네임, 필드별 `aria-invalid` 유지, 이전 단계의 이메일·가입 방식 버튼 초점 복구, 390px 모바일 이전·완료 버튼의 DOM·시각 순서 일치, 390px·320px 가로 overflow 없음, 브라우저 console error 0건 확인. 비로그인 `/onboarding?returnTo=/dashboard` → 안전한 `/signup` 복귀, callback 외부 `returnTo` → `/signup?authError=CALLBACK_FAILED`, 최종 `http://localhost:3000/signup` 200 확인. auth/security, UI/accessibility, integration 관점의 독립 리뷰 후 발견된 온보딩 우회와 접근성 이슈를 보완하고 재검토 요청 |
| 남은 작업 | 현재 작업 환경에는 실제 Supabase 공개 환경 변수가 없어 실제 이메일 가입 저장, 이메일 확인 callback, Google OAuth callback → `/onboarding` → metadata 저장은 미검증. 기존 Supabase 환경 변수를 복원한 뒤 실제 계정 smoke test 필요 |
| 관련 커밋 메시지 | `feat: add guided signup onboarding` |

### 2026-07-14 - 인증 전후 브랜드 진입 순서 재구성

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-14 |
| 작업자 | Codex |
| 작업 요약 | 비로그인 첫 화면을 순환 기록 문구로 바꾸고, 스크롤 인증 후 로그인 사용자에게 기존 3D 책 표지를 보여주는 순서로 재구성 |
| 수정한 파일 | `web/components.json`, `web/postcss.config.mjs`, `web/package.json`, `web/package-lock.json`, `web/src/app/page.tsx`, `web/src/app/globals.css`, `web/src/components/layout-text-flip-demo.tsx`, `web/src/components/landing/LandingHero.tsx`, `web/src/components/ui/layout-text-flip.tsx`, `web/src/components/ui/scroll-float.tsx`, `web/src/components/ui/input.tsx`, `web/src/components/ui/label.tsx`, `web/src/components/auth/AuthForm.tsx`, `web/src/lib/utils.ts`, `web/src/lib/auth/contract.ts`, `web/src/lib/auth/actions.ts`, `web/src/middleware.ts`, `PRD.md`, `README.md`, `docs/CURRENT_PHASE.md`, `docs/DESIGN.md`, `docs/IA.md`, `docs/USER_FLOW.md`, `docs/SCREEN_SPEC.md`, `docs/AUTH_CONTRACT.md`, `docs/WORK_STATUS.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/TASK_LOG.md` |
| 변경 내용 | `/` 서버 페이지가 세션을 확인해 비로그인에는 좌측 상단 고정 `CampusLog` 워드마크, `대학생활을 / 공모전을 / 해커톤을 / 프로젝트를 / 대회를 기록하다.` 중앙 순환 문구와 스크롤 아웃을, 로그인에는 기존 3D 책을 표시하도록 변경. 명사와 조사를 독립 motion 단위로 분리해 같은 `을` 또는 `를`이 이어지면 조사 DOM을 유지하고, `을 ↔ 를`로 값이 바뀔 때만 더 짧고 약하게 전환. 단어의 실제 렌더링 폭을 측정해 500ms 동안 연속 보간하고 마스크 좌우 여유로 마지막 획 잘림을 방지. `대학생활`은 검정·강한 굵기, 나머지 순환 명사는 웜그레이·가벼운 굵기로 구분하되 조사 `을/를`은 항상 검정·강한 굵기로 고정. 44px `일시정지 / 재생` 컨트롤로 자동 전환을 중지·재개할 수 있고 reduced motion에서는 첫 문구 고정과 `자동 전환 꺼짐` 상태를 제공. 작은 아래 방향 휠 입력 누적으로 인증 viewport까지 자동 이동하되, 인증 화면의 위 방향 휠은 자동 복귀시키지 않고 브라우저 기본 스크롤을 유지. 하단 링크는 `스크롤하여 로그인 또는 회원가입` 한 줄과 2.2초 주기의 3px 화살표 모션만 제공하고 별도 마우스 아이콘·이중 위계는 제거. 첫 viewport와 인증 카드 하단 장식선을 제거하고 로그인 mode의 `Welcome back`·소개 문구를 생략. 인증 viewport는 좌측 소개 문구 없이 Aceternity signup form을 참고한 단일 카드를 중앙 배치. Tailwind CSS v4 theme·utilities, shadcn `components.json`, Input·Label primitive와 `cn` 병합 유틸리티를 구성하되 기존 v1.1 화면 보호를 위해 Preflight는 제외. 실제 Supabase server action·상태·`returnTo` 계약은 유지하고 일반 인증 성공 기본 목적지는 `/`로 변경. 보호 화면의 안전한 `returnTo`와 별도 `/login`, `/signup` fallback은 보존 |
| 검증한 내용 | `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. 인앱 브라우저 1280×720에서 좌측 상단 `CampusLog` 워드마크, `대학생활을 / 공모전을 / 해커톤을 / 프로젝트를 / 대회를` 조사와 문장별 중앙 정렬, 같은 조사 key 유지와 `을 ↔ 를` 선택 전환을 확인. `대학생활 → 공모전`은 기존 폭 361.8px을 유지한 채 opacity 1 → 0.91 → 0.28로 먼저 퇴장한 뒤 새 단어가 나타나며 폭이 299.4 → 279.3 → 274.5 → 273.9px로 줄어드는 것을 확인. `프로젝트 → 대회`도 기존 폭 361.8px 유지 퇴장 후 236.1 → 195.4 → 187.0 → 185.9px로 줄어들고, 두 전환 모두 새 단어 오른쪽 끝과 조사 시작점의 간격이 0px임을 확인. 전체 순환 590개 샘플 프레임에서 명사 DOM 0건인 프레임은 없고 최소 최대 opacity는 0.389임을 확인. 마스크 좌우 여유는 각 4.95px이며 보조 명사는 rgb(109, 105, 99)·680, 조사는 rgb(31, 30, 28)·820으로 고정됨을 확인. 하단 스크롤 링크는 한 줄 문구, 44px 조작 영역, 화살표 animation 2.2초, 접근성 이름 `아래로 스크롤하여 로그인 또는 회원가입`을 확인. 실제 9px 아래 휠 입력은 scrollY 0 → 700으로 자동 이동하고 인증 화면의 동일한 위 입력은 700 → 691만 자연 이동해 자동 복귀하지 않음을 확인. 첫 화면 경계 0px, 인증 카드 하단 pseudo-element 없음, `Welcome back`·로그인 소개 문구 0건, 중앙 로그인 카드, 로그인→회원가입 mode 전환, heading focus 이동, 오류 code별 `aria-invalid`, 가로 overflow 없음과 44px 이상 링크를 확인. `http://localhost:3000` 개발 서버에서 최종 화면 렌더 확인 |
| 남은 작업 | 현재 로컬 실행 환경에는 Supabase 공개 환경 변수가 없어 실제 credential/OAuth 인증 성공 후 3D 책 노출은 미검증. 환경 설정이 있는 세션에서 로그인·회원가입·로그아웃과 보호 경로 `returnTo` 회귀 확인 필요. 기존 Next.js 15.5.20의 PostCSS 8.4.31에서 `npm audit --omit=dev` moderate 경고 2건이 남아 있으며 강제 자동 수정은 비호환 변경이라 적용하지 않음 (`ISSUE-036`) |
| 관련 커밋 메시지 | `feat: refine animated auth landing` |

### 2026-07-13 - AI 개발 우선순위 재정렬

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-13 |
| 작업자 | Codex |
| 작업 요약 | 로그인·DB foundation 확인 이후 다음 개발 초점을 AI API 보호와 AI 분석·추천 품질 고도화로 전환 |
| 수정한 파일 | `PRD.md`, `docs/CURRENT_PHASE.md`, `docs/DATA_CONTRACT.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/ISSUE_LOG.md`, `docs/SCREEN_SPEC.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/TASK_LOG.md` |
| 변경 내용 | 사용자가 일반 이메일 인증 메일 흐름, Google OAuth, 계정별 DB 분리를 확인한 내용을 반영. 다음 개발 순서를 AI API 보호, AI 분석 품질 개선, 목적 / JD / 질문 기반 추천, 부족 경험 비교와 답변 초안으로 정리. localStorage migration은 Deferred / Optional로 유지 |
| 검증한 내용 | 문서 변경만 수행. `git diff --check`로 whitespace 오류를 확인 |
| 남은 작업 | 실제 코드 구현은 `feature/ai-api-protection`부터 시작 |
| 관련 커밋 메시지 | `docs: align roadmap around AI development` |

### 2026-07-13 - 사용자별 Supabase schema / RLS foundation 추가

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-13 |
| 작업자 | Codex |
| 작업 요약 | 최신 `main`에서 `feature/database-schema` 브랜치를 만들고 사용자별 Supabase DB schema, RLS 정책, repository 경계, localStorage 이전 정책, 주요 화면의 Supabase repository 연결을 추가 |
| 수정한 파일 | `supabase/migrations/20260713000100_user_data_schema.sql`, `web/src/lib/repositories/campuslogRepository.ts`, `web/src/components/activities/TodayDashboard.tsx`, `web/src/components/activities/NewActivityClient.tsx`, `web/src/components/activities/ActivityDetailClient.tsx`, `web/src/components/experiences/NewExperienceClient.tsx`, `web/src/components/experiences/EditExperienceClient.tsx`, `web/src/components/experiences/ExperienceDashboard.tsx`, `web/src/components/experiences/ExperienceDetailClient.tsx`, `web/src/components/experiences/ExperienceAnalysisClient.tsx`, `web/src/components/experiences/ExperienceForm.tsx`, `web/src/app/recommend/page.tsx`, `web/src/app/recommend/history/page.tsx`, `docs/DATA_CONTRACT.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md` |
| 변경 내용 | `Experience`, `TrackedActivity`, `DailyLog`, `ExperienceAnalysis`, `Recommendation`, `ExperienceSynthesisDraft`를 사용자별 `user_id`로 분리하는 Postgres table과 RLS CRUD 정책을 작성. 기존 localStorage id를 보존하기 위해 `(user_id, id)` 복합 키를 사용하고, 활동 종료 완료 경험 연결은 `generated_experience_id` unique partial index로 중복을 방지. localStorage migration batch / item ledger 테이블을 추가해 사용자 확인 기반 이전, 부분 실패, 재시도, 원본 보존 정책을 뒷받침. async repository interface, localStorage adapter, Supabase adapter를 추가하고 오늘의 기록, 활동 추가/상세, 나의 활동, 경험 작성/수정/상세/분석, AI 추천, 추천 기록 화면을 repository 경계로 전환. Supabase 설정이 있는 로그인 세션에서는 localStorage를 기본 데이터로 표시하지 않고 계정별 DB 데이터를 사용 |
| 검증한 내용 | 작업 시작 전 `git pull` 결과 최신 main 확인, 기준 문서 확인, localStorage 모델과 관계 파악. `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. 사용자가 Supabase SQL Editor에서 migration 실행 성공(`Success. No rows returned`)과 Table Editor의 사용자 데이터 테이블 생성을 확인했고, 서로 다른 Google 계정으로 계정별 데이터 분리 수동 smoke test를 완료 |
| 남은 작업 | localStorage 이전 UX와 실제 upsert action은 정식 사용자 데이터 보존 요구가 생길 때 선택 PR로 진행. SQL-level 또는 자동화된 select / insert / update / delete RLS 정책 검증은 아직 별도로 수행하지 않음 |
| 관련 커밋 메시지 | `feat: add user-scoped Supabase data repository` |

### 2026-07-13 - Supabase Auth foundation 시작

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-13 |
| 작업자 | Codex |
| 작업 요약 | 최신 main에서 `feature/auth-foundation` 브랜치를 만들고 Supabase Auth 기반 인증 뼈대를 추가 |
| 수정한 파일 | `docs/AUTH_CONTRACT.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `web/.env.example`, `web/package.json`, `web/package-lock.json`, `web/src/middleware.ts`, `web/src/app/auth/callback/route.ts`, `web/src/app/login/page.tsx`, `web/src/app/signup/page.tsx`, `web/src/app/page.tsx`, `web/src/app/globals.css`, `web/src/components/auth/**`, `web/src/components/layout/AppShell.tsx`, `web/src/lib/auth/**`, `web/src/lib/supabase/**` |
| 변경 내용 | `@supabase/ssr`, `@supabase/supabase-js`를 추가하고 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경 변수 계약을 정의. 이메일/비밀번호 로그인·회원가입 server action, Google OAuth 시작, OAuth callback code exchange, 로그아웃 action, 보호 화면·AI API middleware를 추가. `/login`, `/signup` 최소 UI와 설정 누락·공통 오류 문구를 연결하고, 로그인 상태가 아닌 사용자는 보호 화면에서 로그인으로 redirect하도록 구성. 기존 v1.1 커버와 제품 UI는 유지하고 로그아웃은 데스크톱 사이드바 하단, 모바일 헤더 우측에 배치 |
| 검증한 내용 | `main`에서 `git pull --ff-only` 결과 최신 상태 확인. 사용자가 Supabase project, local `.env.local`, Vercel env, Google OAuth provider를 설정. `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. dev 서버에서 `/login` 200, 비로그인 `/dashboard` → `/login?authError=SESSION_REQUIRED`, 보호 API JSON error, 기존 커버 링크 보존, 로그인 UI 렌더를 확인. Google OAuth callback → `/dashboard`, 로그아웃 → `/login?authNotice=SIGNED_OUT` 로컬 흐름을 확인. 이메일 signup은 Supabase 기본 email provider rate limit에 걸릴 수 있음을 확인 |
| 남은 작업 | 사용자별 DB schema / RLS와 repository 전환은 후속 PR에서 진행 완료. localStorage migration UI / upsert는 Deferred / Optional로 전환. 이메일 confirm / SMTP / 비밀번호 재설정과 동일 이메일 provider 연결 정책은 후속 결정 필요 |
| 관련 커밋 메시지 | `feat: add supabase auth foundation` |

### 2026-07-13 - 2차 MVP 인증·DB·AI 고도화 우선순위 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-13 |
| 작업자 | Codex |
| 작업 요약 | 2차 MVP에서 먼저 진행할 인증·DB 기반 작업과 이후 AI 고도화 방향을 최신 main 기준으로 문서화 |
| 수정한 파일 | `AGENTS.md`, `PRD.md`, `README.md`, `docs/CURRENT_PHASE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md` |
| 변경 내용 | 이메일 또는 아이디 + 비밀번호 인증과 Google OAuth를 2차 MVP 범위로 명시. 최신 main에서 `feature/auth-foundation`부터 시작하도록 다음 순서를 정리. JD / 직무 요구사항 / 우대사항 원문 입력, 질문 이미지 OCR / vision 입력, 부족 경험 비교, 답변 초안 생성은 인증·DB 전환 이후 AI 고도화 단계로 기록. OCR 이미지는 우선 원본 저장 없는 일회성 입력으로 두고 Storage 도입은 별도 결정 사항으로 분리 |
| 검증한 내용 | 문서 검색으로 기존 merge 대기 문구, OAuth 보류 문구, AI 고도화 범위 충돌을 확인하고 최신 기준에 맞게 정리. 코드 변경 없음 |
| 남은 작업 | 최신 main에서 인증 기반 브랜치 생성, Supabase 설정, 인증 contract 구현, 이후 DB schema / RLS / migration / AI 고도화 진행 |
| 관련 커밋 메시지 | `docs: plan auth database and AI roadmap` |

### 2026-07-13 - v1.1 commit / push / Draft PR 생성

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-13 |
| 작업자 | Codex |
| 작업 요약 | v1.1 진행형 활동 기록 고도화 전체 변경을 검증하고 팀 원격 저장소에 게시 |
| 수정한 파일 | 게시 상태를 반영한 `docs/CURRENT_PHASE.md`, `docs/WORK_STATUS.md`, `docs/TODO.md`, `docs/TASK_LOG.md` |
| 변경 내용 | `feature/progressive-experience-tracking`의 전체 46개 파일을 `e21a864`로 commit하고 원격 branch에 push한 뒤 `main` 대상 Draft PR #27 생성 |
| 검증한 내용 | `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. GitHub CLI Keychain 인증과 원격 branch tracking 확인 |
| 남은 작업 | Draft PR #27 팀 review와 필요한 수정, 승인 후 main merge. merge 전 2차 MVP 기능을 현재 branch에 추가하지 않음 |
| 관련 커밋 메시지 | `feature: add progressive activity tracking`, `docs: record v1.1 draft pull request` |

### 2026-07-13 - v1.1 완료 및 2차 MVP 문서 기준 전환

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-13 |
| 작업자 | Codex + 문서 reviewer |
| 작업 요약 | 완료된 1차 MVP와 v1.1을 기준선으로 보존하고 현재 활성 계획 단계를 2차 MVP로 전환 |
| 수정한 파일 | `AGENTS.md`, `PRD.md`, `README.md`, `docs/CURRENT_PHASE.md`, `docs/archive/MVP_V1_1_BASELINE.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/GIT_WORKFLOW.md`, `docs/WORK_STATUS.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/TASK_LOG.md` |
| 변경 내용 | 과거 1차 MVP 제한과 하단 override 패턴을 제거하고 `CURRENT_PHASE.md`를 최우선 활성 기준으로 추가. 2차 MVP를 로그인·회원가입·DB·AI 고도화의 Track A와 디자인·UX 고도화의 Track B로 분리하고, localStorage 마이그레이션·샘플 제외·합성 초안 소유권과 RLS·인증 오류 보안·AI 비용·공통 계약·병렬 PR 원칙을 문서화 |
| 검증한 내용 | 문서 참조·용어·활성 계획 단계·담당 Track·포함/제외 범위와 과거 1차 MVP 제한 문구를 검색하고 `git diff --check` 및 신규 문서 no-index check로 공백·형식 오류가 없음을 확인. 독립 integration reviewer 재검토에서 critical / major / minor 잔여 없음 확인 |
| 남은 작업 | v1.1 commit / push / Draft PR은 사용자 승인 후 진행. 2차 MVP 이메일 확인·비밀번호 재설정·OAuth 세부 범위, 마이그레이션 정책, AI 평가 기준은 팀 결정 필요 |
| 관련 커밋 메시지 | `docs: transition CampusLog to second MVP phase` |

### 2026-07-13 - 오늘 한 일 활동 선택 표시 단순화

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-13 |
| 작업자 | Codex |
| 작업 요약 | 오늘 한 일 기록 폼의 활동 선택 태그에서 체크 아이콘을 제거하고 색상 변화만으로 선택 상태를 구분 |
| 수정한 파일 | `web/src/components/activities/TodayDashboard.tsx`, `web/src/app/globals.css`, `docs/SCREEN_SPEC.md`, `docs/DESIGN.md` |
| 변경 내용 | 라디오 선택 동작과 focus-visible은 유지하면서 선택 태그의 배경·테두리·글자색 변화만 사용하도록 단순화 |
| 검증한 내용 | `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. 로컬 브라우저에서 태그 영역의 SVG 0개, 가로 overflow 0, 콘솔 warning/error 0 확인 |
| 남은 작업 | 없음 |
| 관련 커밋 메시지 | `style: simplify activity tag selection` |

### 2026-07-13 - 진행형 경험 기록·캘린더·AI 완료 경험 합성 구현

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-13 |
| 작업자 | Codex + data / AI / UI 구현 에이전트 + 독립 reviewer |
| 작업 요약 | 기존 CampusLog 기능을 보존하면서 진행 활동 간단 등록, 날짜별 한 일, 캘린더, 활동 종료, AI 사실 기반 초안, 기존 Experience 저장 흐름을 새 기능 브랜치에 구현 |
| 수정한 파일 | `PRD.md`, `README.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/DESIGN.md`, 작업 기록 문서, `web/src/lib/types.ts`, `web/src/lib/storage.ts`, `web/src/lib/activitySynthesisApi.ts`, `web/src/lib/activitySynthesisLimits.ts`, `web/src/app/api/synthesize-activity/route.ts`, `web/src/components/activities/**`, `web/src/app/activities/**`, `/dashboard`, `/experiences`, `/recommend`, `/recommend/history`, 내비게이션·기존 경험 복귀 링크, `globals.css` |
| 변경 내용 | `TrackedActivity`, `DailyLog`, 합성 초안과 신규 localStorage key를 추가. `/dashboard`를 오늘 기록으로 바꾸고 `/experiences`를 완료 경험과 진행 활동을 함께 보여주는 `나의 활동`으로 구성. 진행 활동 등록은 `활동 추가`로 바꾸고 역할 대신 간단한 내용을 저장하며, 기존 localStorage의 `role` 값은 내용으로 호환해 읽음. 예상 종료일은 날짜 또는 `미정`을 명시적으로 선택하고, 오늘의 기록에 보이는 진행 활동 카드는 시간 아이콘·부가 내용 없이 제목만 노출. 전체 활동 수와 진행 중 수를 별도 표시하고 진행 활동 행·인라인 상세에 `진행 중` 상태와 누적 기록을 노출. 진행 활동에서 오늘의 기록으로 이동할 때 해당 `activityId`를 전달해 잘못된 활동에 기록할 가능성을 차단하고, 상세 전환은 이전 패널 제거 후 다음 패널을 표시해 중복 접근성 ID를 방지. `AI 추천 및 활용`과 `추천 기록` 상위 메뉴를 `CampusLog AI` 하나로 통합하고 내부 메뉴를 `AI 기반 활동 추천`과 `추천 기록`으로 구성. 메뉴의 `CampusLog`는 기존 워드마크와 같은 Petrona 800·자간을 사용하고, 추천 성공 결과는 자동 저장하되 localStorage 저장 실패 시 성공 화면 대신 오류를 표시. 완료 활동과 연결 로그만 OpenAI Responses API로 보내 활동 내용·성과·근거 부족 정보를 생성하고, 사용자 승인 후 activityId 기준 멱등 트랜잭션으로 기존 Experience 저장. 최신 기존 서비스의 검정·차콜·웜그레이 스타일과 앱 셸을 재사용 |
| 검증한 내용 | `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. 브라우저에서 활동 추가, 오늘 기록 저장·수정, 캘린더 개수, 활동 종료 확인, `/api/synthesize-activity` 200, AI 초안, Experience 저장·목록 노출을 확인. 추가로 `/experiences`에서 완료 경험 4개와 검증용 진행 활동 1개가 합산된 전체 5개, `진행 중 1`, 행 배지, 선택 후 진행 상태·간단한 내용·기간·누적 기록 상세, 데스크톱 가로 overflow 0을 확인. 진행 활동 상세에서 오늘의 기록으로 이동했을 때 URL의 `activityId`와 같은 라디오가 checked 상태인지 확인. 검증용 활동은 UI로 삭제해 원래 데이터로 복구. `/recommend`와 `/recommend/history`에서 상위·내부 활성 메뉴, 워드마크와 메뉴의 동일 font-family·font-weight·상대 자간, 데스크톱·390×844 가로 overflow 0, 콘솔 warning/error 없음 확인 |
| 남은 작업 | 팀 코드 리뷰 후 사용자가 승인하면 commit / push / PR 진행. Tailwind CSS·shadcn/ui는 승인 기술 선택지지만 기존 CSS 화면 전체 마이그레이션은 별도 작업으로 판단 |
| 관련 커밋 메시지 | `feat: add progressive experience tracking and AI synthesis` |

### 2026-07-12 - 게시 전 통합 리뷰와 UI 안정화

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-12 |
| 작업자 | Codex |
| 작업 요약 | 현재 작업 트리 전체를 데이터·문서·보안·UI 관점으로 독립 검토하고 게시 전 발견한 경미한 UI 문제를 수정 |
| 수정한 파일 | `docs/TASK_LOG.md`, `docs/WORK_STATUS.md`, `web/src/app/globals.css`, `web/src/components/experiences/DashboardExperienceDetail.tsx` |
| 변경 내용 | 활동 상세가 열린 동안 고정 `+` CTA가 본문을 덮지 않도록 숨김 상태를 추가. 모바일 내비게이션에서 포인터 근접 효과용 blur와 `will-change`를 제거. 활동 전체 화면의 문서 제목 계층을 `h1 → h2`로 보정하고 좁은 상세에서 한글 제목이 음절 단위로 끊기지 않도록 줄바꿈 규칙을 정리 |
| 검증한 내용 | 데이터·문서·보안·UI reviewer에서 critical/major 0건 확인. `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. 브라우저에서 데스크톱·390×844 모바일의 CTA 비노출, 모바일 메뉴 `filter: none`, 전체 화면 `h1 → h2`, 가로 overflow 0, 콘솔 warning/error 0 확인 |
| 남은 작업 | 실제 새 관련 링크 저장 → 상세 표시 → 새로고침 유지 수동 검증은 `ISSUE-021`로 유지. 최신 `origin/main` 기준 feature commit `bdca264`를 push하고 Draft PR #26을 생성했으며 팀 리뷰가 필요 |
| 관련 커밋 메시지 | `feature: unify CampusLog workspace and related links` |

### 2026-07-12 - 관련 링크 URL·설명 행과 파비콘 표시

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-12 |
| 작업자 | Codex |
| 작업 요약 | 활동 관련 링크를 큰 텍스트 입력 대신 URL·설명 반복 행으로 입력하고 상세에서 파비콘과 설명을 함께 확인하도록 개선 |
| 수정한 파일 | `PRD.md`, `README.md`, `docs/DESIGN.md`, `docs/IA.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/ISSUE_LOG.md`, `docs/SCREEN_SPEC.md`, `docs/TODO.md`, `docs/USER_FLOW.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `web/src/app/api/analyze/route.ts`, `web/src/app/api/recommend/route.ts`, `web/src/app/globals.css`, `web/src/components/common/RelatedLinkFavicon.tsx`, `web/src/components/experiences/DashboardExperienceDetail.tsx`, `web/src/components/experiences/ExperienceForm.tsx`, `web/src/components/experiences/NewExperienceClient.tsx`, `web/src/lib/relatedLinks.ts`, `web/src/lib/sampleExperiences.ts`, `web/src/lib/storage.ts`, `web/src/lib/types.ts` |
| 변경 내용 | `RelatedLink { url, description }` 구조와 새 링크 최대 10개, 추가·삭제 후 초점 이동, http/https·중복·설명만 입력 검증을 적용. 공개 도메인만 고정 favicon 제공처에 전달하고 비공개 호스트·IP 주소·실패 응답은 `Link2`로 대체. v1 문자열 배열은 링크 개수와 비-URL 메모를 보존한 채 v2 객체 배열로 자동 마이그레이션하고 완료 marker로 이전 데이터 재등장을 방지. 분석·추천 API 경계는 v1/v2 payload를 모두 정규화하며 URL·설명을 참고 정보로 전달하되 AI가 링크를 열람했다고 가정하지 않도록 prompt 규칙을 추가 |
| 검증한 내용 | `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. 순수 유틸리티에서 10개 초과 legacy 링크와 비-URL 메모 보존, 단일 토큰과 실제 domain 구분, 공개·비공개 hostname favicon 분기를 확인. 브라우저에서 URL·설명 입력, GitHub favicon, 행 추가 후 자동 초점, 개별 삭제 후 초점 복귀, 390×844 모바일 재배치, 가로 overflow 0과 기존 v1 활동 3개 유지 확인. 독립 UI·integration 리뷰에서 찾은 링크 개수 손실, v1 데이터 재등장, 비-URL 메모 변환, 상세 텍스트·포커스 문제를 수정한 뒤 critical/major 0건으로 재검토 완료 |
| 남은 작업 | 외부 favicon 제공처가 응답하지 않는 환경에서는 의도한 대로 `Link2` fallback을 사용. 사용자 활동을 변경하지 않기 위해 새 테스트 활동의 실제 저장·삭제는 수행하지 않았으며, 상세의 링크 카드 상태는 타입·빌드·샘플 데이터 기준으로만 검증. 실제 저장 → 상세 표시 → 새로고침 유지 수동 확인은 `ISSUE-021`로 남김 |
| 관련 커밋 메시지 | `feature: structure related experience links` |

### 2026-07-12 - 추천 결과 가독성과 활동 상세 액션 흐름 개선

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-12 |
| 작업자 | Codex |
| 작업 요약 | AI 추천 완료 후 결과 자동 스크롤과 추천 결과 타이포 위계를 적용하고, 검색 아이콘·추천 활동 링크·AI 분석 결과 문구·활동 전체 화면 버튼 순서를 정리 |
| 수정한 파일 | `docs/DESIGN.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/USER_FLOW.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `web/src/app/recommend/page.tsx`, `web/src/app/globals.css`, `web/src/components/ai/RecommendationResult.tsx`, `web/src/components/experiences/DashboardExperienceDetail.tsx`, `web/src/components/ui/GooeyInput.tsx` |
| 변경 내용 | 새 추천 ID가 생성된 경우에만 결과 상단으로 스크롤하고 reduced motion에서는 즉시 이동하도록 구현. 추천 활동 제목은 크고 짙게, 항목 라벨은 작고 옅게, 답변 본문은 읽기 쉬운 중간 크기로 분리. Gooey 검색의 이중 패딩을 제거하고 20px 아이콘을 고정. 추천 결과의 활동 링크를 `활동`, 분석 링크를 `AI 분석 결과`로 변경. 활동 전체 화면 액션을 활동 목록, 분석 액션, 수정, 삭제 순으로 재배치하고 수정의 primary 확장을 제거 |
| 검증한 내용 | `npm run lint`, `tsc --noEmit`, `npm run build`, `git diff --check` 통과. 브라우저에서 검색 SVG 20×20px, 데스크톱·모바일 가로 overflow 0, 분석 완료 인라인 상세의 `AI 분석 결과`, 미분석 전체 화면의 `활동 목록 → AI 분석 요청 → 수정 → 삭제`, 분석 완료 전체 화면의 `활동 목록 → AI 분석 결과 → 수정 → 삭제`와 기본 크기 수정 버튼을 확인. 브라우저 콘솔 warning/error 없음 |
| 남은 작업 | 실제 AI 추천 요청은 외부 API 호출과 추천 기록 저장을 발생시키므로 자동 실행하지 않음. 새 추천 성공 후 자동 스크롤은 코드·타입·빌드 기준으로 검증하고 사용자 수동 확인이 필요 |
| 관련 커밋 메시지 | `fix: refine recommendation result flow` |

### 2026-07-12 - 제품 화면 대시보드 스타일 통합 및 목록-상세 인터랙션

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-12 |
| 작업자 | Codex |
| 작업 요약 | `/`의 3D 표지는 유지하고 나머지 제품 페이지를 흰색 대시보드 작업 공간으로 통일했으며, 활동 목록과 추천 기록에 검색·목록 유지형 상세 인터랙션을 적용 |
| 수정한 파일 | `PRD.md`, `docs/DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/USER_FLOW.md`, `docs/WORK_STATUS.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/TASK_LOG.md`, `web/package.json`, `web/package-lock.json`, `web/src/app/globals.css`, `web/src/app/recommend/history/page.tsx`, `web/src/components/layout/AppShell.tsx`, `web/src/components/layout/Navigation.tsx`, `web/src/components/experiences/ExperienceDashboard.tsx`, `web/src/components/experiences/AnimatedExperienceList.tsx`, `web/src/components/experiences/DashboardExperienceDetail.tsx`, `web/src/components/experiences/ExperienceDetailClient.tsx`, `web/src/components/experiences/ExperienceDetail.tsx`(삭제), `web/src/components/ai/RecommendationResult.tsx`, `web/src/components/recommendations/AnimatedRecommendationList.tsx`, `web/src/components/ui/CountUp.tsx`, `web/src/components/ui/GooeyInput.tsx`, `web/src/components/ui/BorderBeamButton.tsx` |
| 변경 내용 | 공통 `AppShell`에서 레거시 책 프레임을 제거하고 모든 제품 라우트에 흰색 작업 표면과 모바일 메뉴를 제공. `motion` dependency를 추가해 대시보드·추천 기록의 목록/상세 전환과 CountUp에 사용. 대시보드는 제목 전용 Animated List, CountUp 활동 개수, Gooey `검색`, 선택 후 왼쪽 목록·오른쪽 상세 구조로 재구성. 인라인 상세와 활동 전체 화면은 `DashboardExperienceDetail`을 공유하며 미분석·재분석 필요 상태에 기존 AI 분석 API / localStorage 저장 흐름을 재사용하는 Border Beam형 요청 버튼을 제공. 추천 기록은 기존 상세 정보를 유지한 행, 검색, 선택 후 목록 유지형 우측 상세, 모바일 세로 구조와 초점 복귀를 적용 |
| 검증한 내용 | `cd web && npm run lint`, `./node_modules/.bin/tsc --noEmit`, `npm run build`, `git diff --check` 통과. 브라우저에서 `/dashboard`, `/experiences/new`, `/experiences/[id]`, `/experiences/[id]/edit`, `/experiences/[id]/analysis`, `/recommend`, `/recommend/history`의 공통 앱 셸, 레거시 책 프레임 0개, 가로 overflow 0, 콘솔 warning/error 0 확인. 데스크톱 활동 검색·상세·전체 화면과 390px 모바일 내비게이션·검색·목록-상세, 900px 추천 기록 단일 열 breakpoint를 확인. 별도 integration reviewer가 찾은 추천 간 복사 상태 잔존, 중간 너비 상세 잘림, 빈 검색 Tab 초점, 전체 화면 heading level, 문서 정합성 문제를 수정. 추천 기록은 저장 데이터가 없는 빈 상태를 실제 확인했으며, 저장 기록 선택 상태는 코드·타입·빌드 기준으로 검증 |
| 남은 작업 | 저장된 추천 기록이 있는 사용자 환경에서 추천 목록 선택·닫기·검색을 최종 수동 확인. 사용자 승인 전 commit / push / PR은 진행하지 않음 |
| 관련 커밋 메시지 | `feature: unify product workspace interactions` |

### 2026-07-12 - Pretendard 직접 호스팅과 CampusLog 워드마크 아이콘 적용

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-12 |
| 작업자 | Codex |
| 작업 요약 | 사용자가 제공한 Pretendard 원본을 제품 화면 한글 글꼴로 직접 호스팅하고, 좌측 상단 CampusLog 워드마크를 favicon과 Apple 아이콘에 반영 |
| 수정한 파일 | `web/public/fonts/PretendardVariable.woff2`, `web/public/fonts/LICENSE.txt`, `web/public/favicon.svg`, `web/public/app-icon.svg`, `web/src/app/globals.css`, `web/src/app/layout.tsx`, `docs/DESIGN.md`, `docs/ISSUE_LOG.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md` |
| 변경 내용 | `@font-face`로 Pretendard Variable을 등록하고 3D 책 표지의 영어와 제품 워드마크를 제외한 제품 텍스트에 적용. CampusLog 텍스트 워드마크 SVG를 브라우저 favicon과 `metadata.icons.apple`에 연결하고 캐시 구분 query를 추가 |
| 검증한 내용 | WOFF2가 사용자 제공 `Pretendard-1.3.9.zip` 원본과 SHA-256 기준으로 일치하고 OFL 라이선스 내용이 포함된 것을 확인. 라이선스의 후행 공백만 저장소 형식에 맞게 정리. `npm run lint`, `npx tsc --noEmit`, `npm run build`, 제품 라우트 브라우저 검증 통과 |
| 남은 작업 | Web App Manifest용 Chrome/Android 설치 아이콘은 이번 변경에 포함하지 않음. 약 2.0MB variable font의 subset 최적화는 Core Web Vitals 후속 검토 항목 |
| 관련 커밋 메시지 | `style: apply Pretendard and wordmark icons` |

### 2026-07-11 - 경험 목록 스크롤 및 고정 CTA 수정

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-11 |
| 작업자 | Codex |
| 작업 요약 | `codex/fix-experience-list-scroll` 범위로 `/dashboard`에서 저장된 경험이 첫 카드 아래로 잘리고 스크롤되지 않던 문제를 수정하고, 목록 스크롤 중에도 `새 경험 기록하기` CTA가 책 페이지 하단에 고정되도록 보강 |
| 수정한 파일 | `web/src/components/experiences/ExperienceDashboard.tsx`, `web/src/app/globals.css`, `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md` |
| 변경 내용 | 고정 높이 책 프레임 안에서 오른쪽 페이지와 앞면의 높이 체인을 `height: 100%`, `min-height: 0`으로 닫아 경험 목록 스크롤을 복구. 대시보드 앞면을 목록 전용 `dashboard-page-scroll`과 고정 액션 영역 `dashboard-page-action`으로 분리해 목록 범위가 CTA 위에서 끝나도록 변경. 860px 이하에서도 오른쪽 페이지를 남은 높이에 맞춘 flex 영역으로 두고 목록만 스크롤되도록 조정. localStorage, 경험 CRUD, AI 분석 / 추천 데이터 흐름은 변경하지 않음 |
| 검증한 내용 | `cd web && npm run lint`, `git diff --check` 통과. 원본 작업 트리와 동일한 격리 복사본에서 `npm run build` 통과. 브라우저에서 1440×900 기준 목록 `scrollTop`이 0에서 90으로 이동하는 동안 CTA 좌표 변화 0px, 390×844 기준 0에서 616.5로 이동하는 동안 CTA 좌표 변화 0px 확인. 두 화면 크기에서 마지막 경험 카드 접근, 빈 상태 CTA 노출, 페이지 넘김 후 `/experiences/new` 이동을 확인. 별도 UI / integration reviewer에서 `critical` / `major` / `minor` / `suggestion` 발견 없음 |
| 남은 작업 | 완료: PR #24가 merge commit `84e7f6d`로 Organization `main`에 반영되고, 후속 문서도 PR #25의 merge commit `55c3ade`로 반영됨. 로컬 `main` 동기화와 관련 작업 브랜치 정리는 현재 기능 PR 병합 후 확인 필요 |
| 관련 커밋 메시지 | `fix: keep dashboard list scrollable and CTA fixed` (`cb13b2a`), PR #24 merge (`84e7f6d`), 후속 문서 PR #25 merge (`55c3ade`) |

### 2026-07-11 - 최신 main 기반 Fork 인터랙티브 노트 UI 통합

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-11 |
| 작업자 | Codex |
| 작업 요약 | Organization `main`의 디자인 제약 완화 커밋 `bda0118`에서 새 검토 브랜치를 만들고, 개인 Fork `feature/frontend-vibe-coding`의 최종 작업 트리 `0929b98`을 커밋 이력 없이 그대로 이관한 뒤 사용자 수동 테스트를 완료 |
| 수정한 파일 | `.gitignore`, `web/package.json`, `web/package-lock.json`, `web/public/black-leather-book.webp`, `web/public/cover-book.png`, `web/src/app/page.tsx`, `web/src/app/dashboard/page.tsx`, `web/src/app/globals.css`, `web/src/components/hero/*`, `web/src/components/layout/*`, 관련 경험 / 추천 화면 경로 파일, `PRD.md`, `README.md`, `docs/DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/USER_FLOW.md`, `docs/WORK_STATUS.md`, `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md` |
| 변경 내용 | Fork 커밋을 cherry-pick / merge / rebase하지 않고 비문서 구현 파일의 blob hash가 `0929b98`과 일치하도록 작업 트리에 복원. `/`의 인터랙티브 3D 표지, `/dashboard` 기능 화면, 공통 책 프레임, 단일 새 경험 CTA, 데스크톱 좌측 메뉴 근접 모션을 적용하고 상위 기준 문서부터 작업 기록 문서까지 실제 라우트와 승인된 UX에 맞게 정리 |
| 검증한 내용 | `cd web && npm ci`, `npm run lint`, `npm run build`, `git diff --check` 통과. 브라우저에서 `/` Canvas 1개 / DOM 이미지 0개 / 콘솔 경고·오류 0개 / `/dashboard` 링크 확인. 대시보드 1064×664px, 새 경험 링크 1개, 대시보드 내 AI 추천 링크 0개, 페이지 번호 0개 확인. 390×844에서 362×732px 책 프레임과 가로 overflow 없음 확인. 사용자가 직접 경험 작성 → `/api/analyze` 200 → 분석 결과 → `/api/recommend` 200 → 추천 기록 저장 / 열람을 포함한 화면 테스트 통과를 확인하고 commit / push / PR 진행을 승인 |
| 남은 작업 | 모바일 헤더의 AI 추천 진입 부재는 ISSUE-016, WebGL 실패 시 비시각 fallback은 ISSUE-017에서 후속 검토. Draft PR에서 팀 리뷰 후 merge 여부 결정 |
| 관련 커밋 메시지 | `feature: add interactive notebook experience` |

### 2026-07-11 - 디자인 표현 제약 완화 문서 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-11 |
| 작업자 | Codex |
| 작업 요약 | 향후 프론트엔드 디자인 고도화 작업에서 애니메이션, 3D, WebGL, shader, premium landing experience를 불필요하게 제한하지 않도록 디자인 관련 기준 문서를 일관되게 정리 |
| 수정한 파일 | `AGENTS.md`, `README.md`, `PRD.md`, `docs/DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/USER_FLOW.md`, `docs/WORK_STATUS.md`, `docs/TODO.md`, `docs/TASK_LOG.md` |
| 변경 내용 | `docs/DESIGN.md`를 중심으로 Three.js, React Three Fiber, GSAP, Framer Motion, WebGL, shader, Lottie, particle, glassmorphism, morphing animation, scroll-based animation, micro interaction, premium landing experience를 성능 / 접근성 / 유지보수성 기준 안에서 사용할 수 있도록 수정. `AGENTS.md`에는 디자인 작업 시 `docs/DESIGN.md`를 우선 확인하고 고급 표현 기술을 정식 선택지로 보도록 규칙을 추가. PRD / IA / Screen Spec / User Flow / Implementation Plan에서는 제품 기능 제외 범위와 디자인 표현 자유를 분리하고, 회원 전환 목적의 별도 랜딩과 premium first viewport를 구분하도록 문구를 정리 |
| 검증한 내용 | 관련 문서에서 `과한 애니메이션`, `3D 그래픽`, `랜딩 히어로`, `Motion 계열 설치하지 않음`처럼 디자인 표현을 직접 제한하던 문구를 검색하고 수정 방향을 확인 |
| 남은 작업 | 실제 프론트엔드 디자인 고도화 PR에서 고급 모션 / 3D / WebGL 사용 시 Core Web Vitals, 모바일 렌더링, reduced motion fallback, 텍스트 대비, 키보드 접근성 검증 필요 |
| 관련 커밋 메시지 | 후보: `docs: relax frontend design constraints` |

### 2026-07-10 - AI 추천 결과 컨텍스트 불일치 수정

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-10 |
| 작업자 | Codex |
| 작업 요약 | `fix/recommendation-context-alignment` 범위로 AI 추천 결과에서 추천 경험 제목과 추천 이유 / 태그 / 성과 / 활용 방향 / 참고 문장이 서로 다른 경험을 기준으로 섞이는 문제를 수정 |
| 수정한 파일 | `web/src/app/api/recommend/route.ts`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md` |
| 변경 내용 | 기존 `/api/recommend`가 하나의 OpenAI 요청에서 경험 선택과 상세 추천 문장 생성을 함께 처리하던 구조를 분리. 1단계에서는 저장된 경험 전체와 분석 결과를 기준으로 `recommendedExperienceId`만 선택하고, 2단계에서는 서버가 확정한 선택 경험 1개와 해당 분석 결과만 전달해 추천 이유, 관련 태그, 강조할 성과, 활용 방향, 참고 문장을 생성하도록 변경. 서버 응답에서는 선택된 실제 경험의 id / title을 붙여 반환하므로 AI가 다른 경험 제목이나 상세 내용을 섞어 보내는 문제를 줄임 |
| 검증한 내용 | `cd web && npm run lint`, `cd web && npm run build`, `git diff --check` 통과 |
| 남은 작업 | 유효한 `OPENAI_API_KEY` 기준으로 브라우저에서 사용자가 제보한 대외활동 / 지원서 문항과 실제 경험 데이터를 넣고, 추천 경험과 추천 이유 / 태그 / 성과 / 활용 방향 / 참고 문장이 같은 경험에 근거하는지 수동 재검증 필요 |
| 관련 커밋 메시지 | 후보: `fix: align recommendation detail context` |

### 2026-07-10 - 브랜드 및 반응형 UI/UX 개선

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-10 |
| 작업자 | Codex |
| 작업 요약 | `design/responsive-brand-polish` 범위로 Campus Green + Mint 브랜드 톤, 데스크톱 / 모바일 AppShell 레이아웃, CTA / 카드 / EmptyState / 상세 화면의 반응형 마감을 정리 |
| 수정한 파일 | `web/src/app/layout.tsx`, `web/src/app/globals.css`, `web/src/components/layout/AppShell.tsx`, `web/src/components/experiences/ExperienceCard.tsx`, `web/public/favicon.svg`, `web/public/app-icon.svg`, `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md` |
| 변경 내용 | 전역 디자인 토큰에서 Campus Green / Mint 역할, focus ring, border, shadow, hover 상태를 정리. 데스크톱 AppShell은 좌측 사이드바와 우측 메인 콘텐츠가 안정적으로 보이도록 보강하고, 860px 이하에서는 사이드바 없이 상단 App Bar와 세로 스크롤 중심으로 동작하도록 조정. 모바일에서 CTA 버튼이 1열로 내려가고, ExperienceCard의 긴 제목 / 긴 역할 / 긴 태그 / 최근 수정일 / 상세 링크가 가로 overflow 없이 줄바꿈되도록 보강. EmptyState, Alert, Skeleton, 상세 / 추천 패널의 spacing, radius, shadow, overflow-wrap을 브랜드 톤에 맞게 정리. 새 로고를 직접 제작하지 않고 기존 `lucide-react`의 `BookMarked` 아이콘을 브랜드 마크와 favicon / app icon 후보로 재사용 |
| 검증한 내용 | `cd web && npm run lint`, `cd web && npm run build` 통과. dev server에서 Desktop Dashboard(1440px), Tablet Dashboard(768px), Mobile Dashboard(390px), Experience List, Experience Detail, Empty State, Error State, AI Analysis 실패 상태, AI Recommendation 실패 상태, 긴 제목 / 긴 역할 / 긴 링크 케이스를 확인. 모바일 빈 상태와 추천 입력 화면에서 CTA 겹침 없음, 데스크톱 사이드바 표시, 모바일 App Bar 표시, 주요 화면 가로 overflow 없음 확인. 새 경험 작성, 경험 수정, 경험 삭제 후 빈 상태 복귀 확인 |
| 남은 작업 | 로컬 `OPENAI_API_KEY`가 401 `invalid_api_key`로 응답해 AI 분석 성공 결과 저장, AI 추천 성공 결과 저장, 추천 저장 / 추천 기록 유지의 성공 흐름은 이번 환경에서 완료 검증하지 못함. LoadingState는 CSS와 컴포넌트 구조를 유지하며 색상 / spacing만 정리했으나 localStorage 로드가 즉시 끝나 장시간 skeleton 화면은 브라우저에서 별도 캡처하지 못함 |
| 관련 커밋 메시지 | 후보: `design: polish responsive brand UI` |

### 2026-07-10 - 대시보드 UI/UX polish

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-10 |
| 작업자 | Codex |
| 작업 요약 | `design/dashboard-polish` 범위로 메인 대시보드의 CTA 위계, 빈 상태, 로딩/실패 상태, 경험 카드 정보 구조, 분석 상태 배지, 정렬/필터 컨트롤 배치를 정리 |
| 수정한 파일 | `web/src/components/experiences/ExperienceDashboard.tsx`, `web/src/components/experiences/ExperienceCard.tsx`, `web/src/components/common/LoadingState.tsx`, `web/src/components/common/StatusBadge.tsx`, `web/src/components/common/SortSelect.tsx`, `web/src/components/common/FilterDropdown.tsx`, `web/src/app/globals.css`, `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md` |
| 변경 내용 | 대시보드 상단에서 `새 경험 기록하기`를 Primary CTA, `AI 추천 및 활용`을 Secondary CTA로 정리. 경험 목록 가까이에 저장된 경험 개수와 disabled 정렬/필터 컨트롤을 배치하되 실제 데이터 처리 로직은 추가하지 않음. 빈 상태 문구와 CTA 위계를 보강하고, 카드형 skeleton 로딩 컴포넌트와 실패 Alert / 다시 시도 UI를 추가. 경험 카드는 제목과 분석 상태를 먼저 노출하고 기간 / 역할 / 내용 미리보기 / 제한된 AI 태그 / 최근 수정일 순서로 스캔되도록 개선. 분석 상태 배지는 `미분석`, `분석 완료`, `재분석 필요` 라벨과 색상, fallback을 정리 |
| 검증한 내용 | `cd web && npm run lint`, `cd web && npm run build` 통과. dev server에서 경험 없음 빈 상태, 경험 1개 / 여러 개 목록, 긴 제목과 긴 역할 카드, 미분석 상태 배지, 정렬/필터 disabled 표시, 장식용 검색창 없음, 390px 작은 화면의 CTA / 컨트롤 / 카드 overflow 없음, 카드 클릭 후 상세 이동, 새 경험 작성, 상세 조회, 수정, 삭제 후 1개 목록 및 빈 상태 복귀를 확인. AI 분석 요청과 AI 추천 요청 버튼은 API Route까지 도달하고 사용자 친화적 실패 메시지를 표시함을 확인 |
| 남은 작업 | 로컬 `OPENAI_API_KEY`가 `invalid_api_key`로 응답해 AI 분석 성공 결과 저장, 분석 완료 / 재분석 필요 카드의 실제 브라우저 성공 상태, AI 추천 성공 결과 저장은 이번 환경에서 수동 완료 검증하지 못함. `storage.ts`가 JSON parse 실패를 빈 배열로 처리해 대시보드에서 파싱 실패와 실제 빈 상태를 구분할 수 없는 점은 `ISSUE_LOG.md`에 별도 기록 |
| 관련 커밋 메시지 | 후보: `design: polish dashboard experience list` |

### 2026-07-10 - AI 경험 추천 기능 구현

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-10 |
| 작업자 | Codex |
| 작업 요약 | `feature/ai-recommendation` 범위로 저장된 경험 전체와 AI 분석 결과를 기준으로 활용 목적에 맞는 경험 1개를 추천하고, 추천 이유 / 태그 / 성과 / 활용 방향 / 참고 문장을 표시하고 저장하는 흐름을 구현 |
| 수정한 파일 | `web/src/app/api/recommend/route.ts`, `web/src/app/recommend/page.tsx`, `web/src/app/recommend/history/page.tsx`, `web/src/components/ai/RecommendationForm.tsx`, `web/src/components/ai/RecommendationResult.tsx`, `web/src/components/layout/Navigation.tsx`, `web/src/lib/recommendationApi.ts`, `web/src/lib/types.ts`, `web/src/lib/storage.ts`, `web/src/app/globals.css`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md` |
| 변경 내용 | `/api/recommend` POST Route를 추가해 서버 환경 변수 `OPENAI_API_KEY`로만 OpenAI Responses API를 호출하고, 추천 결과 JSON schema를 검증해 반환하도록 구현. 추천 요청 / 응답 타입과 클라이언트 API 호출 함수를 추가. `/recommend` 화면에서 저장된 경험과 분석 결과를 읽고, 경험 없음 / 입력 없음 / 로딩 / 실패 / 성공 상태를 처리하며 성공 시 추천 결과를 `campuslog:v1:recommendations`에 최근순으로 저장. 추천 결과 컴포넌트에는 추천 경험 1개, 추천 이유, 관련 태그, 강조할 성과, 활용 방향, 참고 문장과 복사 버튼을 추가. 왼쪽 내비게이션에 추천 기록 메뉴를 추가하고 `/recommend/history`에서 과거 활용 목적 / 질문 / 추천 경험을 목록으로 선택해 다시 볼 수 있도록 보강 |
| 검증한 내용 | `cd web && npm run lint`, `cd web && npm run build`, `git diff --check` 통과. build 결과 `/recommend`와 `/recommend/history` 라우트가 생성됨을 확인. dev server에서 `/recommend` 접근, 경험 없음 빈 상태 표시, `/api/recommend` 잘못된 요청의 `BAD_REQUEST` 응답, 클라이언트 정적 번들에 `OPENAI_API_KEY` / `NEXT_PUBLIC` 문자열이 포함되지 않음을 확인. 저장된 추천 기록 목록 UI는 lint / build 기준으로 검증. 브라우저 자동화에서 경험 생성 시 `type="month"` 입력이 채워지지 않아 2개 경험 생성부터 AI 추천 성공까지의 전체 UI 시나리오는 자동 검증하지 못함 |
| 남은 작업 | 유효한 `OPENAI_API_KEY`가 설정된 로컬 브라우저에서 경험 2개 이상 생성, 최소 1개 분석 완료, `/recommend` 추천 성공, 참고 문장 복사, 새로고침 후 추천 결과 유지까지 수동 확인 필요. Vercel 배포 준비는 별도 단계로 남음 |
| 관련 커밋 메시지 | 후보: `feature: add AI experience recommendation` |

### 2026-07-09 - AI 경험 분석 기능 구현

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | `feature/ai-analysis` 범위로 특정 활동 경험을 Next.js API Route와 OpenAI API로 분석하고, 분석 결과를 localStorage에 저장해 경험의 분석 상태를 갱신하는 흐름을 구현 |
| 수정한 파일 | `web/src/app/api/analyze/route.ts`, `web/src/lib/types.ts`, `web/src/lib/storage.ts`, `web/src/lib/analysisApi.ts`, `web/src/components/ai/AnalysisResult.tsx`, `web/src/components/experiences/ExperienceDetailClient.tsx`, `web/src/components/experiences/ExperienceDetail.tsx`, `web/src/components/experiences/ExperienceAnalysisClient.tsx`, `web/src/app/globals.css`, `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md` |
| 변경 내용 | `/api/analyze` POST Route를 추가하고 서버 환경 변수 `OPENAI_API_KEY`로만 OpenAI Responses API를 호출하도록 구현. 분석 요청 / 응답 / 오류 타입을 보강하고, API 응답 형태와 저장된 `ExperienceAnalysis` 타입을 분리. `saveAnalysisResult`가 `id`, `generatedAt`, `sourceExperienceUpdatedAt`을 저장 시점에 부여하고 해당 경험의 `analysisStatus`를 `analyzed`로 변경하도록 보완. 상세 화면에는 AI 분석 요청, loading / disabled, 실패 안내, 분석 결과 보기 액션을 연결. 분석 결과 화면에는 요약, 핵심 역량 태그, 주요 성과, 키워드, 생성일, 재분석 필요 안내와 다시 분석 액션을 추가 |
| 검증한 내용 | `cd web && npm run lint`, `cd web && npm run build` 통과. `/api/analyze` 직접 호출로 `MISSING_API_KEY`, OpenAI 오류 일반화 응답, 유효한 새 API Key 기준 성공 응답을 확인. dev server에서 새 경험 작성, 상세 화면 이동, 분석 요청 loading / disabled, 실패 후 경험 데이터 유지와 재시도 UI, 분석 결과 없음 화면, 새로고침 후 경험 목록 유지, `/api/recommend` 미생성, 클라이언트 정적 번들에 API Key 관련 문자열이 포함되지 않음을 확인 |
| 남은 작업 | 유효한 API Key를 사용하는 일반 `npm run dev` 환경에서는 상위 쉘의 기존 `OPENAI_API_KEY`가 `.env.local`보다 우선되지 않도록 로컬 환경 정리가 필요. 유효 키 기준으로 브라우저에서 상세 화면 버튼 클릭부터 localStorage 분석 결과 저장, 목록의 `분석 완료`, 경험 수정 후 `needs_reanalysis`, 다시 분석 후 `analyzed` 복귀까지 전체 성공 흐름을 추가 확인해야 함. AI 추천 기능은 이번 PR에서 구현하지 않았고 다음 `feature/ai-recommendation` 범위로 남김 |
| 관련 커밋 메시지 | 후보: `feature: add AI experience analysis` |

### 2026-07-09 - PR 언어 규칙 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | 커밋 메시지와 PR 제목은 영어로 유지하되, PR 본문은 한국어로 작성하도록 `AGENTS.md`와 `docs/GIT_WORKFLOW.md`의 협업 규칙을 보강 |
| 수정한 파일 | `AGENTS.md`, `docs/GIT_WORKFLOW.md`, `docs/TASK_LOG.md` |
| 변경 내용 | `AGENTS.md`의 Git / PR 규칙에 커밋 메시지와 PR 제목은 영어, PR 본문은 한국어라는 기준을 추가. `docs/GIT_WORKFLOW.md`의 PR 생성 절차에도 같은 기준을 명시 |
| 검증한 내용 | `AGENTS.md`와 `docs/GIT_WORKFLOW.md`의 PR 언어 규칙이 서로 충돌하지 않는지 확인하고 `git diff --check`로 문서 형식을 점검 |
| 남은 작업 | 다음 PR부터 본문은 한국어, 제목과 커밋 메시지는 영어로 작성 |
| 관련 커밋 메시지 | `docs: clarify PR language rules` |

### 2026-07-09 - localStorage 기반 경험 CRUD 구현

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | `feature/experience-crud` 범위로 활동 경험 작성, 목록, 상세, 수정, 삭제 흐름을 Browser localStorage 기반으로 구현하고, 생성일 / 수정일 표시와 활동기간 입력 폼을 정리 |
| 수정한 파일 | `web/src/lib/storage.ts`, `web/src/lib/date.ts`, `web/src/lib/sampleExperiences.ts`, `web/src/app/page.tsx`, `web/src/app/experiences/new/page.tsx`, `web/src/app/experiences/[id]/page.tsx`, `web/src/app/experiences/[id]/edit/page.tsx`, `web/src/app/experiences/[id]/analysis/page.tsx`, `web/src/app/globals.css`, `web/src/components/common/EmptyState.tsx`, `web/src/components/common/StatusBadge.tsx`, `web/src/components/experiences/*`, `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md` |
| 변경 내용 | `campuslog:v1:*` storage key를 유지하며 경험 CRUD, 분석 / 추천 결과 저장 기본 구조, JSON parse fallback, SSR window guard를 구현. 새 경험 저장 후 상세 이동, 수정 후 상세 이동, 삭제 시 경험 / 분석 / 추천 참조 정리, 최근 수정순 목록 표시, 필수값 검증을 연결. 활동기간은 시작월 / 종료월 입력 폼으로 받고 기존 `period` 문자열 저장 구조를 유지. 생성 직후에는 생성일만 표시하고 실제 수정 이후에만 수정일을 표시하도록 변경 |
| 검증한 내용 | `cd web && npm run lint`, `cd web && npm run build`, `git diff --check` 통과. dev server에서 `/`, `/experiences/new`, `/experiences/[id]`, `/experiences/[id]/edit`, `/experiences/[id]/analysis` 흐름을 수동 확인 |
| 남은 작업 | `/api/analyze`와 OpenAI API 기반 AI 분석 요청 / 결과 저장 구현, `/api/recommend`와 AI 추천 구현, 정렬 / 필터 UI 및 실제 동작 구현, Vercel 배포 준비 |
| 관련 커밋 메시지 | `feature: add localStorage experience CRUD` |

### 2026-07-09 - 프로젝트 구조와 기술 방향 문서 정합성 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | UNIKER 1차/2차 MVP를 Next.js Full Stack 기준으로 정리하고, 기존 프론트엔드 경로를 `web/`으로 변경했으며, 별도 백엔드 폴더를 사용하지 않는 방향을 문서에 반영 |
| 수정한 파일 | `AGENTS.md`, `README.md`, `PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/TASK_LOG.md`, `docs/DESIGN.md`, `docs/WORK_STATUS.md`, `docs/IA.md`, `docs/USER_FLOW.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/SCREEN_SPEC.md` |
| 변경 내용 | 1차 MVP는 `web/`의 Next.js Full Stack 앱과 App Router API Routes 기준으로 정리. 2차 MVP는 Next.js Full Stack + Supabase 기반으로 정리. Spring Boot / MySQL / AWS RDS / AWS S3는 CampusLog 본 MVP가 아니라 UNIKER 이후 개인 Backend Portfolio Edition에서 별도 검토하는 항목으로 분리 |
| 검증한 내용 | 전체 Markdown 문서에서 기존 프론트엔드 / 백엔드 폴더 경로, `Spring Boot`, `MySQL`, `AWS RDS`, `AWS S3` 표현을 검색하고 남은 표현의 맥락을 확인 |
| 남은 작업 | 후속 기능 구현 시 `web/` 기준으로 작업하고, 별도 백엔드 폴더를 만들지 않도록 유지 |
| 관련 커밋 메시지 | `docs: align project structure and MVP stack` |

### 2026-07-09 - 작업 기록 문서 최신화

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | 2026-07-09에 진행된 디자인 확정, 구현 계획 작성, 프론트엔드 기본 구조 구현, 브랜치 정리 규칙 추가 작업이 기록 문서에 반영되지 않은 상태를 확인하고 작업 상태 문서를 최신화 |
| 수정한 파일 | `docs/TASK_LOG.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/ISSUE_LOG.md` |
| 변경 내용 | 오늘 커밋 이력을 기준으로 완료된 문서 / 기본 구조 작업을 `TASK_LOG.md`와 `TODO.md`에 반영. `WORK_STATUS.md`의 현재 단계와 완료된 개발 작업을 프론트엔드 기본 구조 머지 상태로 수정. `IMPLEMENTATION_PLAN.md`에 남아 있던 확인 필요 사항 중 후속 결정이 필요한 항목을 `ISSUE_LOG.md`에 추가 |
| 검증한 내용 | `git log --since='2026-07-09 00:00:00'`, `git show --stat`, `docs/IMPLEMENTATION_PLAN.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/ISSUE_LOG.md`, `AGENTS.md`를 확인 |
| 남은 작업 | 이후 작업부터는 실제 변경이 끝날 때 `docs/TASK_LOG.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/ISSUE_LOG.md` 갱신 필요 여부를 완료 단계에서 먼저 점검 |
| 관련 커밋 메시지 | `docs: update project status logs` |

### 2026-07-09 - 프론트엔드 기본 구조 구현

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | `feature/base-structure` 범위로 Next.js App Router 기반 프론트엔드 골격을 만들고 기본 라우트, AppShell, Navigation, 공통 스타일, 타입 파일을 추가 |
| 수정한 파일 | `web/package.json`, `web/package-lock.json`, `web/next.config.ts`, `web/eslint.config.mjs`, `web/tsconfig.json`, `web/next-env.d.ts`, `web/src/app/layout.tsx`, `web/src/app/page.tsx`, `web/src/app/globals.css`, `web/src/app/experiences/new/page.tsx`, `web/src/app/experiences/[id]/page.tsx`, `web/src/app/experiences/[id]/edit/page.tsx`, `web/src/app/experiences/[id]/analysis/page.tsx`, `web/src/app/recommend/page.tsx`, `web/src/components/layout/AppShell.tsx`, `web/src/components/layout/Navigation.tsx`, `web/src/lib/types.ts`, `web/src/lib/utils.ts` |
| 변경 내용 | 메인 / 경험 작성 / 경험 상세 / 경험 수정 / AI 분석 결과 / AI 추천 라우트의 placeholder 화면을 만들고, 좌측 사이드바형 앱 셸과 모바일 상단 내비게이션의 기본 구조를 추가. `lucide-react`, Next.js, React, TypeScript 기반 설정과 공통 스타일 토큰을 준비 |
| 검증한 내용 | 커밋 `9c789f5 feature: add frontend base structure`의 변경 파일과 `web/src` 구조를 확인. 실제 브라우저 실행 검증은 이 기록 보강 작업에서는 미검증 |
| 남은 작업 | `feature/experience-crud`에서 localStorage 기반 경험 CRUD, `sampleExperiences.ts`, 상세 / 작성 / 수정 실제 동작 구현 필요 |
| 관련 커밋 메시지 | `feature: add frontend base structure` |

### 2026-07-09 - 디자인 / 구현 계획 및 작업 규칙 반영

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | 1차 MVP의 디자인 방향을 확정하고, 구현 단계 / 브랜치 / PR 단위 / 위험 요소 / 확인 필요 사항을 `docs/IMPLEMENTATION_PLAN.md`에 정리. PR merge 후 작업 브랜치 정리 여부를 사용자에게 먼저 묻는 규칙을 `AGENTS.md`에 추가 |
| 수정한 파일 | `docs/DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md`, `AGENTS.md` |
| 변경 내용 | 노트 / 단권화 컨셉, 캠퍼스 그린 + 민트 색상 방향, 좌측 사이드바형 대시보드, App Router 라우트 구조, localStorage 설계, AI API Route 설계, 7/9~7/16 개발 로드맵을 정리. 작업 완료 후 브랜치 삭제 전 사용자 확인 규칙을 추가 |
| 검증한 내용 | 커밋 `e0ac8df`, `4465da7`, `0fad08b`, `16e3906`의 변경 파일과 문서 내용을 확인 |
| 남은 작업 | 구현 계획의 확인 필요 사항을 후속 작업 전에 결정하고, 실제 기능 구현은 `feature/experience-crud`부터 진행 |
| 관련 커밋 메시지 | `docs: finalize MVP design direction`, `docs: add CampusLog implementation plan`, `docs: clarify MVP implementation plan`, `docs: add branch cleanup prompt rule` |

### 2026-07-06 - AGENTS 작업 규칙 멘토링 피드백 반영

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-06 |
| 작업자 | Codex |
| 작업 요약 | 멘토링 피드백을 반영해 Codex가 CampusLog 작업 중 기준 문서, 작업 단위, 브랜치 / PR 협업, 리뷰 역할, 완료 보고를 더 명확히 따르도록 `AGENTS.md` 작업 규칙을 보강 |
| 수정한 파일 | `AGENTS.md` |
| 변경 내용 | 작업 유형별 참고 문서 순서를 추가하고, 전체 MVP를 한 번에 구현하지 않는 작은 단위 개발 원칙을 명시. `feature/*`, `docs/*`, `fix/*` 브랜치와 PR 기반 협업 규칙을 강화하고, 구현 에이전트와 reviewer subagent 분리 규칙 및 `critical` / `major` / `minor` / `suggestion` 리뷰 기준을 추가. 작업 후 요약 항목과 기록 문서 업데이트 규칙을 보강하고, 1차 MVP 범위 제한을 다시 강조 |
| 검증한 내용 | `AGENTS.md`, `PRD.md`, `README.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/GIT_WORKFLOW.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`를 확인하고 `git diff --check`로 문서 변경 상태를 점검 |
| 남은 작업 | 다음 개발 작업은 `AGENTS.md`의 작업 유형별 문서 확인 순서와 작은 브랜치 / PR 흐름에 맞춰 진행 |
| 관련 커밋 메시지 | `docs: strengthen AGENTS working rules` |

### 2026-07-05 - 멘토링 후 개발 / 협업 운영 방향 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-05 |
| 작업자 | Codex |
| 작업 요약 | 멘토링에서 정리된 1차 MVP 개발 순서, 브랜치 / PR 협업 방식, Codex 코드 이해와 리뷰 기준, 다음 액션을 팀 작업 기록에 남김 |
| 수정한 파일 | `docs/TASK_LOG.md`, `docs/WORK_STATUS.md` |
| 변경 내용 | 전체 MVP를 한 번에 구현하지 않고 메인 화면처럼 작고 검증 가능한 단위부터 진행하기로 정리. 기능별 브랜치 생성, PR 리뷰 후 `main` merge, `main` 안정 버전 유지, 팀원별 기능 단위 분담 원칙을 기록. Codex가 생성한 코드는 한 줄씩 모두 해석하기보다 사용자 흐름, 주요 파일 역할, 데이터 흐름, 테스트 방법 중심으로 이해하고, 구현 에이전트와 reviewer subagent를 분리해 `critical` / `major` / `minor` / `suggestion` 기준으로 리뷰하기로 정리. 2026-07-07 라이브 강의 이후 `DESIGN.md`를 확정하고 첫 화면 구현을 시작하며, 1차 MVP는 활동 경험 입력 → AI 요약 / 역량 태그 분석 → 활용 문장 생성 / 복사 / 저장 흐름에 집중하고 로그인, 결제, 커뮤니티, 외부 서비스 자동 연동, 파일 첨부, 고급 추천 기능은 제외하기로 기록 |
| 검증한 내용 | `AGENTS.md`, `docs/TASK_LOG.md`, `docs/WORK_STATUS.md`, `docs/ISSUE_LOG.md`, `docs/GIT_WORKFLOW.md`를 확인하고 기존 기록 방식과 충돌하지 않도록 반영 |
| 남은 작업 | 2026-07-07 라이브 강의 이후 `DESIGN.md`를 확정하고, 첫 화면 구현 작업을 별도 기능 브랜치에서 시작 |
| 관련 커밋 메시지 | `docs: record mentoring operation decisions` |

### 2026-07-03 - 기획 문서 정합성 승인 항목 반영

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-03 |
| 작업자 | Codex |
| 작업 요약 | CampusLog 기획 문서 간 화면 구조, AI 분석 요청 위치, 분석 결과 의미, 추천 범위, 추천 결과 저장 우선순위 표현을 승인 항목 기준으로 정리 |
| 수정한 파일 | `README.md`, `PRD.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md` |
| 변경 내용 | 활동 경험 상세 화면을 독립 화면으로 명확화하고, 작성 / 수정 저장 후 상세 이동 및 상세 화면에서 AI 분석 요청 흐름으로 통일. 분석 결과는 특정 활동 경험에 연결된 localStorage 저장 기록으로 정리. AI 경험 추천 및 활용은 저장된 경험 전체와 분석 결과 기준으로 가장 적합한 경험 1개를 추천하는 흐름으로 정리 |
| 검증한 내용 | 문서 간 용어와 1차 MVP 제외 범위가 충돌하지 않는지 검색으로 확인 |
| 남은 작업 | Next.js 프론트엔드 초기 세팅, LocalStorage 데이터 구조 설계, 활동 경험 상세 화면과 AI 분석 요청 CTA 구현 |
| 관련 커밋 메시지 | `docs: align MVP planning flow` |

### 2026-07-01 - 개발 단계 전략 문서 반영

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-01 |
| 작업자 | Codex |
| 작업 요약 | CampusLog 개발 단계를 1차 MVP, 2차 MVP, UNIKER 이후 개인 Backend Portfolio Edition으로 정리하고 문서 전반에 일관되게 반영 |
| 수정한 파일 | `PRD.md`, `README.md`, `AGENTS.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/WORK_STATUS.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/TASK_LOG.md` |
| 변경 내용 | 1차 MVP는 Next.js, Browser localStorage, `sampleExperiences.ts`, OpenAI API, Vercel 기준으로 명확화. Supabase는 2차 MVP 확장 예정, Spring Boot / MySQL / AWS S3는 UNIKER 이후 개인 Backend Portfolio Edition으로 분리 |
| 검증한 내용 | 요청 기준 문서 전체를 먼저 확인하고, 1차 MVP 범위가 활동 경험 기록, AI 경험 분석, AI 경험 추천 및 활용으로 유지되는지 점검 |
| 남은 작업 | Next.js 프론트엔드 초기 세팅, LocalStorage 데이터 구조 설계, `sampleExperiences.ts` 샘플 데이터 설계, Vercel 배포 준비 |
| 관련 커밋 메시지 | `docs: clarify phased MVP roadmap` |

### 2026-06-30 - 사용자 흐름 문서 파일명 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-06-30 |
| 작업자 | Codex |
| 작업 요약 | `FLOW.md`를 `USER_FLOW.md`로 파일명 변경 |
| 수정한 파일 | `docs/USER_FLOW.md`, `README.md`, `AGENTS.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md` |
| 변경 내용 | 운영진 요구 파일명에 맞춰 사용자 흐름 문서 파일명과 관련 기준 문서 참조를 `USER_FLOW.md` 기준으로 정리 |
| 검증한 내용 | 프로젝트 내 `FLOW.md` 참조를 검색하고 활성 기준 문서 참조가 `USER_FLOW.md`로 바뀌었는지 확인 |
| 남은 작업 | MVP 기능 범위 최종 확정, 구현 시작 전 화면 구현 순서 정리 |
| 관련 커밋 메시지 | `docs: rename user flow document` |

### 2026-06-30 - GitHub 협업 규칙 문서 추가

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-06-30 |
| 작업자 | Codex |
| 작업 요약 | CampusLog 팀이 GitHub에서 안전하게 협업하기 위한 브랜치, PR, 커밋, Codex 작업 규칙 문서를 추가 |
| 수정한 파일 | `docs/GIT_WORKFLOW.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/TODO.md` |
| 변경 내용 | GitHub 협업 규칙 문서를 새로 작성하고, 완료 문서 목록과 TODO 상태를 업데이트 |
| 검증한 내용 | `PRD.md`, `README.md`, `AGENTS.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`를 확인 |
| 남은 작업 | MVP 기능 범위 최종 확정, 구현 시작 전 화면 구현 순서 정리 |
| 관련 커밋 메시지 | `docs: add GitHub workflow guide` |

### 2026-06-30 - 작업 상태 기록 문서 추가

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-06-30 |
| 작업자 | Codex |
| 작업 요약 | CampusLog 프로젝트의 작업 상태, 작업 로그, TODO, 이슈 관리를 위한 문서 4개를 추가 |
| 수정한 파일 | `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md` |
| 변경 내용 | 현재 문서 정리 단계 상태를 기록하고, 다음 작업자가 바로 이어서 사용할 수 있는 템플릿과 초기 항목을 작성 |
| 검증한 내용 | `PRD.md`, `README.md`, `AGENTS.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`를 기준 문서로 확인 |
| 남은 작업 | MVP 기능 범위 최종 확정, GitHub 협업 규칙 문서 작성, 구현 시작 전 화면 구현 순서 정리 |
| 관련 커밋 메시지 | `docs: add work tracking templates` |
