# CampusLog TODO

## 문서 상태

- v1.1 고도화: commit / push / PR #27 main merge 완료
- 활성 계획: 2차 MVP
- 단계 기준: `docs/CURRENT_PHASE.md`

새 작업은 담당 Track과 완료 조건을 명시합니다. 과거 1차 MVP 제외 목록은 현재 2차 MVP를 제한하지 않습니다. 범위·보안·데이터 정책 결정이 필요한 작업은 `docs/ISSUE_LOG.md`에 함께 기록합니다.

## Transition — 먼저 완료

- [x] v1.1 변경 파일 최종 검토
- [x] 사용자의 승인 후 논리적 단위로 commit
- [x] 원격 branch push와 Draft PR #27
- [x] 팀 리뷰와 main merge
- [ ] 승인된 v1.1 기준 commit에 release tag 생성 여부 결정
- [x] 2차 MVP Track별 브랜치를 최신 main에서 생성

## Track A — 인증·데이터·AI 고도화

담당: 다른 팀원

진행 메모:

- 2026-07-13: `feature/auth-foundation`에서 Supabase Auth helper, 이메일/비밀번호 server action, Google OAuth 시작, OAuth callback, 로그아웃, 보호 경로 middleware, 최소 로그인/회원가입 UI, 인증 error/redirect contract 문서를 추가. 사용자가 Supabase project, 로컬/Vercel 환경 변수, Google OAuth provider를 설정했고 Google OAuth callback과 로그아웃 복귀를 확인했습니다. 2026-07-14 UX 결정에 따라 로그아웃 완료 알림은 제거하고 `/` 로그인 영역으로 바로 복귀합니다. 이메일 signup은 Supabase 기본 email provider rate limit에 걸릴 수 있어 confirm email / SMTP 정책 결정이 필요합니다.
- 2026-07-13: `feature/database-schema`에서 최신 main 확인 후 사용자별 Supabase schema / RLS migration, localStorage 모델 매핑, repository 경계, localStorage → DB 이전 정책 문서를 추가. 이어서 주요 화면의 read/write를 Supabase repository로 전환해 로그인 계정별 DB 데이터를 사용하도록 변경. 사용자가 Supabase SQL Editor에서 migration 실행 성공과 Table Editor 테이블 생성을 확인했고, 서로 다른 Google 계정으로 계정별 데이터 분리 수동 smoke test를 완료.
- 2026-07-13: 정식 사용자는 계정별 DB부터 새로 시작하므로 localStorage → 계정 DB 이전 UX / upsert 구현은 High 필수 범위에서 제외하고 Deferred / Optional로 전환. localStorage 원본은 자동 이전하거나 자동 삭제하지 않으며, 로그인 세션에서는 계정 DB 데이터를 기본으로 사용.
- 2026-07-13: 사용자가 일반 이메일 인증 메일 흐름, Google OAuth, 로그인 계정별 DB 분리를 확인. 로그인·DB foundation은 추가 확장보다 안정화 대상으로 두고, 다음 개발 우선순위를 AI API 보호 → AI 분석 품질 개선 → 목적/JD/질문 기반 추천 → 부족 경험 비교와 답변 초안으로 전환.
- 2026-07-14: 회원가입을 방식 선택 → 이메일 자격 증명(이메일만) → 이름 → 닉네임으로 재구성하고, Google 가입 callback 뒤 `/onboarding` 복귀와 비공개 `user_metadata.campuslog_profile` 저장 계약을 추가. metadata는 온보딩 UI에만 사용하고 RLS·권한 판단에는 사용하지 않음.
- 2026-07-14: `feature/ai-api-protection`에서 세 AI API Route에 route-level Supabase 세션 확인, 비로그인 401 JSON error contract, 요청 크기 / 필드 상한, OpenAI timeout, 사용자별 runtime-local rate guard와 `retryAfter` contract를 추가. durable rate limit, 중복 요청 멱등성, OpenAI project spend limit / alert는 후속 hardening으로 분리.
- 2026-07-14: AI 고도화 실행 순서를 `AI 경험 분석 v2 → 추천 v2 → 답변 초안 생성 → 기록 보완 루프 → OCR / JD 이미지 입력`으로 확정. 먼저 STAR, 원본 근거, 부족 정보, 자소서 소재 각도를 분석에 추가하고, 그 결과를 기반으로 문항 / JD 요구사항 추출과 경험 Top 3 매칭을 구현. OCR은 텍스트 붙여넣기 흐름 안정화 후 원본 저장 없는 일회성 입력으로 검토.
- 2026-07-14: `feature/ai-analysis-v2`에서 `/api/analyze` structured output과 prompt를 v2로 확장. `summary`, `competencyTags`, `achievements`, `keywords` 하위 호환을 유지하면서 STAR, 원본 근거, 부족 정보, 자소서 소재 각도, 역량별 근거를 반환·저장·표시. `experience_analyses` 확장 migration을 추가하고 localStorage / Supabase repository 모두 v1 분석 결과를 기본값으로 보정해 읽도록 처리.
- 2026-07-14: `feature/ai-recommendation-v2`에서 `/api/recommend` structured output과 prompt를 추천 v2로 확장. 문항 / JD 요구사항을 `extractedRequirements`로 구조화하고 분석 v2의 STAR, evidence, evidenceGaps, coverLetterAngles, competencyEvidence를 활용해 경험 Top 3, 매칭 근거, 부족 근거, 과장 위험, 활용 각도를 반환·저장·표시. 기존 v1 추천 필드는 유지하고 v1 저장 결과는 기본값으로 보정해 읽도록 처리.
- 2026-07-14: `feature/ai-answer-drafts`에서 `/api/answer-drafts` structured output과 prompt를 추가. 추천 v2의 선택 match, extractedRequirements, 경험 원본, 분석 v2 결과를 활용해 사용자가 고른 500자 / 800자 / 1000자 자기소개서, 면접 답변, 포트폴리오 설명 중 1개 초안을 생성·저장·표시. 초안은 추천에 사용된 원 질문 / 문항 / JD / 면접 질문을 직접 답하도록 생성. 원본에 없는 사실은 본문에 넣지 않고 `missingEvidenceNotes` 또는 `cautions`로 분리. 초안은 별도 `answer_drafts` table과 `campuslog:v1:answer-drafts` localStorage key에 type별로 누적 저장해 기존 추천 v1/v2 기록 하위 호환을 유지.
- 2026-07-14: `feature/ai-evidence-followup`에서 `/api/evidence-followups` 보완 질문 생성, `experience_followups` table / `campuslog:v1:experience-followups` 저장소, 분석 화면의 질문 생성 / 답변 저장 / 수정 / dismiss / 보완 답변 기반 재분석 CTA를 구현. 보완 답변은 원본 경험을 자동 수정하지 않고 answered followup을 `/api/analyze` 재분석 context로만 전달하며, 분석 evidence에는 `followupAnswers` 출처로 구분. 답변 저장 후 기존 분석이 있던 경험은 `needs_reanalysis`로 표시하고 추천 / 답변 초안 화면은 stale 가능성을 안내.
- 2026-07-17: 팀 테스트를 위해 Supabase Auth 관리자 API 기반 `npm run seed:test-users` 스크립트를 추가. 기본 계정은 `test1@campuslog.test` ~ `test9@campuslog.test`, 비밀번호는 `test1111` ~ `test9999`이며 `campuslog_profile` metadata를 함께 설정. 사용자가 실제 Supabase project에 9개 계정이 모두 `created`로 생성된 것을 확인. 더미 경험·활동 데이터 주입은 아직 수행하지 않음.

