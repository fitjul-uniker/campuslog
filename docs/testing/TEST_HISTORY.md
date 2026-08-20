# CampusLog 테스트 이력

과거 실행과 실패·수정·재실행 기록을 누적합니다. 최신 전체 상태는 `TEST_RESULTS.md`를 봅니다.

## Run #1 — 자동화 기준선

- 실행 일시: 2026-08-20, Asia/Seoul
- 환경: Node v23.11.0, npm 10.9.2
- 실행:
  - `node --test`
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
- 결과:
  - Node 181개 PASS, 0 FAIL
  - lint PASS
  - typecheck PASS
  - Next.js production build PASS, 19개 static page 생성
- 실패: 없음
- 수정: 없음
- 회귀 테스트: 전체 Node 테스트 자체를 기준 회귀로 사용

## Run #2 — UI preview 핵심 시작 흐름

- 실행 일시: 2026-08-20, Asia/Seoul
- 환경: localStorage UI preview, Codex in-app Chromium, desktop viewport
- 실행:
  - 빈 대시보드 로딩
  - 빈 활동 입력 제출
  - QA 진행 활동 생성과 상세 이동
  - 기록 0개 활동의 종료 확인 dialog
  - 미래 캘린더 날짜 비활성 상태
- 결과:
  - TC-010 PASS
  - TC-011 PASS
  - TC-012 PASS
  - TC-014 PASS: 빈 기록 차단, 저장, 캘린더·이벤트·타임라인, dev server 재시작 뒤 persistence
  - TC-015 PASS
  - TC-013은 최종 종료 동작 전이라 `NOT_RUN` 유지
- 실패: 없음
- 수정: 없음
- 회귀 테스트: 생성 뒤 상세의 제목·설명·진행 상태·기록 수를 함께 확인

기록이 있는 활동에서 UI preview가 보호 AI API를 호출했을 때 설정 오류를 표시하고 활동·날짜별 기록·재시도 액션을 보존하는 것도 확인했습니다. 이는 preview가 보호 API를 우회하지 않는 의도된 실패 경로이며 제품 버그로 분류하지 않았습니다.

## Run #3 — 비로그인 보호 contract

- 실행 일시: 2026-08-20, Asia/Seoul
- 환경: `env -u OPENAI_API_KEY npm run dev`, 인증 cookie 없는 HTTP client
- 실행:
  - `/dashboard` direct request
  - `/api/analyze`
  - `/api/recommend`
  - `/api/answer-drafts`
  - `/api/evidence-followups`
  - `/api/synthesize-activity`
- 결과:
  - TC-005 PASS: HTTP 307과 안전한 로그인 `returnTo`
  - TC-006 PASS: 5개 API 모두 HTTP 401 `SESSION_REQUIRED`
- 실패: 없음
- 수정: 없음
- 회귀 테스트: middleware 목록에 없는 두 API도 route handler 자체 인증으로 보호됨을 함께 확인

## Run #4 — 390px 반응형

- 실행 일시: 2026-08-20, Asia/Seoul
- 환경: localStorage UI preview, Codex in-app Chromium, 390×844 viewport
- 대상: `/dashboard`, `/experiences`, `/recommend`, `/activities/{qa-id}`
- 결과:
  - TC-031 PASS
  - 네 화면 모두 `clientWidth=scrollWidth=bodyScrollWidth=379`, overflow 0
  - console error 0
- 실패: 없음
- 수정: 없음
- 회귀 테스트: 빈/진행/합성 실패 상태가 섞인 QA 데이터로 각 상위 화면과 활동 상세를 함께 확인

## Run #5 — 실제 로그인 실패·수정·재실행

- 실행 일시: 2026-08-20, Asia/Seoul
- 환경: `env -u OPENAI_API_KEY npm run dev`, 실제 Supabase, Codex in-app Chromium

`TC-007 FAIL`

- 재현 조건: `/login`에서 실제 인증 서버에 잘못된 비밀번호 제출
- 실제 결과와 증거: 사용자용 인증 오류 대신 Next.js runtime overlay가 열리고 `A \"use server\" file can only export async functions, found object`가 표시됨
- 예상 결과: 입력과 로그인 화면을 유지하고 계정 존재 여부를 숨긴 일반 오류 문구만 표시
- 원인: `web/src/lib/auth/profile-actions.ts`가 `\"use server\"` 모듈에서 async action과 함께 `initialNicknameUpdateState` 객체를 runtime export함
- 수정: 상태 타입과 초기 객체를 `profile-action-state.ts`로 분리하고 Server Action 모듈은 async 함수만 runtime export하도록 최소 변경
- 동일 조건 재테스트: `/login` 유지, 입력 유지, `이메일 또는 비밀번호를 확인해주세요.` 표시, runtime overlay 없음 — `TC-007 PASS`
- 관련 회귀 테스트: profile action 구조 테스트 추가, 기존 ProfileMenu 구조 테스트 포함 targeted 3개 PASS
- 남은 위험: Supabase 자체 장애·timeout 강제 주입은 실행하지 않음

