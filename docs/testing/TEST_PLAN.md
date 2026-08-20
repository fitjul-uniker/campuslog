# CampusLog 테스트 계획

## 문서 목적

이 문서는 CampusLog의 기능 명세와 실제 구현을 연결해 다음 사이클을 반복할 수 있게 하는 실행 기준입니다.

```text
기능 명세 확인
→ 테스트 케이스 정의
→ 동일한 입력과 환경에서 실행
→ 실패 증거 수집
→ 최소 범위 수정
→ 동일 조건 재실행
→ 관련 회귀 테스트
→ TEST_RESULTS / TEST_HISTORY 기록
```

테스트 상태와 현재 결과는 `TEST_CASES.md`, 최신 전체 실행 결과는 `TEST_RESULTS.md`, 실패·수정·재실행의 누적 이력은 `TEST_HISTORY.md`에서 관리합니다. 추측이나 코드 정적 검토만으로 `PASS`를 부여하지 않습니다.

## 구현 기준 범위

2026-08-20의 실제 라우트, 컴포넌트, repository, migration을 기준으로 아래 기능을 테스트합니다.

| 영역 | 실제 구현 기준 |
| --- | --- |
| 공개·인증 | `/`, `/login`, `/signup`, `/onboarding`, `/auth/callback`, 이메일·비밀번호 및 Google OAuth, 비공개 이름·닉네임 metadata |
| 경로 보호 | `/dashboard`, `/activities/**`, `/experiences/**`, `/recommend/**`, AI API의 서버 세션 확인 |
| 오늘의 기록 | 진행/예정 활동 생성·조회·수정·삭제, 캘린더, 날짜별 기록 생성·수정·삭제 |
| 활동 종료 | 종료 상태, 연결 기록 기반 AI 합성, 합성 초안, 사용자 검토 후 완료 경험 저장, 중복 연결 방지 |
| 나의 활동 | 진행 활동과 완료 경험 통합 목록, 완료 경험 CRUD, 검색·즐겨찾기, 상세·분석 스플릿뷰 |
| 첨부 | 완료 경험별 JPG·PNG·WebP·PDF 최대 3개/각 5MB, private Storage, signed URL 조회·삭제 |
| AI 분석 | `/api/analyze`, 요약·STAR·성과·부족 정보·키워드, 분석 저장과 재분석 |
| AI 추천 | `/api/recommend`, 텍스트/이미지 입력, 목적·JD 분석, 근거 기반 Top 3, 자동 저장·기록 재조회 |
| 답변 초안 | `/api/answer-drafts`, 선택 경험별 목적·분량 초안, 근거·주의점, 누적 저장 |
| 보완 정보 | 분석 부족 정보 답변과 레거시 `/api/evidence-followups` 호환 |
| 데이터 | Supabase 사용자별 repository, RLS migration, localStorage UI preview adapter |
| 품질 | Node 테스트, lint, TypeScript, production build, 모바일·반응형·접근성·오류 상태 |

문서와 코드가 다를 때 실제 동작을 우선합니다. 현재 확인된 문서 불일치는 다음과 같습니다.

- `docs/AI_API_CONTRACT.md` 상태 설명에는 OCR/이미지 입력이 제외 또는 Optional로 남아 있지만, 실제 코드에는 추천 이미지 입력·검증·vision 요청·입력 출처 저장이 구현되어 있습니다.
- `docs/AUTH_CONTRACT.md`의 보호 API 표에는 세 route만 적혀 있지만, 실제 `/api/answer-drafts`와 `/api/evidence-followups`도 route handler에서 세션을 검사합니다.
- 일부 TODO/WORK_STATUS에는 구현 완료 기능의 실제 로그인 smoke test가 여전히 남아 있습니다. 본 테스트 기록에서 이번 실행 여부를 별도로 판단합니다.

## 테스트 제외 및 미구현 범위

다음은 실패로 계산하지 않습니다.

