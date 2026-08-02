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

- 2026-08-02: AI 기반 활동 추천의 목적별 예시를 대학생의 다양한 전공과 지원 상황에 맞춰 면접·자기소개서·JD 분석·기타 각각 대표 6개로 정리. 면접과 자기소개서는 역할·성과·문제 해결·협업·주도성·성장 중심의 범용 문항으로 구성하고, JD 분석에는 전 직무 공통 분석 질문 4개와 플랫폼·결제 서버 및 커머스 백엔드 실제형 샘플 2개를 포함. 기타는 포트폴리오, 이력서, 1분 자기소개, 대외활동·인턴, 발표, 전공과 직무 연결을 다룸. 사용자가 목적별 예시 선택, 전체 입력 반영, 긴 JD 샘플 적용을 직접 로직 테스트로 확인 (`ISSUE-079`).
- 2026-08-02: `fix/concurrent-account-session`에서 동일 테스트 계정의 여러 기기·탭 사용을 고려해 로그아웃을 현재 세션만 종료하도록 변경하고, 브라우저 Supabase client singleton을 명시했으며, 세션 만료 감지·최신 경험 재조회·경험별 분석 결과 atomic upsert·동시 수정 감지를 구현. 상세 역할 220자가 AI API의 200자 제한에 걸려 `/api/analyze` 400이 발생한 문제는 분석·추천·답변 초안·보완 질문의 역할 상한을 입력 화면과 같은 1,000자로 통일해 해결. 동시성 저장 조건의 `related_links` JSON 직렬화 오류도 수정했고, 로그인 `test4` 계정의 한빛미디어 경험으로 `/api/analyze` 200, SSE 완료, Supabase 저장, 분석 결과 표시를 확인. 전체 테스트 135개·lint·typecheck·production build·diff check를 통과했으며 사용자가 동일 계정 동시 작업을 포함한 직접 로직 테스트를 완료 (`ISSUE-134`, `ISSUE-135`).
- 2026-07-24: `feature/ai-image-input`에서 AI 추천 입력에 JPG·PNG·WebP 캡쳐 이미지를 최대 3장 추가. 파일 선택과 추천 폼 안 `Cmd/Ctrl+V` 붙여넣기를 지원하고 일반 텍스트 붙여넣기는 유지. 텍스트·이미지 단독 또는 혼합 입력을 브라우저에서 장당 약 750KB 이하로 준비해 기존 `gpt-4.1-mini` vision structured output 한 번으로 처리하며, 별도 OCR 확인 화면 없이 현재 SSE 대기 UX와 추천 저장 흐름을 유지. 원본 이미지는 저장하지 않으며 추출 문장과 입력 출처만 추천 기록에 저장. 자동·반응형 UI 검증은 완료했고 Supabase migration 적용과 실제 로그인 OpenAI 저장·재조회 smoke test는 남음.
- 2026-07-24: `feature/experience-attachments`에서 완료 경험에 사진(JPG·PNG·WebP)과 PDF 자료를 합계 3개, 파일당 5MB까지 추가하는 private Supabase Storage / metadata RLS migration과 별도 repository를 구현. 새 경험·수정 폼의 첨부 선택, 나의 활동 인라인·독립 상세 조회, 독립 상세 개별 삭제를 연결하고 첨부를 AI 입력에서 분리. 코드 검증은 완료했으며 실제 Supabase project migration 적용과 로그인 업로드 smoke test는 남음.
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
- 2026-07-14: `feature/ai-evidence-followup`에서 `/api/evidence-followups` 보완 질문 생성, `experience_followups` table / `campuslog:v1:experience-followups` 저장소, 분석 화면의 질문 생성 / 답변 저장 / 수정 / dismiss / 보완 답변 기반 재분석 CTA를 구현. 이 흐름은 2026-07-23 `ISSUE-078`에서 분석 부족 정보 카드 안 직접 답변 저장 방식으로 간소화.
- 2026-07-23: AI 경험 분석 화면을 요약, STAR, 주요 성과, 부족 정보 답변, 키워드 중심으로 축소. 핵심 역량 태그, 역량별 근거, 원본 근거, 자소서 소재 각도와 별도 보완 질문 생성 UI는 제거. 분석 부족 정보 카드 안에서 바로 답변을 저장하고, 답변은 분석 `evidenceGaps.answer`와 기존 `experience_followups` 호환 저장소에 함께 반영하며 보완 답변만으로는 `needs_reanalysis`를 강제하지 않음. 추천 / 답변 초안 입력에는 원본 경험, 분석 요약, STAR, 주요 성과, 부족 정보 보완 답변, 키워드를 함께 전달.
- 2026-07-23: AI 추천 활용 목적을 면접 / 자기소개서 / JD 분석 / 기타 4개 신규 생성값으로 정리하고 목적별 입력 안내·예시·생성 옵션을 단일 설정 객체로 관리. 기존 `portfolio`, `activity_application` 저장 기록은 `other`로 읽어 하위 호환. 추천 API는 원본 경험과 보완 답변만 사실 근거로 사용하고 기존 AI 분석은 참고 자료로만 사용하도록 prompt를 조정했으며, 직접 근거가 부족하면 억지로 Top 3를 채우지 않음. 답변 생성 API는 목적별 허용 타입만 받도록 제한. 사용자가 Supabase SQL Editor에서 `jd` purpose 허용, `recommendations.jd_analysis`, 새 answer draft type constraint migration을 적용함. 실제 OpenAI 성공 경로와 목적별 생성 결과 수동 smoke test는 남음.
- 2026-07-23: AI 추천 화면의 목적별 예시 문항을 실제 채용·지원 상황에서 입력할 법한 문장으로 교체. JD 분석 첫 예시는 버튼 문구와 실제 입력값을 분리해, 선택 시 백엔드 개발자 JD 샘플 전문이 입력되도록 조정. 긴 예시 문항의 모바일 줄바꿈도 보정. `npm run lint`, `npx tsc --noEmit`, `npm run build` 통과했고 사용자가 예시 선택 입력 반영 등 직접 로직 테스트를 완료.
- 2026-07-23: AI 구조화 호출 1차 대기 UX를 개선. 공통 `AIProcessingPanel`을 추가하고 경험 분석 / 재분석, AI 추천 / JD 분석, 활동 완료 경험 합성, 추천 기반 답변 초안 생성 대기 상태에 단계형 안내 문구, skeleton, 장기 대기 안내, 처리 대상 메타 정보를 표시하도록 연결. API 응답 계약과 모델 호출 방식은 변경하지 않음. 추천 / 분석 / 활동 합성 / 답변 초안의 중복 실행 방지를 보강하고, 답변 초안 대기 상태에는 목표 분량에 맞춰 초안을 다듬을 수 있다는 안내를 추가. `npm run lint`, `npm run build`, `git diff --check` 통과, Codex가 `/recommend`와 `/experiences` 기본 렌더링을 확인했고 사용자가 직접 로직 테스트를 완료.
- 2026-07-23: 답변 초안 생성 2차 스트리밍 UX를 구현. `/api/answer-drafts`의 기존 strict JSON 응답은 유지하고, `stream: true` 요청에서만 서버가 OpenAI structured output 스트림을 내부 누적한 뒤 `draft.content` 문자열만 NDJSON `delta` 이벤트로 전달. 최종 `completed` 이벤트의 정규화된 `AnswerDraftResult`만 기존 저장소에 저장하며, 분량 교정이 발생하면 `replace` 이벤트로 최종 본문을 교체. 화면은 첫 토큰 전 1차 `AIProcessingPanel`을 유지하고, 첫 본문 조각 이후 점진 렌더링 / 커서 / 글자 수 / 부분 실패 재시도를 표시. `git diff --check`, `npm run lint`, `npm run build`, UI preview 기본 렌더링 확인을 완료했고 사용자가 직접 로직 테스트를 완료. 구조화 이벤트 스트리밍은 후속 단계로 유지.
- 2026-07-23: AI 요청 측정 / 취소 3차를 구현. `/api/analyze`, `/api/recommend`, `/api/synthesize-activity`, `/api/evidence-followups`, `/api/answer-drafts`에서 기능 종류, 응답 유형, 입력 글자 수, 경험 수, 목표 글자 수, 모델, 스트리밍 TTFT, 전체 완료 시간, 성공 / 실패 / 취소, 재시도 여부만 서버 `console.info` 메타데이터로 기록. 클라이언트 AI helper에 AbortSignal을 전달하고, 경험 분석 / 추천 / 활동 완료 경험 합성 / 답변 초안 스트리밍 화면에 취소 버튼을 연결. 취소 시 기존 입력과 기존 결과를 유지하고, 답변 초안은 부분 텍스트를 저장하지 않은 채 화면에 남겨 같은 조건 재시도를 제공. 실제 장시간 OpenAI 호출의 외부 비용 중단 여부와 배포 로그 수집 방식은 후속 검증으로 남음.
- 2026-07-23: 구조화 호출 4차 이벤트 스트리밍을 구현. `/api/analyze`, `/api/recommend`, `/api/synthesize-activity`는 기존 JSON 응답을 유지하고 `stream: true` 요청에서만 서버가 `status` SSE 이벤트를 보낸 뒤 최종 정규화 JSON만 `completed` 또는 `error` 이벤트로 전달. raw JSON 토큰이나 부분 구조화 결과는 화면에 노출하지 않고, 경험 분석 / 추천 / 활동 완료 경험 합성 화면의 기존 `AIProcessingPanel` 문구만 서버 상태 이벤트로 갱신. 저장 구조와 모델 호출 횟수는 변경하지 않음. `npm run lint`, `npm run build` 통과. 실제 로그인 세션에서 장시간 OpenAI 호출 중 상태 이벤트 수신과 배포 환경 SSE 버퍼링 여부는 후속 확인 필요.
- 2026-07-23: AI 추천 입력 선별·압축을 구현. 추천 요청 직전에 활용 목적과 입력 문항 / JD 기준으로 후보 경험을 점수화하고, 72KB 요청 예산 안에서 상위 후보의 설명·성과·분석 요약·STAR·키워드·부족 정보 답변만 압축해 `/api/recommend`로 전송. 원본 경험과 저장된 분석은 repository에 그대로 보존하며 추천 결과 저장과 답변 초안 생성은 선택된 경험 id로 원본 데이터를 다시 사용. 100개 더미 경험 / 분석 기준 18개 후보, 약 52KB 요청으로 압축되는 것을 확인.
- 2026-07-17: 팀 테스트를 위해 Supabase Auth 관리자 API 기반 `npm run seed:test-users` 스크립트를 추가. 기본 계정은 `test1@campuslog.test` ~ `test9@campuslog.test`, 비밀번호는 `test1111` ~ `test9999`이며 `campuslog_profile` metadata를 함께 설정. 사용자가 실제 Supabase project에 9개 계정이 모두 `created`로 생성된 것을 확인. 더미 경험·활동 데이터 주입은 아직 수행하지 않음.
- 2026-07-17: 진행 중 / 시작 예정 활동을 상세 화면에서 수정할 수 있게 하고, 오늘의 기록의 마무리 필요 활동도 정리 전 수정할 수 있게 함. 활동 종료 시 현재 날짜를 완료일로 저장해 예상 종료일이 미래여도 즉시 AI 초안을 생성하도록 수정. 실제 로그인 브라우저 세션 회귀 확인은 남음.

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
- [x] 진행 활동과 마무리 필요 활동의 날짜 수정, 미래 예정 종료 활동의 즉시 완료일 갱신과 AI 초안 생성을 수행 (`ISSUE-070`)
- [x] repository 경계를 두고 localStorage adapter 추가
- [x] 주요 UI의 `storage.ts` 직접 호출을 repository 경계로 전환
- [x] localStorage → 계정 데이터 마이그레이션 정책 문서화 (`ISSUE-025`)
- [ ] DailyLog write와 AI 합성 상태 무효화를 transaction 또는 멱등 부분 성공 contract로 정리 (`ISSUE-039`)
- [x] AI API 보호 foundation: `/api/analyze`, `/api/recommend`, `/api/synthesize-activity` 서버 세션 확인, 401 JSON 오류, 입력 상한, timeout, runtime-local rate guard 적용 (`ISSUE-024`)
- [x] 공유 테스트 계정 안정화 foundation: 현재 세션만 로그아웃, 세션 만료 감지, 분석 전 최신 경험 재조회, 분석 결과 atomic upsert, 경험 동시 수정 감지 구현 (`ISSUE-134`)
- [x] 동일 테스트 계정 동시 작업과 세션 독립 유지 직접 로직 테스트 (`ISSUE-134`)
- [ ] AI API 운영 hardening: durable rate limit, 중복 요청 멱등성, OpenAI project spend limit / alert 적용 (`ISSUE-024`)
- [x] AI 추천 입력 선별·압축으로 경험 수 증가 시 `/api/recommend` 본문 상한 초과를 방지 (`ISSUE-084`)
- [ ] 완료 경험 사진·PDF 첨부 코드 구현 완료, Supabase migration 적용과 로그인 업로드·조회·삭제 smoke test 수행 (`ISSUE-095`)
- [x] AI 경험 분석 v2.1: STAR, 주요 성과, 부족 정보 답변, 키워드 중심으로 화면·신규 분석 출력 간소화 (`ISSUE-078`)
- [x] 200자를 넘는 상세 역할 기록의 AI 입력 상한을 1,000자로 통일하고 실제 로그인 경험 분석·Supabase 저장 smoke test 완료 (`ISSUE-135`)
- [x] 추천 v2: 문항 / JD 요구사항 추출, 경험 Top 3 매칭, 부족 근거와 과장 위험 표시 (`ISSUE-031`)
- [x] Supabase project에 추천 목적 `jd`, `recommendations.jd_analysis`, 새 answer draft type constraint migration 적용 (`ISSUE-060`, `ISSUE-079`)
- [ ] 로그인 세션에서 JD 추천 저장·재조회 smoke test (`ISSUE-060`, `ISSUE-079`)
- [x] 목적별 답변 생성: 자기소개서 300자 / 500자 / 1000자, 면접 30초 / 1분 이상 / 예상 꼬리 질문, JD 지원 전략, 기타 맞춤 결과 contract와 UI 구현 (`ISSUE-031`, `ISSUE-079`)
- [x] 기록 보완 루프 UX 개편: 부족 정보 카드 안에서 바로 답변 저장, 질문 생성 단계 제거, 추천 즉시 반영 (`ISSUE-078`)