### High

- [x] Supabase project / 환경 변수 / 개발·배포 환경 정책 확정
- [x] 이메일 또는 이에 준하는 아이디 + 비밀번호 로그인·회원가입·로그아웃·세션 복구 구현
- [x] 팀 테스트용 이메일/비밀번호 계정 9개 생성 스크립트와 실제 Supabase Auth 계정 생성 (`ISSUE-064`)
- [x] Google OAuth provider, callback URL, 로그인 후 redirect 구현
- [x] 보호 라우트와 로그인 후 원래 화면 복귀 구현
- [x] 이메일·Google 회원가입의 이름·닉네임 Stepper와 OAuth 후 온보딩 복귀 구현 (`ISSUE-037`)
- [x] 사용자별 DB schema와 RLS 정책 SQL 작성
- [x] Supabase migration apply와 사용자 A/B 계정별 데이터 분리 smoke test 수행
- [x] Experience / TrackedActivity / DailyLog / SynthesisDraft / Analysis / Recommendation 관계 정의
- [x] 합성 초안 RLS·보존·완료 Experience 멱등 저장 schema contract 작성 (`ISSUE-029`)
- [x] 합성 초안 저장과 완료 Experience 생성의 Supabase repository 멱등 흐름 구현 (`ISSUE-029`)
- [x] repository 경계를 두고 localStorage adapter 추가
- [x] 주요 UI의 `storage.ts` 직접 호출을 repository 경계로 전환
- [x] localStorage → 계정 데이터 마이그레이션 정책 문서화 (`ISSUE-025`)
- [ ] DailyLog write와 AI 합성 상태 무효화를 transaction 또는 멱등 부분 성공 contract로 정리 (`ISSUE-039`)
- [x] AI API 보호 foundation: `/api/analyze`, `/api/recommend`, `/api/synthesize-activity` 서버 세션 확인, 401 JSON 오류, 입력 상한, timeout, runtime-local rate guard 적용 (`ISSUE-024`)
- [ ] AI API 운영 hardening: durable rate limit, 중복 요청 멱등성, OpenAI project spend limit / alert 적용 (`ISSUE-024`)
- [x] AI 경험 분석 v2: STAR, 원본 근거, 부족한 정보, 자소서 소재 각도 schema 정의와 구현 (`ISSUE-034`)
- [x] 추천 v2: 문항 / JD 요구사항 추출, 경험 Top 3 매칭, 부족 근거와 과장 위험 표시 (`ISSUE-031`)
- [ ] Supabase project에 `20260714000500_recommendation_jd_purpose.sql` 적용 후 로그인 세션에서 JD 추천 저장·재조회 smoke test (`ISSUE-060`)
- [x] 답변 초안 생성: 500자 / 800자 / 1000자 자기소개서 + 면접 + 포트폴리오 버전 contract와 UI 구현 (`ISSUE-031`)
- [x] 기록 보완 루프: AI 보완 질문, 사용자 답변 저장 위치, 분석 재생성 흐름 구현 (`ISSUE-044`)