| 범위 | 분류 | 이유 |
| --- | --- | --- |
| localStorage → 계정 DB 가져오기 UI·upsert | `NOT_IMPLEMENTED` | Deferred / Optional로 명시되어 있고 실제 사용자 플로우가 없음 |
| 다중 runtime을 견디는 durable rate limit·AI idempotency key | `NOT_IMPLEMENTED` | 현재 runtime-local guard와 UI 중복 방지만 구현 |
| 비밀번호 재설정·최종 이메일 확인 정책 | `OUT_OF_SCOPE` | 제품 정책 미확정 |
| 관리자·결제·커뮤니티·공개 프로필·외부 자동 동기화 | `OUT_OF_SCOPE` | 2차 MVP 제외 범위 |
| 네이티브 앱·PDF 포트폴리오 자동 생성·Spring Boot 확장 | `OUT_OF_SCOPE` | 현재 저장소 범위 밖 |
| OpenAI project spend limit·alert 설정 | `OUT_OF_SCOPE` | 코드가 아닌 운영 계정 설정이며 별도 확인 필요 |

## 테스트 환경

| 항목 | 기준 |
| --- | --- |
| 실행 일자/시간대 | 2026-08-20, Asia/Seoul |
| OS | macOS 개발 환경 |
| Node.js | v23.11.0, 프로젝트 요구사항 `>=22` 충족 |
| npm | 10.9.2 |
| 앱 | Next.js 15.5.20 개발 서버 및 production build |
| 브라우저 | Codex in-app Chromium, 데스크톱 기본 viewport 및 390px 모바일 override |
| 로컬 UI 격리 | `NEXT_PUBLIC_CAMPUSLOG_UI_PREVIEW=1`, localStorage repository, 보호 API 우회 없음 |
| 통합 실행 | `env -u OPENAI_API_KEY npm run dev`, `.env.local`의 Supabase/OpenAI 설정 사용 |
| 비밀정보 | 키·토큰·비밀번호·세션 cookie는 출력하거나 문서화하지 않음 |

## 테스트 계정과 데이터 조건

- 실제 로그인 통합 검증에는 사용자가 지정한 기존 QA 계정을 사용합니다. 계정 식별자와 비밀번호는 이 디렉터리의 문서·로그에 기록하지 않습니다.
- 가입 플로우 격리 검증이 필요하면 `campuslog.test` 도메인의 전용 테스트 계정을 사용하고 실제 사용자 이메일·개인정보를 사용하지 않습니다.
- 기존 QA 계정 데이터는 읽기·AI 재사용을 우선하고, 생성 데이터는 `QA` 접두어로 식별합니다.
- 삭제 테스트는 대상과 연관 데이터를 확인한 뒤 별도 안전 절차로 수행합니다. 다른 사용자의 데이터는 변경하지 않습니다.
- AI 입력에는 민감정보를 넣지 않고 짧은 합성 QA 문항과 이미 저장된 테스트 경험만 사용합니다.

## 기능별 전략

### 인증과 접근 제어

- 공개/보호 경로 redirect, 안전한 `returnTo`, 로그인 성공·실패, 새로고침 세션 유지, 로그아웃을 브라우저와 HTTP 응답으로 확인합니다.
- 모든 AI route에 비로그인 요청을 보내 `401`과 공통 오류 구조를 확인합니다.
- 계정 A/B 분리는 동일 ID 추측이 아니라 각 계정의 목록·직접 URL·RLS CRUD 결과로 검증합니다.

### 활동과 날짜별 기록

- 빈 상태에서 활동을 생성하고 상세 이동, 새로고침 유지, 수정, 날짜별 기록 생성·수정·삭제를 순서대로 실행합니다.
- 미래 날짜, 시작일 이전, 빈 내용, 기록 없는 종료, 반복 클릭, 새로고침 중 상태를 별도 확인합니다.
- 활동 종료는 연결 기록을 보존하고 완료 경험을 하나만 연결하는지 확인합니다.

### 완료 경험과 첨부

- 필수 입력, 긴 입력 상한, 링크 URL·중복 검증, 저장·새로고침·수정·삭제를 확인합니다.
- 첨부는 허용/거부 형식·개수·용량 자동 테스트 후 실제 로그인 Storage에서 업로드·signed URL·삭제를 확인합니다.
- 첨부만 변경해 경험 원문과 분석 최신 상태가 바뀌지 않는지 회귀 확인합니다.