### Medium

- [ ] AI 추천 정확도 평가 기준과 회귀 사례 정의
- [x] AI 추천 이유·활용 방향·근거 일치 강화
- [ ] 목적별 AI 추천·생성 실제 OpenAI 응답 품질 확인과 prompt 튜닝 (`ISSUE-079`)
- [x] 질문 / JD 캡쳐 이미지 최대 3장을 파일 선택·클립보드 붙여넣기로 받아 원본 저장 없이 기존 단일 vision 추천 요청으로 처리하고 결과 출처 표시 (`ISSUE-096`)
- [ ] Supabase migration 적용 후 실제 로그인 세션에서 이미지 기반 OpenAI 추천·저장·재조회 smoke test (`ISSUE-096`)
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
  - [x] 인증 제품 화면의 쿨뉴트럴 Liquid Glass foundation, 공용 `GlassSurface`, inset 사이드바·모바일 앱 바, 공용 popover·overlay 재료와 접근성 fallback 적용 (`ISSUE-103`)
  - [x] 대시보드 외 활동·추천·추천 기록·분석 화면의 페이지별 웜화이트 배경을 제거하고 공통 쿨 canvas와 near-solid 작업 공간의 계층 연결 (`ISSUE-103`)
  - [x] 나의 활동·추천 기록 검색의 아이콘·텍스트 대비와 공통 clear Glass capsule을 복구하고 360·390·1487px 핵심 경로를 재검증 (`ISSUE-103`)
  - [x] 데스크톱 Liquid Glass 사이드바를 224px·compact desktop을 200px로 확장하고 CampusLog 워드마크를 표면 중심에 고정 (`ISSUE-104`)
  - [x] 인증 상위·하위 화면의 Breadcrumb과 H1을 같은 1200px/3.2vw 내비게이션 레일로 통일 (`ISSUE-116`)
  - [x] 인증 제품 라우트의 루트 스크롤바 예약 폭을 통일해 메뉴 전환 시 Breadcrumb·H1의 서브픽셀 흔들림 제거 (`ISSUE-117`)
  - [x] 오늘의 기록 이동 시 이중 활성 capsule·상시 scrollbar·smooth scroll 전환을 제거해 화면 전환 안정화 (`ISSUE-118`)
  - [x] 오늘의 기록 `활동 추가`를 포인터 환경에서 44px 아이콘→118px 라벨로 확장하고 터치 환경은 전체 라벨을 유지 (`ISSUE-119`)
  - [x] 나의 활동의 완료 경험·진행 활동과 추천 기록에 unlumen UI Pinned List 참고 즐겨찾기 구획·테두리 없는 44px 노란 별·사용자별 브라우저 저장을 적용 (`ISSUE-120`, `ISSUE-121`, `ISSUE-122`)
  - [x] 첫 화면·인증·오늘의 기록·나의 활동·추천·추천 기록과 관련 상세/작성 화면의 웜화이트·크림 hover를 공통 쿨 뉴트럴 Liquid Glass 토큰으로 통일 (`ISSUE-123`)
  - [x] 나의 활동·추천 기록 즐겨찾기 행의 selected·hover 배경을 제목과 별 영역 전체로 확장 (`ISSUE-124`)
  - [x] 나의 활동·추천 기록 목록 하단의 뿌연 gradient fade를 제거하고 실제 패널 여백으로 마감 (`ISSUE-125`)
  - [x] 한 일 남기기·활동 추가·활동 상세/합성·경험 폼·AI 분석·추천 입력/기록의 중첩 투톤과 구형 아이콘 plate를 단일 콘텐츠층·쿨 뉴트럴 control로 정리 (`ISSUE-126`)
  - [x] 공개 첫 화면 스크롤 안내의 capsule 장식을 제거하고 로그인·회원가입을 단일 frosted Liquid Glass 카드와 near-solid 입력으로 정리 (`ISSUE-127`)
  - [x] AI 분석 부족 정보 행을 분류 중심 닫힘·질문 중심 열림 편집 구조로 단순화하고 스플릿 헤더 sticky 제거 (`ISSUE-128`)
  - [x] 독립 완료 경험 상세의 무경계 전체 폭 예외를 제거하고 중앙 단일 frosted Glass 읽기 표면·쿨 뉴트럴 control·모바일 무가로잘림으로 정리 (`ISSUE-129`)
  - [x] 추천 기록 선택 행 본문에 남은 내부 그림자를 제거해 본문과 즐겨찾기 별 영역을 하나의 연속 표면으로 통일 (`ISSUE-130`)
  - [x] 인증 주요·표준 작성 화면의 첫 작업 표면을 공통 workspace anchor로 정렬하고 모바일 추천 액션·추천 기록 gutter가 제목 높이와 좌표를 바꾸지 않게 정리 (`ISSUE-131`)
  - [x] AI 추천 입력 패널의 92% near-solid 예외를 제거하고 주요 작업 패널 표면색을 달력과 같은 반투명 흰색 64% Glass로 통일 (`ISSUE-132`)
  - [x] 나의 활동 초기 로딩에서 실제 `전체 활동`·검색 헤더를 먼저 노출하지 않고 공통 Liquid skeleton 헤더·목록 행으로 전환 (`ISSUE-136`)
  - [x] 나의 활동 AI 분석 스플릿뷰와 독립 분석 화면을 추천 기록 상세의 frosted 외곽 Glass·kicker/생성일/대표 제목 위계로 통일하고 정상 상태의 반복 notice 제거 (`ISSUE-137`)
  - [x] 현재 추천 결과와 추천 기록 상세가 질문·문항 대표 제목, 활동 기간·역할 및 하단 질문 중복 제거의 공통 결과 위계를 사용하도록 통일 (`ISSUE-138`)
  - [x] 나의 활동 페이지 H1을 목록 Glass 밖으로 분리하고 목록은 `전체 활동` H2로 시작하며 우측 상세·분석 내부 스크롤바를 스크롤 중에만 표시 (`ISSUE-105`)
  - [x] 나의 활동 선택 행의 흰 카드·그림자를 제거하고 차콜 틴트·2px 인디케이터 적용 (`ISSUE-106`)
  - [x] 나의 활동 우측 완료 경험 상세를 단일 near-white 표면과 투명 내부 구획으로 통일하고 분석 패널 계층은 유지 (`ISSUE-107`)
  - [x] 나의 활동 페이지·목록·상세·분석 scrollbar를 유휴·모든 hover에서 숨기고 실제 스크롤 중에만 나타나는 4px 캡슐로 통일 (`ISSUE-108`)
  - [x] 나의 활동 좌측 목록과 우측 완료 경험 상세의 외곽 재료를 동일하게 통일 (`ISSUE-109`)
  - [x] 나의 활동 좌우 패널을 다른 주요 작업 탭과 같은 54% frosted Glass·28px blur로 통일 (`ISSUE-112`)
