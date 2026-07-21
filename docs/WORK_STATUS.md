# CampusLog Work Status

## 현재 단계

- [x] 1차 MVP 핵심 흐름 구현
- [x] v1.1 진행형 경험 기록·캘린더·AI 완료 경험 합성 고도화
- [x] v1.1 정적 검사, production build, 데스크톱·모바일 브라우저 검증
- [x] 2차 MVP 단계와 두 작업 Track 문서화
- [x] v1.1 commit / push / Draft PR #27
- [x] 팀 리뷰와 main merge
- [x] 2차 MVP 기능 브랜치 시작
- [x] Supabase Auth foundation 구현
- [x] 사용자별 Supabase DB schema / RLS foundation 작성
- [x] localStorage 모델과 DB 이전 정책 문서화
- [x] 주요 화면 데이터 read/write를 Supabase 사용자별 repository로 전환
- [x] Supabase project migration 적용과 Google 계정 A/B 데이터 분리 수동 smoke test
- [x] 비로그인 순환 기록 문구 → 중앙 인증 카드 → 인증 후 3D 책 표지 진입 흐름 구현
- [x] 회원가입 방식 선택 → 이메일 조건부 자격 증명 → 이름·닉네임 Stepper와 Google 온보딩 복귀 구현
- [x] 오늘의 기록 빠른 작성 폼을 반응형 플로팅 패널로 고도화
- [x] CampusLog AI 추천 화면 설명과 추천·기록 간 교차 이동 위계 정리
- [x] 활동 추가 Expandable Screen, 공용 Checkbox·CopyButton과 좌측 하단 프로필 드롭다운 통합
- [x] 프로필 드롭다운 로그아웃 제출 안정화와 세션 제거·보호 경로 재차단 브라우저 확인
- [x] AI API 보호 foundation: 세 AI API Route의 서버 세션 확인, 401 JSON 오류, 입력 상한, timeout, runtime-local rate guard 적용
- [x] AI 경험 분석 v2: STAR, 원본 근거, 부족 정보, 자소서 소재 각도, 역량별 근거 schema / 저장 / 표시 구현
- [x] 추천 v2: 문항 / JD 요구사항 추출, 경험 Top 3 매칭, 부족 근거와 과장 위험 schema / 저장 / 표시 구현
- [x] 답변 초안 생성: 추천 v2 선택 경험 기반 사용자가 고른 500자 / 800자 / 1000자 자기소개서, 면접 답변, 포트폴리오 설명 단일 초안 schema / 저장 / 표시 구현
- [x] 기록 보완 루프: AI 보완 질문 생성, 사용자 보완 답변 별도 저장, 보완 답변 기반 분석 재생성 흐름 구현
- [x] QA 버그 안정화: 보완 질문 draft 보존·복원, 답변 초안 분량 보정, 활동 복원·삭제·날짜 상태, 추천 점수 등급, 오늘 한 일 팝업 스크롤 수정
- [x] 오늘의 기록 캘린더 옆 빠른 기록 카드를 제목 우선 날짜별 이벤트 목록과 `+` 작성·진행 활동 필요 안내 팝업으로 재구성
- [ ] 나의 활동 제목 한 줄 고정·좁은 패널 검색 축약 구현과 UI preview 폭별 검증 완료, 실제 로그인 완료 경험의 목록·상세·분석 전환 확인 필요 (`ISSUE-066`)
- [ ] 나의 활동 완료 경험의 전체 화면 액션 제거와 AI 분석 스플릿뷰 구현·preview 반응형 검증 완료, 실제 로그인 분석 데이터의 상호작용 회귀 확인 필요 (`ISSUE-067`)
- [x] 최신 main 기준 미반영 UI 재적용: 랜딩·인증 입력, 중앙 빠른 기록 패널, AI Border Beam, JD 목적, Checkbox, 추천 기록 복사, RippleButton
- [x] 팀 테스트용 Supabase Auth 이메일/비밀번호 계정 9개 생성

2026-07-17 `codex/reapply-unpr-ui-polish`에서는 최신 `origin/main`의 QA 안정화 변경을 보존한 채 PR에 포함되지 않았던 UI/UX 변경을 다시 구현했습니다. 랜딩 수동 재생 컨트롤을 제거하고 명사·조사 사이 2~5px 여유와 평면 인증 입력을 적용했습니다. 빠른 기록 패널은 화면 정중앙에 배치하고, AI 실행 CTA는 colorful Border Beam과 `AI 분석` 문구를 사용합니다. 실제 checkbox는 경로 모션을 갖는 공용 Radix Checkbox로 정리했으며 추천 기록의 중복 eyebrow와 복사 텍스트를 제거했습니다. 결과가 발생하는 핵심 CTA에는 공용 RippleButton을 적용하되 인증·탐색·삭제 컨트롤은 제외했습니다. 추천 목적 `JD`는 코드와 additive migration까지 작성했으며 실제 Supabase migration 적용과 로그인 세션 OpenAI·DB 저장 smoke test는 완료하지 않았습니다.