같은 실행에서 사용자 제공 QA 계정 정상 로그인, `/dashboard` 이동, 새로고침과 새 탭 session 복구를 확인해 `TC-008 PASS`로 기록했다. 비밀번호와 session cookie는 기록하지 않았다.

## Run #6 — 실제 계정 조회·모바일·전체 회귀

- 실행 일시: 2026-08-20, Asia/Seoul
- 환경: 실제 Supabase QA 계정, Codex in-app Chromium, 390×844 및 기본 viewport
- 실제 데이터 조회:
  - 완료 경험 16개 로드
  - 저장 추천 기록 24개 로드
  - 기존 분석의 summary·STAR·achievements·evidence gaps·keywords 재조회
  - 존재하지 않는 경험 UUID는 다른 데이터 없이 찾을 수 없음 상태 표시 — `TC-030 PASS`
- 모바일 회귀:
  - `/dashboard`, `/experiences`, `/recommend`, `/recommend/history`, 대표 완료 경험 상세
  - 다섯 화면 모두 `clientWidth=scrollWidth=bodyScrollWidth=379`, overflow 0 — `TC-031 PASS`
- 수정 후 전체 회귀:
  - `node --test`: 182 PASS, 0 FAIL
  - `npm run lint`: exit 0
  - `npx tsc --noEmit`: exit 0
  - `npm run build`: compile·type/lint·19개 static page 생성, exit 0
- 실제 OpenAI 신규 호출: 사용자 확인 전이라 실행하지 않음. 기존 저장 결과 재조회만 했으며 TC-022/024/027은 `NOT_RUN` 유지

## Run #7 — 실제 OpenAI 자기소개서 추천 1회

- 실행 일시: 2026-08-20, Asia/Seoul
- 환경: `env -u OPENAI_API_KEY npm run dev`, 실제 Supabase QA 계정, `gpt-4.1-mini`
- 입력: 프로젝트가 제공하는 짧은 문제 해결 자기소개서 예시 문항, 저장된 QA 경험 16개
- 실행 횟수: 1회, retry 없음, 이미지 0개
- HTTP/서버 증거: `POST /api/recommend` HTTP 200, `status: success`, 총 처리 약 19.5초
- 결과 구조: 질문 분석, 실제 경험 ID를 가진 추천 경험 3개, 추천 이유, 직접 근거, 부족 근거, 과장 주의점, 활용 각도 확인
- 저장 재조회: 추천 기록 24개 → 25개, 새로고침 뒤 동일 문항과 생성 시각 유지
- 결과: `TC-024 PASS`
- 추가 OpenAI 호출: 비용 제한에 따라 실행하지 않음

## Run #8 — 실제 RLS·빈 상태·경험·첨부·활동 기록

- 실행 일시: 2026-08-20, Asia/Seoul
- 환경: 실제 Supabase의 데이터 계정과 빈 QA 계정, Codex in-app Chromium
- 인증·RLS:
  - 로그아웃 완료 후 보호 경로가 다시 로그인으로 차단됨
  - 두 계정 목록 16개/0개 분리
  - 빈 계정에서 상대 account experience 직접 URL 접근 시 찾을 수 없음, 원문·첨부 미노출 — `TC-009 PASS`
- 빈 상태: 빈 계정 추천 입력·추천 기록 CTA와 데이터 계정 검색 미일치 0건 확인 — `TC-029 PASS`
- 완료 경험·링크:
  - 빈 제출과 잘못된 URL 차단
  - 정상 QA 경험 UUID 상세 저장·새로고침 유지 — `TC-017 PASS`
  - 중복 URL 차단, 정상 HTTPS URL·설명 저장·재조회 — `TC-019 PASS`
- 첨부: 합성 비민감 PDF 1개 private Storage 업로드, 파일명·형식·용량·signed link·새로고침 유지 확인. 삭제 전이라 `TC-021 NOT_RUN` 유지
- 활동·기록:
  - 기록 0개 종료 최종 동작에서 안내 후 진행 상태 보존, AI 호출 없음 — `TC-013 PASS`
  - 실제 DB 기록 생성·수정·새로고침·동일 날짜 두 번째 기록·캘린더 2개 확인. 삭제 전이라 `TC-016 NOT_RUN` 유지