- [x] Track A 인증 contract 기반 로그인 / 회원가입 route UI와 `components/auth/**` 설계
- [x] 좌측 상단 `CampusLog` 워드마크 + 문법에 맞는 순환 기록 문구 → 중앙 인증 카드 → 인증 후 3D 책 표지 진입 흐름 구현 (`ISSUE-035`)
- [x] Tailwind CSS v4·shadcn/ui 기반 설정과 인증 Input·Label primitive 구성
- [x] 랜딩 재생 컨트롤 제거, 명사·조사 간격 보정과 인증 입력 평면화 (`ISSUE-057`)
- [x] React Bits Stepper 기반 이름·닉네임 회원가입 UX와 모바일·reduced motion 적용 (`ISSUE-037`)
- [ ] 인증 확인 중 / 세션 만료 / 접근 불가 상태 설계
- [x] 오늘의 기록 핵심 작성 흐름을 CTA → 플로팅 패널로 고도화하고 입력 보존·모바일·키보드 동작 검증 (`ISSUE-038`)
- [x] 오늘의 기록의 현재 진행 활동을 제목 중심 Item 목록과 trailing 삭제 메뉴로 재구성 (`ISSUE-097`)
- [ ] 오늘의 기록 진행 활동을 `오늘 기록` 중심의 단일 열 작업 큐로 재설계: 최근 기록 상태, 활동별 기록 패널 즉시 열기, `경험 정리 필요` 영역 분리. 서비스 흐름 검토와 UX 제안은 완료했으며 사용자 승인 뒤 구현·반응형·접근성 검증 진행 (`ISSUE-133`)
- [x] 빠른 기록 작성 패널을 visual viewport·safe area 기준 화면 정중앙에 배치 (`ISSUE-058`)
- [x] 경험 분석·추천 AI 실행 CTA에 colorful Border Beam 적용 (`ISSUE-059`)
- [x] 추천 활용 목적에 `JD`를 추가하고 실행 CTA를 `AI 분석`으로 정리 (`ISSUE-060`)
- [x] 추천 활용 목적을 날짜별 기록과 같은 검색 없는 선택 목록으로 통일 (`ISSUE-075`)
- [x] AI 추천 목적별 예시 문항을 실제 채용·지원 상황에 가까운 문장으로 교체하고 JD 샘플 입력을 지원 (`ISSUE-079`)
- [x] 활동 추가를 접근 가능한 Expandable Screen으로 전환하고 공용 Checkbox·CopyButton·프로필 드롭다운 통합 (`ISSUE-041`)
- [x] 활동 추가의 시작일·예상 종료일 입력 상단선과 `미정` 체크 옵션 크기·위치 정리 (`ISSUE-074`)
- [x] 활동 추가 닫힘 마지막 프레임의 사각 표면 잔상 제거 (`ISSUE-077`)
- [x] 실제 checkbox 입력에 Animate UI식 check path·상태 변형·reduced motion 적용 (`ISSUE-061`)
- [x] 추천 기록의 중복 eyebrow 제거와 참고 문장 복사 버튼 아이콘화 (`ISSUE-062`)
- [x] 핵심 실행 CTA에 접근 가능한 ripple 눌림 피드백 적용 (`ISSUE-063`)
- [x] 프로필 드롭다운 로그아웃 제출 안정화와 실제 세션 제거·보호 경로 재차단 확인 (`ISSUE-042`)
- [ ] 나의 활동 목록·상세 탐색 흐름 개선
  - [x] 완료 경험을 `즐겨찾기` / `모든 활동`으로 중복 없이 이동하고 진행 활동은 기존 상태 탐색을 유지 (`ISSUE-120`)
  - [x] 페이지 헤더·목록 섹션 위계 분리와 상세·분석 transient scrollbar 반응형 검증 (`ISSUE-105`)
  - [x] 선택 행을 목록 재료 안의 차콜 상태로 정리하고 상세·분석 scrollbar를 18% 유휴·52% 활성·900ms 복귀로 조정 (`ISSUE-106`)
  - [x] 우측 상세의 중첩된 64%·92%·44% 흰 표면을 단일 92% near-white 표면으로 통일하고 내부 구획은 투명 처리 (`ISSUE-107`)
  - [x] 페이지·목록·상세·분석 scrollbar를 유휴·hover transparent·스크롤 44%·900ms 뒤 숨김으로 조정 (`ISSUE-108`)
  - [x] 나의 활동 검색에서 clear Glass override를 제거하고 기존 차콜 Gooey 원형→검색 필드 morph 복원 (`ISSUE-114`)