### Medium

- [ ] AI 추천 정확도 평가 기준과 회귀 사례 정의
- [x] AI 추천 이유·활용 방향·근거 일치 강화
- [ ] OCR / JD 이미지 입력의 일회성 처리와 개인정보·비용 정책 정의. 텍스트 붙여넣기 흐름 안정화 전까지 Optional (`ISSUE-031`)
- [x] AI 분석 v2 model / prompt / schema version 저장 결정 및 구현
- [x] 추천 API의 model / prompt / schema version 저장 결정 및 구현
- [ ] 합성 API의 model / prompt version 기록 여부 결정
- [ ] 서버 오류 code와 사용자용 message 계약 정리

### Decision required

- [ ] 이메일 인증 포함 여부
- [ ] 비밀번호 재설정 범위
- [ ] Google OAuth provider 설정값과 배포 callback URL
- [ ] Supabase 비밀번호 validation과 계정 열거 방지 오류 문구 정책
- [ ] Supabase Storage를 사용할 실제 기능. OCR용 이미지는 우선 원본 저장 없이 처리
- [x] 추천 후보 Top 3 비교 UI 세부 표현
- [x] 보완 질문에 대한 사용자 답변을 원본 경험 필드가 아니라 별도 `ExperienceFollowup` 저장소에 저장하기로 결정

### Deferred / Optional