- 계정 전환 관찰: 로그아웃 redirect 완료 전 보호 경로를 강제 이동했을 때 일회성 로드 오류가 보였으나 정상 완료를 기다린 동일 계정 전환에서는 재현되지 않아 제품 실패로 분류하지 않음
- 브라우저 warning/error: 0건

## Run #9 — 통합 테스트 후 전체 회귀

- 실행 일시: 2026-08-20, Asia/Seoul
- `node --test`: 182 PASS, 0 FAIL, 약 712ms
- `npm run lint`: exit 0
- `npx tsc --noEmit`: exit 0
- `npm run build`: compile·type/lint·19개 static page 생성, exit 0
- 결과: 로그인 수정과 실제 통합 데이터 쓰기 이후에도 자동화·정적 검사·production build 회귀 없음

## Run #10 — 합성 QA 데이터 개별 삭제·관계 보존·최종 정리

- 실행 일시: 2026-08-20, Asia/Seoul
- 환경: `env -u OPENAI_API_KEY npm run dev`, 실제 Supabase 빈 QA 계정, Codex in-app Chromium
- 삭제 범위 사전 확인:
  - 이번 실행에서 만든 진행 활동 1개, 같은 날짜 기록 2개, 독립 완료 경험 1개, private PDF 1개만 대상
  - 합성 활동은 생성 경험 연결이 없고, 합성 완료 경험은 `미분석`이며 추천 기록 연결이 없음
  - 데이터 계정과 다른 사용자 데이터는 삭제 화면에서 열거나 삭제 요청하지 않음
- 기록 개별 삭제:
  - 삭제 전: 캘린더 `기록 2개`, 활동 `진행 중`
  - 두 번째 기록 1개만 삭제 후: 캘린더 `기록 1개`, 수정한 첫 기록 유지
  - 활동 상세에서 `기록된 날 1일`, `쌓인 기록 1개`, 남은 문장과 타임라인 관계 유지 — `TC-016 PASS`
- PDF 첨부 개별 삭제:
  - 삭제 전: PDF 1개, 파일명·PDF·436 B와 private signed link 확인
  - 삭제 후와 새로고침 후: PDF 0개·첨부 구획 없음
  - 제목·기간·역할·원문·성과·`미분석` 상태 모두 보존 — `TC-021 PASS`
- 남은 합성 데이터 정리:
  - 남은 기록 1개 삭제 후 캘린더 `기록 없음`, 활동은 유지
  - 기록 0개 상태에서 합성 활동 삭제 후 대시보드 활동 0개
  - 첨부 0개 상태에서 독립 합성 경험 삭제 후 나의 활동 전체 0개
  - 최종 빈 QA 계정: 활동 0, 날짜 기록 0, 완료 경험 0, 첨부 0, 추천 기록 0
  - 삭제한 활동·경험 직접 URL은 찾을 수 없음, 브라우저 warning/error 0건
- 테스트 가드: native confirm 자동화 교착을 피하려고 개발 모드와 두 합성 UUID에만 일치하는 임시 확인창 생략 가드를 사용했으며, 기존 UI와 repository 삭제 경로 실행 후 즉시 제거했다. 관련 컴포넌트에는 diff가 남지 않았다.
- 회귀 테스트: 최종 전체 Node 테스트·lint·typecheck·production build를 다시 실행해 결과를 최신화
- 추가 OpenAI 호출: 없음

## Run #11 — 삭제 후 최종 자동화·빌드 회귀

- 실행 일시: 2026-08-20, Asia/Seoul
- `node --test`: 182 PASS, 0 FAIL, 약 944ms
- `npm run lint`: exit 0
- 첫 `npx tsc --noEmit`: `.next/types/cache-life.d 2.ts`, `routes.d 2.ts`, `validator 2.ts`가 원본 생성 타입과 중복돼 `Duplicate identifier`로 실패
- 원인: 반복한 개발 서버·Fast Refresh 과정에서 남은 `.next` 생성 캐시 복제본. source diff나 제품 로직 결함은 없음
- 수정: 정확히 `web/.next` 생성 캐시만 제거
- 동일 조건 재테스트: `npx tsc --noEmit` exit 0
- 관련 회귀: `npm run build` compile·type/lint·19개 static page 생성, exit 0
- 최종 결과: `TC-001`~`TC-004` PASS 유지, 제품 `FAIL` 0

## Run #12 — AI 사전 guard와 실패·취소 fault injection