- [ ] CampusLog AI 입력·결과·추천 기록 위계 개선
  - [x] 추천 기록을 `즐겨찾기` / `모든 기록`으로 이동하고 본문 선택과 Pin 조작·접근성 이름을 분리 (`ISSUE-120`)
  - [x] 추천 화면 반복 탭 제거와 `추천 기록` / `새 추천 받기` 교차 이동 액션 정리 (`ISSUE-040`)
  - [x] 확장 화면 추천 입력·결과 패널을 공통 페이지 콘텐츠 폭에 정렬 (`ISSUE-073`)
  - [x] 이미지 첨부를 ReUI Gallery 참고 적응형 empty→Gallery 구조, 전체 삭제·확대 dialog·추가 타일로 정리하고 기존 CampusLog 토큰·입력 계약 유지 (`ISSUE-098`)
  - [x] 이미지 제한을 최대 3장·장당 5MB 한 줄로 간소화하고 별도 도움말 반복 제거 (`ISSUE-099`)
  - [x] 빈 이미지 첨부의 이중 경계를 바깥 점선 하나로 정리하고 Gallery `전체 삭제`를 clear Glass capsule로 통일 (`ISSUE-115`)
  - [x] 추천 `AI 분석`을 활동 상세 `다시 분석하기`와 같은 공통 흰 프레임·gradient 실행 CTA로 복원 (`ISSUE-115`)
  - [x] 사용자 행동 중심 빈 상태·16px 무그림자 큰 표면을 `/recommend`에만 적용하고 `추천 기록`은 사용자 요청에 따라 기존 아이콘·배치 유지 (`ISSUE-100`)
  - [x] 이미지 업로드 위 중복 `이미지 첨부` 제목을 화면에서 숨기고 접근성 legend 유지 (`ISSUE-101`)
  - [x] 추천 기록의 H1·설명을 목록 Glass 밖으로 분리하고 목록은 H2 `전체 기록`·개수·검색으로 시작 (`ISSUE-110`)
  - [x] 추천 기록 H1을 다른 주요 화면과 같은 1200px 프레임·gutter·공통 글자 크기로 정렬 (`ISSUE-111`)
  - [x] 추천 기록 상세의 이중 Glass를 제거하고 54% frosted 외곽·투명 구획·92% 정보 plate·1열 근거 구조로 가독성 정리 (`ISSUE-113`)