2026-07-17 팀 테스트 계정 준비를 위해 Supabase Auth 관리자 API를 사용하는 `npm run seed:test-users` 스크립트를 추가했습니다. 기본 계정은 `test1@campuslog.test`부터 `test9@campuslog.test`까지이며 비밀번호는 `test1111`부터 `test9999`까지입니다. 스크립트는 `campuslog_profile` metadata를 함께 설정해 온보딩 완료 계정처럼 사용할 수 있게 하며, 기존 계정이 있으면 비밀번호와 metadata를 갱신합니다. 사용자가 실제 Supabase project에서 9개 계정이 모두 `created`로 생성된 것을 확인했습니다. `SUPABASE_SERVICE_ROLE_KEY`는 계정 생성/초기화 담당자만 사용하는 서버 전용 관리자 키이며 앱 코드, 브라우저, 일반 팀원 env에는 공유하지 않습니다. 더미 경험·활동·기록 데이터 주입은 아직 수행하지 않았습니다.

## 구현 이력

현재 `main`에는 PR #29의 Supabase Auth foundation과 PR #30의 사용자별 데이터 schema, RLS 정책, repository 경계, 주요 화면의 Supabase repository 연결이 반영되어 있습니다. 사용자가 일반 이메일 인증 메일 흐름, Google OAuth, Supabase SQL Editor migration 적용, Table Editor 테이블 생성, 서로 다른 Google 계정의 계정별 데이터 분리 smoke test를 확인했습니다. `ux/auth-first-entry-flow`에서는 비로그인 `/` 좌측 상단에 `CampusLog` 워드마크를 고정하고, 중앙 순환 기록 문구와 GSAP 스크롤 아웃을 적용한 뒤 작은 휠 입력으로 다음 viewport의 중앙 인증 카드까지 자동 이동하도록 진입 순서를 재구성했습니다. `대학생활`은 강하게, 나머지 순환 명사는 옅고 가볍게 표시하며 조사 `을/를`은 항상 검정·강한 굵기로 고정합니다. 실제 글자 폭은 연속 보간하고 조사는 값이 실제로 바뀔 때만 전환하며, 44px 일시정지·재생 컨트롤과 reduced motion 정지 상태를 제공합니다. 구분선과 로그인 mode의 `Welcome back`·소개 문구는 제거했습니다. Tailwind CSS v4와 shadcn/ui 설정 및 Input·Label primitive도 추가했습니다. 회원가입은 이메일·Google 방식 선택으로 시작하며, 이메일은 자격 증명 뒤 이름·닉네임 Stepper를 완료하고 Google 신규·미완료 계정은 OAuth 시작 위치와 무관하게 callback 뒤 `/onboarding`에서 같은 단계를 진행합니다. 미완료 세션은 제품 화면에 진입할 수 없고 기존 계정도 완료 metadata가 없으면 최초 1회 입력합니다. 이름·닉네임은 비공개 Supabase user metadata로 저장하고 권한 판단에는 사용하지 않습니다. `/dashboard`의 빠른 기록은 설명 문단 없는 CTA 카드에서 활동·내용을 입력하는 플로팅 패널로 확장되고, 자세한 기록이 AI 분석 정확도에 도움이 된다고 안내하며 빈 상태는 `진행 활동 추가`와 `오늘로 돌아가기`로 원인을 구분합니다. 활동 추가는 누른 버튼에서 가장자리 여백을 둔 near-white 대형 둥근 패널로 확장되고 닫을 때 같은 버튼으로 축소되며, `/activities/new` 직접 진입도 같은 validation을 사용합니다. 좌측 하단은 원형 아바타·닉네임의 구분된 프로필 영역으로 바꾸고 로그아웃을 드롭다운에 통합했으며, 메뉴 제출을 안정화하고 실제 세션을 삭제한 뒤 완료 알림 없이 로그인 영역으로 복귀합니다. Checkbox·CopyButton 상태도 공용 접근성 primitive로 통일했습니다. CampusLog AI 추천 화면은 현재 경로를 반복하는 분할 탭과 제목 위 `CampusLog AI` eyebrow를 제거하고 헤더의 `추천 기록`, 기록 화면의 `새 추천 받기` 액션으로 교차 이동하도록 정리했습니다. 정식 사용자는 계정별 DB부터 새로 시작하므로 localStorage → 계정 DB 이전 UI / upsert 구현은 Deferred / Optional로 전환했습니다. `feature/ai-analysis-v2`에서는 기존 분석 네 필드의 하위 호환을 유지하면서 STAR, 원본 근거, 부족 정보, 자소서 소재 각도, 역량별 근거를 `/api/analyze` structured output, repository 저장, Supabase migration, 결과 화면에 추가했습니다. `feature/ai-recommendation-v2`에서는 `/api/recommend`가 문항 / JD 요구사항을 구조화하고 분석 v2의 STAR, evidence, evidenceGaps, coverLetterAngles, competencyEvidence를 활용해 경험 Top 3, 매칭 근거, 부족 근거, 과장 위험, 활용 각도를 반환·저장·표시하도록 확장했습니다. 기존 추천 v1 필드는 유지하고 v1 저장 결과는 1개 match와 빈 요구사항으로 보정해 읽습니다. `feature/ai-answer-drafts`에서는 추천 v2의 선택 match와 경험 원본, 분석 v2 결과를 바탕으로 사용자가 선택한 500자 / 800자 / 1000자 자기소개서, 면접 답변, 포트폴리오 설명 중 1개 초안을 생성하고, 별도 `answer_drafts` 저장소에 type별로 누적 연결해 기존 추천 v1/v2 기록을 보존합니다. `feature/ai-evidence-followup`에서는 분석 / 추천 / 답변 초안에서 드러난 부족 근거를 보완 질문으로 바꾸고, 사용자 답변을 별도 `experience_followups` 저장소에 저장한 뒤 명시적 재분석 때 원본 경험과 함께 사용하도록 연결했습니다. 다음 AI 개발 초점은 `OCR / JD 이미지 입력`입니다.