- [ ] localStorage → 계정 데이터 마이그레이션 탐지 / 확인 / upsert 구현 (`ISSUE-025`)
- [ ] 기존 v1.1 데이터 read 호환과 migration 멱등성 구현
- [ ] 사용자 생성 데이터 판별과 샘플·fixture·파싱 실패 항목 제외 contract 구현
- [ ] migration 부분 실패 / 재시도 / 원본 보존 구현

## Track B — 디자인·사용자 경험 고도화

담당: 사용자

### High

- [ ] 검정·차콜 디자인 token과 공통 컴포넌트 상태 정리
- [x] Track A 인증 contract 기반 로그인 / 회원가입 route UI와 `components/auth/**` 설계
- [x] 좌측 상단 `CampusLog` 워드마크 + 문법에 맞는 순환 기록 문구 → 중앙 인증 카드 → 인증 후 3D 책 표지 진입 흐름 구현 (`ISSUE-035`)
- [x] Tailwind CSS v4·shadcn/ui 기반 설정과 인증 Input·Label primitive 구성
- [x] 랜딩 재생 컨트롤 제거, 명사·조사 간격 보정과 인증 입력 평면화 (`ISSUE-057`)
- [x] React Bits Stepper 기반 이름·닉네임 회원가입 UX와 모바일·reduced motion 적용 (`ISSUE-037`)
- [ ] 인증 확인 중 / 세션 만료 / 접근 불가 상태 설계
- [x] 오늘의 기록 핵심 작성 흐름을 CTA → 플로팅 패널로 고도화하고 입력 보존·모바일·키보드 동작 검증 (`ISSUE-038`)
- [x] 빠른 기록 작성 패널을 visual viewport·safe area 기준 화면 정중앙에 배치 (`ISSUE-058`)
- [x] 경험 분석·추천 AI 실행 CTA에 colorful Border Beam 적용 (`ISSUE-059`)
- [x] 추천 활용 목적에 `JD`를 추가하고 실행 CTA를 `AI 분석`으로 정리 (`ISSUE-060`)
- [x] 활동 추가를 접근 가능한 Expandable Screen으로 전환하고 공용 Checkbox·CopyButton·프로필 드롭다운 통합 (`ISSUE-041`)
- [x] 실제 checkbox 입력에 Animate UI식 check path·상태 변형·reduced motion 적용 (`ISSUE-061`)
- [x] 추천 기록의 중복 eyebrow 제거와 참고 문장 복사 버튼 아이콘화 (`ISSUE-062`)
- [x] 핵심 실행 CTA에 접근 가능한 ripple 눌림 피드백 적용 (`ISSUE-063`)
- [x] 프로필 드롭다운 로그아웃 제출 안정화와 실제 세션 제거·보호 경로 재차단 확인 (`ISSUE-042`)
- [ ] 나의 활동 목록·상세 탐색 흐름 개선
- [ ] CampusLog AI 입력·결과·추천 기록 위계 개선
  - [x] 추천 화면 반복 탭 제거와 `추천 기록` / `새 추천 받기` 교차 이동 액션 정리 (`ISSUE-040`)

### Medium

- [ ] Button / Input / Textarea / Badge / Tabs / Dialog / Alert 상태 통일
- [ ] Next.js / PostCSS moderate advisory를 호환 가능한 버전으로 해소 (`ISSUE-036`)
- [ ] 활동 추가 Expandable Screen과 프로필 메뉴의 실제 390px 기기 시각 smoke test
- [ ] 로그아웃 실패 안내·재시도와 현재 기기/전체 기기 scope 정책 확정 (`ISSUE-043`)
- [ ] 모바일 상단 내비게이션과 safe area 재검증
- [ ] loading / empty / error / success / reconnecting 상태 통일
- [ ] 키보드 focus 이동과 Dialog 초점 복귀 검증
- [ ] 200% 확대와 긴 한글·URL 줄바꿈 검증
- [ ] reduced motion과 애니메이션 fallback 검증
- [ ] 랜딩·Checkbox·Ripple·Border Beam의 실제 모바일 기기와 reduced motion 시각 검증 (`ISSUE-057`, `ISSUE-061`, `ISSUE-063`)
- [ ] AI 원본·생성 결과·근거의 시각적 구분 개선