### Medium

- [ ] Button / Input / Textarea / Badge / Tabs / Dialog / Alert 상태 통일
- [ ] Next.js 15.5.20과 전이 PostCSS·sharp의 production high advisory를 호환 가능한 framework 업데이트로 해소 (`ISSUE-036`)
- [ ] 활동 추가 Expandable Screen과 프로필 메뉴의 실제 390px 기기 시각 smoke test
  - [x] Chrome 390×844 CSS viewport에서 Expandable Screen·프로필 메뉴·Select·FloatingPanel의 열림, `Escape`, 초점 복귀와 가로 overflow 0 확인 (`ISSUE-103`)
- [ ] 로그아웃 실패 안내·재시도와 현재 기기/전체 기기 scope 정책 확정 (`ISSUE-043`)
- [ ] 모바일 상단 내비게이션과 safe area 재검증
  - [x] 360×800·390×844·860×800 CSS viewport에서 단일 Glass 앱 바와 44px 계정 진입점, 가로 overflow 0 확인 (`ISSUE-103`)
- [ ] loading / empty / error / success / reconnecting 상태 통일
  - [x] AI 구조화 호출의 1차 대기 UX에 단계형 문구, skeleton, 장기 대기 안내, 처리 대상 메타 정보 적용
  - [x] 모든 AI 처리 대기를 Strands·AI Text Loading 중심의 전체 화면 blur overlay로 통일하고 2.4초 문구 전환·`...` 끝맺음·프레임 없는 취소 액션·조용한 추천 취소·상태 이벤트·reduced motion 유지 (`ISSUE-093`)
  - [x] 추천 기반 답변 초안 생성에 스트리밍 미리보기와 완료 후 최종 저장 적용
  - [x] AI 요청 취소 버튼과 메타데이터 측정 로그 적용
  - [x] 구조화 JSON 호출에 서버 status 이벤트와 최종 JSON completed / error 이벤트 계약 적용 (`ISSUE-083`)
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
- [x] 추천 목적별 입력·생성 옵션과 JD 분석 응답 구조 변경에 맞춰 타입 / API / 결과 화면 수정 (`ISSUE-079`)
- [x] 기록 보완 루프 schema와 API response 변경에 맞춰 관련 계약 문서와 분석 결과 화면 수정
- [x] AI 분석 v2.1 간소화와 부족 정보 카드 답변 저장 흐름에 맞춰 분석 / 추천 / 초안 입력 계약 수정 (`ISSUE-078`)
- [x] AI 요청 측정 / 취소 contract 적용: 민감 원문 없이 메타데이터만 로그 기록, AbortSignal 전달, 취소 error code 공유 (`ISSUE-082`)
- [x] 구조화 AI SSE contract 적용: raw JSON 토큰 노출 없이 `status` / `completed` / `error` 이벤트로 최종 JSON만 전달 (`ISSUE-083`)
- [x] AI 추천 입력 선별·압축 contract 적용: 전체 원문 전송 대신 목적 / 문항 기반 후보 context만 `/api/recommend`에 전달하고 원본 데이터는 저장소에서 재조회 (`ISSUE-084`)
- [x] AI 추천에서 JD 분석 선택 후에도 검색 없는 활용 목적 4개를 다시 열고 변경할 수 있도록 Combobox 필터 비활성화 (`ISSUE-085`)
- [x] 예상 종료일이 지난 진행 활동을 `종료 확인 필요`로 계산하고, 실제 종료 확정 뒤의 `경험 정리 필요`와 구분해 오늘의 기록·나의 활동·활동 상세에 일관되게 표시 (`ISSUE-086`)
- [x] 경험 정리 필요 활동 수정·삭제의 공통 피드백을 활동 영역 헤더 아래로 이동해 다른 활동의 결과처럼 보이지 않도록 수정 (`ISSUE-087`)
- [x] 나의 활동 완료 경험 인라인 상세 하단에 휴지통 아이콘과 `삭제` 액션을 추가하고 기존 삭제 확인·repository 정리 흐름 연결 (`ISSUE-088`)
- [x] AI 실행 CTA를 기존 상세 액션과 같은 크기·모서리·여백으로 통일하고 테두리·Sparkles·Refresh 외곽선·텍스트에 animated gradient를 적용하며 조회·이동 액션은 기존 위계로 보존 (`ISSUE-089`)
- [x] 현재 AI 추천 결과와 추천 기록 상세에서 필수 역량·키워드·제약·1순위 요약·참고 문장을 화면에서만 제거하고 추천 API·저장 데이터·답변 초안 복사는 유지 (`ISSUE-090`)
- [x] 독립 AI 분석 화면의 복귀 링크를 상단 헤더로 이동하고 하단에는 재분석 실행만 남기며 중복 추천 이동 링크 제거 (`ISSUE-091`)
- [x] 나의 활동 AI 분석 스플릿뷰 하단에 독립 `분석 상세 보기` 이동 버튼 추가 (`ISSUE-092`)
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
- [x] 캘린더 헤더에 연도·월 직접 선택과 미래 월 제한 적용 (`ISSUE-076`)
- [x] 날짜별 기록을 제목 우선 이벤트 목록과 `+` 작성 액션으로 재구성하고 진행 활동 없음 안내 팝업 적용 (`ISSUE-065`)
- [x] 하위 화면 Basic Breadcrumb과 날짜별 기록의 검색 없는 활동 선택 목록 적용, 신규 기록의 `활동을 선택하세요` 초기 상태와 모바일 키보드·overflow 검증 (`ISSUE-068`)
- [x] 인증 제품 화면 전체 Basic Breadcrumb과 상위 3개·하위 7개 화면의 페이지 프레임·제목 위치·타이포그래피 통일 (`ISSUE-069`)
- [x] 나의 활동 완료 경험 인라인 상세에 독립 `활동 상세 보기` 이동 액션을 복원하고 상세 슬롯 560px 이하에서도 `활동 상세 보기`·`수정`·`AI 분석 결과`를 한 줄로 유지 (`ISSUE-071`)
- [ ] 나의 활동 제목 한 줄 고정·좁은 패널 검색 축약의 UI preview 폭별 검증 완료 후 실제 로그인 완료 경험의 목록·상세·분석 전환 확인 (`ISSUE-066`)
- [ ] 나의 활동 AI 분석 스플릿뷰 구현 후 실제 로그인 분석 데이터로 열기·닫기·재분석·부족 정보 답변 회귀 확인 (`ISSUE-067`, `ISSUE-078`)
- [x] AI 분석 부족 정보 답변을 질문별 단일 열림 흰색 `MorphSurface`로 전환하고 닫힌 command bar·겹침 없는 anchored reveal·기본 상태/단축키 안내 제거·데스크톱/390px 모바일의 초점·Escape·바깥 클릭·빈 답변 유지·가로 overflow를 검증 (`ISSUE-094`)
- [x] 부족 정보 분석 사유를 placeholder 없는 답변 입력창 아래 제목 없는 ReUI 참고 Warning Alert로 표시 (`ISSUE-102`)
- [ ] AI 분석 부족 정보 anchored reveal의 390px 실제 브라우저 모션과 reduced motion 강제 에뮬레이션 확인 (`ISSUE-094`)
- [x] 활동 종료 → AI 사실 기반 초안 → 완료 경험 저장
- [x] 나의 활동에서 완료 경험과 진행 활동 통합
- [x] AI 경험 분석
- [x] CampusLog AI 기반 활동 추천과 추천 기록
- [x] 검정·차콜 공통 앱 셸과 반응형 UI
- [x] lint / typecheck / production build / 브라우저 검증