`feature/ai-api-protection`에서는 `/api/analyze`, `/api/recommend`, `/api/synthesize-activity`가 route handler 내부에서도 Supabase 세션을 확인합니다. 비로그인 요청은 공통 401 `SESSION_REQUIRED` JSON으로 반환하고, 요청 크기 / 필드 상한, OpenAI timeout, 사용자별 runtime-local rate guard와 429 `RATE_LIMITED` + `retryAfter` contract를 추가했습니다. `service_role` key는 사용하지 않으며 AI 세부 계약은 `docs/AI_API_CONTRACT.md`에 기록했습니다.

## v1.1 완료 기준선

```text
활동 추가
→ 날짜별로 실제 한 일 기록
→ 월간 캘린더 확인
→ 활동 종료
→ AI 사실 기반 완료 경험 초안
→ 사용자 검토 후 나의 활동 저장
→ AI 분석
→ CampusLog AI 추천과 추천 기록
```

주요 완료 사항:

- `/dashboard`: 오늘의 기록, 진행 활동, 캘린더, 빠른 기록, 날짜별 기록
- `/activities/new`: 제목·간단한 내용·시작일·예상 종료일 또는 미정으로 활동 추가
- `/activities/[id]`: 활동 상태, 타임라인, 종료, AI 합성, 완료 경험 저장
- `/experiences`: 완료 경험과 진행 활동을 함께 보는 나의 활동
- `CampusLog AI`: AI 기반 활동 추천과 추천 기록
- localStorage 데이터 호환, 활동 종료 AI 합성 멱등성, 추천 저장 실패 처리
- 검정·차콜·웜그레이 앱 셸, Petrona 워드마크, 모바일·데스크톱 반응형

검증:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- 주요 라우트 데스크톱·390×844 모바일 확인
- 가로 overflow와 콘솔 warning/error 확인

상세 기준선은 `docs/archive/MVP_V1_1_BASELINE.md`를 참고합니다.

## 활성 계획 단계 — 2차 MVP

### Track A. 인증·데이터·AI 고도화

담당: 다른 팀원

- 로그인 / 회원가입 / 로그아웃 / 세션
- 이메일 또는 이에 준하는 아이디 + 비밀번호 인증과 Google OAuth
- Supabase Auth / Postgres와 사용자별 데이터 격리
- localStorage 자동 이전·자동 삭제 금지 정책과 repository 구조
- AI 분석·추천 정확도, 근거, 결과 구조 고도화
- JD 원문·직무 요구사항·우대사항 기반 경험 추천과 부족 경험 비교
- 질문 이미지 OCR / vision 입력과 답변 초안 생성
- 인증된 API, rate limit, 비용 한도, 오류 관측성

### Track B. 디자인·사용자 경험 고도화

담당: 사용자

- 현재 검정·차콜 디자인 시스템 고도화
- 로그인·회원가입 UX
- 오늘의 기록, 나의 활동, CampusLog AI 사용성 개선
- loading / empty / error / success / offline 상태
- 모바일·데스크톱 반응형, 키보드 접근성, 대비, reduced motion

## 다음 작업 순서