### AI 기능

- 실제 OpenAI 호출은 비용을 통제하기 위해 대표 흐름당 최소 1회만 사용합니다. 같은 입력을 무의미하게 반복 호출하지 않습니다.
- 문자열 완전 일치 대신 `ok`, 필수 필드, schema/prompt/model metadata, 근거 존재, 실제 경험 ID, 저장·재조회, 오류 contract를 검증합니다.
- 원본에 없는 수치·역할을 사실처럼 생성하지 않는지, 부족 정보·과장 주의점으로 분리하는지 확인합니다.
- API 실패·취소·저장 실패에서는 원본 입력과 마지막 유효 결과가 유지되고 재시도 경로가 있는지 확인합니다.
- rate limit·본문 한도처럼 OpenAI를 호출하기 전에 판정 가능한 케이스는 실제 모델 호출 없이 검증합니다.

### 반응형과 접근성

- 핵심 화면을 데스크톱과 390px에서 확인하고 `scrollWidth <= clientWidth`로 가로 overflow를 검사합니다.
- 320px/200% 확대, 키보드 초점, dialog Escape·초점 복귀, reduced motion, forced colors는 가능한 범위를 자동 구조 테스트와 브라우저 확인으로 나눕니다.
- 실제로 브라우저에서 확인하지 못한 시각 항목은 `NOT_RUN`으로 유지합니다.

## 정상 흐름과 예외 흐름

정상 흐름은 다음 연결을 우선합니다.

```text
로그인
→ 활동 생성
→ 날짜별 기록
→ 활동 종료·AI 합성
→ 완료 경험 저장
→ AI 분석
→ AI 추천
→ 답변 초안
→ 추천 기록·새로고침 재조회
```

예외 흐름은 실제 구현 상한과 상태에 맞춰 다음을 다룹니다.

- 빈 입력, 공백 입력, 잘못된 날짜·URL·파일 형식
- 긴 경험/JD/답변 분량 입력
- 반복 제출과 같은 대상의 중복 AI 실행
- API 401/400/413/422/429/502/504와 repository 저장 실패
- 데이터 없음, 존재하지 않는 ID, 다른 사용자 소유 ID
- 새로고침·내부 route 이동·세션 만료
- 모바일 가로 넘침과 dialog/footer 접근 불가

## 완료 기준

- 핵심 사용자 플로우의 실행 가능한 케이스가 `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN` 중 하나로 명확히 결정되어야 합니다.
- 실행하지 않은 케이스를 `PASS` 처리하지 않습니다.
- `FAIL`은 재현 조건·증거·원인·수정 파일·동일 조건 재실행·회귀 결과를 남깁니다.
- Node 테스트, lint, TypeScript, production build가 통과해야 합니다.
- 개발 서버에 미해결 실행 오류가 없어야 합니다.
- AI 성공 결과는 필수 구조와 저장·재조회가 확인되어야 합니다.
- `TEST_RESULTS.md`의 집계와 `TEST_CASES.md`의 상태가 일치해야 합니다.

## 회귀 테스트 기준

| 수정 영역 | 최소 회귀 범위 |
| --- | --- |
| 인증/middleware | 공개 화면, 보호 page redirect, AI route 401, 로그인·새로고침·로그아웃 |
| repository/DB | 해당 CRUD, 새로고침 재조회, 다른 계정 격리, 연관 delete/cascade |
| 활동/기록 | 활동 생성·날짜별 기록·종료·완료 경험 연결 |
| 경험/첨부 | 경험 CRUD, 분석 최신 상태, 첨부 AI 입력 분리 |
| AI route | 입력 guard, 인증, 실제 성공 구조 1회, 저장·기록 재조회, 취소/실패 보존 |
| UI/반응형 | 영향 화면 데스크톱·390px, 키보드 초점, 가로 overflow |
| 공통 변경 | `node --test`, lint, typecheck, production build |

TypeScript 검사와 production build는 `.next/types` 생성 경합을 피하기 위해 병렬로 실행하지 않고 순차 실행합니다.