## Shared integration

- [ ] 인증 상태 contract를 UI와 공유
- [ ] repository / API loading·error contract를 UI와 공유
- [x] AI 제한 초과 오류 code, `retryAfter`, 입력 상한과 재시도 contract 공유 (`docs/AI_API_CONTRACT.md`)
- [x] AI 분석 v2 schema와 API response 변경에 맞춰 관련 계약 문서와 결과 화면 수정
- [x] 추천 v2 schema와 API response 변경에 맞춰 관련 계약 문서와 결과 / 기록 화면 수정
- [x] 기록 보완 루프 schema와 API response 변경에 맞춰 관련 계약 문서와 분석 결과 화면 수정
- [x] QA 안정화: 기록 보완 질문 답변 draft 보존, 질문-답변 입력 묶음 재배치, 숨긴 질문 복원 버튼 추가 (`ISSUE-045`, `ISSUE-046`, `ISSUE-047`)
- [x] QA 안정화: 답변 초안 자기소개서 분량을 선택 범위 안으로 보정하고 실제 글자 수 표시 기준 정리 (`ISSUE-048`)
- [x] QA 안정화: 완료 활동 복원, 활동 상태별 삭제, 과거 종료 활동 상태·기록 가능 날짜·타임라인 날짜 표시·종료일 보존 흐름 수정 (`ISSUE-049`~`ISSUE-054`)
- [x] QA 안정화: 추천 점수별 평가 등급 계산을 서버 score 기준으로 일관화 (`ISSUE-055`)
- [x] QA 안정화: 오늘 한 일 남기기 플로팅 패널 내부 스크롤과 하단 저장 버튼 접근성 수정 (`ISSUE-056`)
- [ ] Track 간 공통 파일 담당과 merge 순서 합의
- [ ] 데스크톱·모바일 핵심 E2E 시나리오 작성
- [x] 다른 사용자 데이터 접근 방지 UI smoke test
- [ ] Vercel + Supabase preview 환경 통합 확인
- [ ] 테스트 계정별 더미 경험·활동·기록 데이터 seed 필요 여부 결정

## Existing open risks

- [ ] malformed localStorage JSON과 빈 상태 구분 (`ISSUE-013`)
- [ ] WebGL 표지 실패 fallback (`ISSUE-017`)
- [ ] 관련 링크 실제 저장·새로고침 유지 수동 검증 (`ISSUE-021`)
- [ ] AI API durable 비용과 호출 빈도 제한 (`ISSUE-024`)

## v1.1 Done summary

- [x] 과거 활동 경험 CRUD
- [x] 활동 추가와 planned / active / completed 흐름
- [x] 날짜별 실제 한 일 작성·수정·삭제
- [x] 월간 캘린더와 기록 개수
- [x] 날짜별 기록을 제목 우선 이벤트 목록과 `+` 작성 액션으로 재구성하고 진행 활동 없음 안내 팝업 적용 (`ISSUE-065`)
- [ ] 나의 활동 제목 한 줄 고정·좁은 패널 검색 축약의 UI preview 폭별 검증 완료 후 실제 로그인 완료 경험의 목록·상세·분석 전환 확인 (`ISSUE-066`)
- [ ] 나의 활동 AI 분석 스플릿뷰 구현 후 실제 로그인 분석 데이터로 열기·닫기·재분석·보완 질문 회귀 확인 (`ISSUE-067`)
- [x] 활동 종료 → AI 사실 기반 초안 → 완료 경험 저장
- [x] 나의 활동에서 완료 경험과 진행 활동 통합
- [x] AI 경험 분석
- [x] CampusLog AI 기반 활동 추천과 추천 기록
- [x] 검정·차콜 공통 앱 셸과 반응형 UI
- [x] lint / typecheck / production build / 브라우저 검증