1. 2026-07-17 QA 수정 범위의 실제 로그인 세션 브라우저 회귀 확인
2. 테스트 계정별 더미 경험·활동·기록 데이터 seed 필요 여부 결정
3. OCR / JD 이미지 입력: 텍스트 붙여넣기 흐름 안정화 후 Optional로 검토
4. 기록 보완 루프의 실제 로그인 세션 smoke test와 평가 기준 정리
5. AI API 보호 foundation 실제 세션 환경 smoke test와 durable rate limit / OpenAI spend alert 운영 결정
6. 추천 v2 / 답변 초안 migration 적용 후 로그인 세션 저장 smoke test
7. 활동 종료 합성 초안 저장과 완료 Experience 생성 흐름을 Supabase DB 기준으로 추가 브라우저 검증
8. Vercel + Supabase preview 환경 통합 확인
9. 통합 회귀·보안·비용·접근성 검증

## 활성 기준 문서

1. `docs/CURRENT_PHASE.md`
2. `PRD.md`
3. `docs/USER_FLOW.md`
4. `docs/IA.md`
5. `docs/SCREEN_SPEC.md`
6. `docs/DESIGN.md`
7. `docs/IMPLEMENTATION_PLAN.md`
8. `docs/AUTH_CONTRACT.md`
9. `docs/AI_API_CONTRACT.md`
10. `docs/DATA_CONTRACT.md`
11. `docs/TODO.md`
12. `docs/ISSUE_LOG.md`
13. `docs/TASK_LOG.md`

`docs/archive/**`는 과거 기준선과 회귀 확인용이며 현재 2차 MVP 구현을 제한하지 않습니다.

## 남은 위험

- 이메일 확인·비밀번호 재설정, 동일 이메일 provider 연결 정책은 현재 AI 개발을 막지 않는 후속 인증 정책 항목
- 비밀번호 validation과 계정 열거 방지 오류 문구 contract는 현재 AI 개발을 막지 않는 후속 인증 정책 항목
- Supabase 기본 email provider signup rate limit 때문에 개발 테스트용 SMTP / confirm email 정책 결정 필요
- localStorage → DB 마이그레이션 UI와 upsert 구현은 Deferred / Optional. 원본 자동 삭제 금지와 로그인 세션의 계정 DB 우선 정책은 유지
- 활동 종료 합성 초안 RLS·보존·완료 Experience 멱등 저장은 Supabase repository로 연결됐지만 완료 저장 흐름의 실제 브라우저 검증은 추가 필요
- DailyLog write 뒤 합성 draft·activity 상태 무효화가 단일 DB transaction이 아니어서 부분 성공을 실패로 오인할 수 있음 (`ISSUE-039`)
- Google 계정 A/B 데이터 분리 수동 smoke test는 완료했지만 SQL-level 또는 자동화된 RLS 정책 검증은 아직 별도로 수행하지 않음
- AI API route-level 보호와 runtime-local rate guard는 추가됐지만 Vercel 다중 인스턴스용 durable rate limit, 중복 요청 멱등성, OpenAI spend limit / alert는 후속 hardening 필요
- AI 경험 분석 v2의 실제 OpenAI 성공 경로와 Supabase migration 적용 후 저장 smoke test 필요
- 추천 v2의 실제 OpenAI 성공 경로와 Supabase migration 적용 후 저장 smoke test 필요
- 답변 초안의 실제 OpenAI 성공 경로와 Supabase migration 적용 후 저장 smoke test 필요
- 기록 보완 루프의 실제 OpenAI 성공 경로, Supabase migration 적용 후 저장 smoke test, 평가 기준과 회귀 사례 필요
- 팀 테스트용 Supabase Auth 계정 9개는 생성됐지만, 각 계정에 넣을 더미 경험·활동·기록 데이터 seed는 아직 없음
- 2026-07-17 QA 수정은 `npm run lint`, `npm run build`를 통과했지만 실제 로그인 세션에서 보완 질문 복원, 활동 삭제 cascade, 완료 활동 복원, 날짜별 기록 제한, 답변 초안 실제 OpenAI 분량 보정, 작은 화면 팝업 스크롤 회귀 확인이 아직 필요
- OCR 이미지 원본 저장 여부와 Supabase Storage 도입 범위 미확정
- 새 활동 추가 패널과 프로필 메뉴의 실제 390px 기기 시각 smoke test 미완료
- 로그아웃 실패 안내·재시도, 세션 scope와 미저장 입력 경고 정책 미확정 (`ISSUE-043`)
- Track 간 공통 파일 충돌과 merge 순서 관리 필요

## Git 상태 주의

v1.1 checkpoint는 main에 병합되었습니다. 2차 MVP 기능은 `main`에 직접 추가하지 않고, 최신 main에서 작은 기능 브랜치로 진행합니다.