- 실행 일시: 2026-08-20, Asia/Seoul
- 환경: `env -u OPENAI_API_KEY npm run dev`, 실제 로그인 session, Codex in-app Chromium, Node v23.11.0
- TC-028 AI 사전 guard:
  - malformed JSON → HTTP 400 `BAD_REQUEST`
  - 32,000 bytes 본문 상한 초과 → HTTP 413 `PAYLOAD_TOO_LARGE`
  - 제목 201자 입력 상한 초과 → HTTP 400 `BAD_REQUEST`
  - 최소 행동 근거 부족 → HTTP 422 `INSUFFICIENT_INPUT`
  - 같은 runtime의 21번째 요청 → HTTP 429 `RATE_LIMITED`, `Retry-After: 596`
  - 개발 서버에는 위 `POST /api/analyze` 상태 코드만 기록됐고 OpenAI 요청 로그는 없음
- TC-023 mock 실패·취소:
  - `node --test src/lib/experienceAnalysisWorkflow.failure.test.mjs`: 2 PASS, 0 FAIL
  - `OPENAI_API_ERROR`와 `REQUEST_CANCELLED`를 테스트 프로세스 안에서만 주입
  - 두 조건 모두 `analyses.save` 0회, 경험 원문과 마지막 정상 분석 snapshot 보존
  - production route·client fault 분기 없음. 동일 origin HTTP probe는 TC-028 직후 삭제
- 결과: `TC-023 PASS`, `TC-028 PASS`
- 실제 OpenAI 호출: 0회

## Run #13 — 실제 AI 분석·답변 초안 최소 호출 및 최종 회귀

- 실행 일시: 2026-08-20, Asia/Seoul
- 환경: `env -u OPENAI_API_KEY npm run dev`, test4 로그인 session, Codex in-app Chromium, Node v23.11.0
- TC-022 실제 AI 분석:
  - 기존 비민감 경험 1개에서 `다시 분석하기` 1회 실행
  - `/api/analyze` HTTP 200, `gpt-5.6-luna`, `status: success`, `retry: false`, total duration 약 11.55초
  - summary, STAR S/T/A/R, achievements 4개, evidence gaps 4개, keywords 10개와 생성 metadata 확인
  - 직접 URL 재진입·새로고침 뒤 같은 생성 시각과 구조를 재조회해 DB 저장 확인
  - 실제 OpenAI 호출 정확히 1회, 기존 경험 원문 삭제·수정 없음
- TC-027 실제 답변 초안:
  - 기존 자기소개서 추천의 1순위 경험에서 500자 버전 1회 생성
  - `/api/answer-drafts` HTTP 200, `gpt-5.6-luna`, `status: success`, `retry: false`, total duration 약 10.97초
  - 첫 결과가 목표 440~480자 안의 공백 포함 451자로 완료되어 자동 보정과 두 번째 OpenAI 호출 없음
  - 제목·본문·usedEvidence 4개·missingEvidenceNotes·cautions 확인
  - 추천 기록 새로고침 후 같은 500자 탭에서 동일 결과를 재조회해 DB 저장 확인
  - 기존 추천·경험 삭제나 수정 없음
- 외부 호출 안전장치:
  - 개발 환경에서 두 번째 답변 초안 외부 호출 직전에만 막는 1회 제한 장치를 로컬에 임시 적용
  - 제품의 분량 판단·자동 보정 조건은 변경하지 않았고 첫 호출이 목표 범위를 만족해 장치는 차단 동작을 하지 않음
  - 검증 직후 임시 코드와 환경을 제거하고 `answer-drafts/route.ts` 기준 branch diff 0, 제한용 문자열 검색 결과 0건 확인
- 최종 회귀:
  - `node --test`: 186 PASS, 0 FAIL, 약 695ms
  - `npm run lint`: exit 0
  - `npm run build`: compile·type/lint·19개 static page 생성, exit 0
  - 마지막 확인에서 `npx tsc --noEmit`과 build를 동시에 실행해 build의 `.next/types` 교체와 경합하면서 typecheck가 TS6053으로 1회 실패
  - 원인: 생성 디렉터리를 읽고 쓰는 두 명령의 동시 실행. 제품 source나 타입 오류는 없음
  - 동일 조건을 직렬화해 build 완료 뒤 `npx tsc --noEmit` 단독 재실행, exit 0
- 결과: `TC-022 PASS`, `TC-027 PASS`, 전체 35개 중 PASS 32·NOT_IMPLEMENTED 3·FAIL/BLOCKED/NOT_RUN 0
- 실제 OpenAI 호출: 분석 1회 + 답변 초안 1회, 총 2회

## 실패 기록 템플릿

### Run #N

`TC-000 FAIL`

- 재현 조건:
- 실제 결과와 증거:
- 예상 결과:
- 원인:
- 수정:
- 동일 조건 재테스트:
- 관련 회귀 테스트:
- 남은 위험:
