# CampusLog 테스트 케이스

## 상태 기준

- `NOT_RUN`: 이번 실행에서 실제 검증하지 않음
- `PASS`: 명시한 절차와 검증 방법으로 실제 확인함
- `FAIL`: 실제 결과가 예상 결과와 다름
- `BLOCKED`: 외부 환경·권한·데이터 조건 때문에 실행을 완료하지 못함
- `NOT_IMPLEMENTED`: 현재 코드에 사용자 플로우가 구현되지 않음. 실패 집계와 분리

`OUT_OF_SCOPE`는 상태가 아니라 범위 분류로 기록하며 상태는 `NOT_IMPLEMENTED`를 사용합니다.

## 자동화와 기본 실행

### TC-001 전체 Node 테스트

- 기능명: 단위·구조·회귀 자동 테스트
- 목적: 현재 저장소의 50개 테스트 파일 전체가 통과하는지 확인
- Preconditions: `web/node_modules` 설치, Node.js 22 이상
- 입력값: `web/src/**/*.test.mjs`
- 실행 절차: `web/`에서 `node --test` 실행
- 예상 결과: 종료 코드 0, 실패 0
- 실제 결과: 최신 전체 회귀에서 186개 PASS, fail 0, duration 약 695ms
- 상태: `PASS`
- 검증 방법: Node TAP 요약과 종료 코드

### TC-002 ESLint

- 기능명: 정적 품질 검사
- 목적: ESLint 오류가 없는지 확인
- Preconditions: 의존성 설치
- 입력값: 전체 `web/` 소스
- 실행 절차: `npm run lint`
- 예상 결과: 종료 코드 0
- 실제 결과: 종료 코드 0, 오류 출력 없음
- 상태: `PASS`
- 검증 방법: 명령 종료 코드

### TC-003 TypeScript

- 기능명: 타입 검사
- 목적: 빌드 전 타입 오류 확인
- Preconditions: 의존성 설치
- 입력값: `web/tsconfig.json`
- 실행 절차: `npx tsc --noEmit`
- 예상 결과: 종료 코드 0
- 실제 결과: 종료 코드 0, 오류 출력 없음
- 상태: `PASS`
- 검증 방법: 명령 종료 코드

### TC-004 Production build

- 기능명: Next.js production build
- 목적: production 번들과 route 생성 가능 여부 확인
- Preconditions: 실행 중 dev server와 `.next` 충돌 없음
- 입력값: 현재 소스와 `.env.local`
- 실행 절차: `npm run build`
- 예상 결과: 종료 코드 0, 모든 route 빌드
- 실제 결과: Next.js 15.5.20에서 compile·type/lint check·19개 static page 생성·route trace 완료, 종료 코드 0
- 상태: `PASS`
- 검증 방법: Next.js build 요약과 종료 코드

## 인증·보안

### TC-005 비로그인 보호 화면

- 기능명: page route 보호와 `returnTo`
- 목적: 비로그인 사용자가 보호 데이터를 먼저 보지 않는지 확인
- Preconditions: 인증 cookie 없는 HTTP client
- 입력값: `GET /dashboard`
- 실행 절차: redirect를 자동 추적하지 않고 요청
- 예상 결과: HTTP 307, `/login?returnTo=%2Fdashboard&authError=SESSION_REQUIRED`
- 실제 결과: HTTP 307과 예상 location 확인
- 상태: `PASS`
- 검증 방법: HTTP status와 `Location` header

### TC-006 비로그인 AI API 5종

- 기능명: AI API 인증
- 목적: 모든 AI route가 세션 없이 OpenAI를 호출하지 않는지 확인
- Preconditions: 인증 cookie 없음
- 입력값: 빈 JSON `{}`를 analyze, recommend, answer-drafts, evidence-followups, synthesize-activity에 POST
- 실행 절차: 각 route의 status와 error code 확인
- 예상 결과: 모두 HTTP 401, `SESSION_REQUIRED`
- 실제 결과: 5개 route 모두 HTTP 401, `SESSION_REQUIRED`
- 상태: `PASS`
- 검증 방법: 실제 HTTP 응답 JSON과 status

### TC-007 로그인 빈 값·잘못된 자격 증명

- 기능명: 이메일 로그인 예외 처리
- 목적: 빈 입력과 잘못된 인증이 일반 사용자 문구로 차단되는지 확인
- Preconditions: 실제 인증 서버 연결, 비로그인 브라우저
- 입력값: 빈 값, 잘못된 형식, 잘못된 비밀번호
- 실행 절차: `/login`에서 각 입력으로 제출
- 예상 결과: 필드 오류 또는 `INVALID_CREDENTIALS`, Supabase 원문·계정 존재 여부 미노출
- 실제 결과: 빈 제출은 브라우저 기본 필수 입력으로 차단됐다. 잘못된 비밀번호 최초 실행에서 Server Action 모듈 export 오류를 재현했고, 수정 후 같은 조건에서 URL과 입력값을 유지하며 `이메일 또는 비밀번호를 확인해주세요.`만 표시되는 것을 확인했다.
- 상태: `PASS`
- 검증 방법: 화면 alert, URL, 네트워크 status

### TC-008 정상 로그인·새로고침 세션

- 기능명: 이메일 로그인과 세션 복구
- 목적: 지정 QA 계정이 로그인하고 새로고침 뒤에도 보호 화면을 유지하는지 확인
- Preconditions: 사용자 제공 QA 계정, 실제 Supabase 연결
- 입력값: 문서에 기록하지 않는 QA 자격 증명
- 실행 절차: 로그인 → `/dashboard` → 새로고침
- 예상 결과: 계정 데이터 표시, 로그인 화면으로 되돌아가지 않음
- 실제 결과: 사용자 제공 QA 계정으로 로그인해 홈과 `/dashboard`에 진입했다. 새로고침과 새 탭 재접속 뒤에도 계정 메뉴와 데이터가 유지됐다. 로그아웃 완료 후 `/dashboard` 직접 접근은 로그인 화면으로 다시 차단됐고, 정상 완료를 기다린 계정 재로그인에서도 오류 없이 복구됐다.
- 상태: `PASS`
- 검증 방법: URL, 페이지 계정 표시, 새로고침 후 DOM

### TC-009 사용자별 데이터 격리

- 기능명: RLS와 repository 소유권
- 목적: 사용자 A가 사용자 B의 데이터에 접근할 수 없는지 확인
- Preconditions: 서로 다른 QA 계정 2개와 각 계정 데이터
- 입력값: 상대 계정의 experience/activity ID
- 실행 절차: 목록 확인 → 직접 URL → CRUD 요청 확인
- 예상 결과: 상대 데이터 내용 미노출, 조회/변경 거부
- 실제 결과: 데이터가 있는 QA 계정과 빈 QA 계정의 목록이 각각 완료 경험 16개와 0개로 분리됐다. 빈 계정에서 데이터 계정의 실제 experience ID로 직접 접근해도 `경험을 찾을 수 없습니다`만 표시됐으며 원문·첨부는 노출되지 않았다.
- 상태: `PASS`
- 검증 방법: 브라우저 DOM, Supabase 응답 status, 사용자별 목록 비교

## 활동·날짜별 기록

### TC-010 대시보드 빈 상태

- 기능명: 오늘의 기록 초기 상태
- 목적: 데이터가 없을 때 이유와 다음 행동이 표시되는지 확인
- Preconditions: 빈 UI preview localStorage
- 입력값: `/dashboard`
- 실행 절차: 데이터 로딩 완료까지 대기
- 예상 결과: 진행 활동 0개, 활동 추가 CTA, 기록 없음 캘린더, 날짜별 기록 안내
- 실제 결과: 데스크톱 브라우저 DOM에서 모두 확인
- 상태: `PASS`
- 검증 방법: 실제 DOM snapshot

### TC-011 활동 생성 빈 입력

- 기능명: 활동 작성 validation
- 목적: 필수 입력 없이 저장되지 않는지 확인
- Preconditions: 대시보드 활동 추가 dialog 열림
- 입력값: 제목·정보 빈 값
- 실행 절차: `저장` 선택
- 예상 결과: dialog와 입력 유지, 필수 오류 표시, 활동 미생성
- 실제 결과: URL 유지, `활동 제목을 입력해 주세요.` alert 확인
- 상태: `PASS`
- 검증 방법: 실제 DOM snapshot과 URL

### TC-012 정상 활동 생성·상세 이동

- 기능명: 진행 활동 생성
- 목적: 유효한 활동이 저장되고 생성 ID 상세로 이동하는지 확인
- Preconditions: UI preview localStorage
- 입력값: QA 제목·설명, 오늘 시작, 종료일 미정
- 실행 절차: 폼 입력 → 저장 → 상세 로딩
- 예상 결과: 새 `/activities/{id}`, 진행 중 상태, 입력 내용과 0개 기록 표시
- 실제 결과: UUID 상세로 이동하고 제목·설명·진행 중·0개 기록 확인
- 상태: `PASS`
- 검증 방법: 실제 URL과 DOM

### TC-013 기록 없는 활동 종료

- 기능명: 활동 종료 예외 흐름
- 목적: 연결 기록이 없을 때 AI 합성을 시작하지 않고 보완을 안내하는지 확인
- Preconditions: 기록 0개인 진행 활동
- 입력값: 활동 종료
- 실행 절차: 종료 dialog → 최종 종료 동작
- 예상 결과: AI API 미호출, 활동·기록 보존, 기록 보완 안내
- 실제 결과: 실제 Supabase에 만든 기록 0개 QA 활동에서 최종 종료 동작까지 실행했다. `아직 연결된 기록이 없습니다` 안내 후 dialog가 닫히고 활동은 `진행 중`으로 보존됐으며 AI 호출은 발생하지 않았다.
- 상태: `PASS`
- 검증 방법: UI, network status, 활동 상태

### TC-014 날짜별 기록 생성·새로고침

- 기능명: DailyLog 생성과 persistence
- 목적: 활동과 날짜에 연결한 기록이 저장되고 새로고침 뒤 유지되는지 확인
- Preconditions: 오늘 시작한 진행 활동
- 입력값: 오늘 날짜, QA 기록 문장
- 실행 절차: 날짜별 기록 패널 → 활동 선택 → 저장 → 새로고침
- 예상 결과: 이벤트 목록·캘린더 개수·활동 타임라인에 동일 기록 표시
- 실제 결과: 빈 제출에서 활동 선택 오류를 확인한 뒤 기록 저장 성공, 캘린더 `기록 1개`·이벤트 목록·활동 타임라인 표시 및 dev server 재시작/새 탭 뒤 유지 확인
- 상태: `PASS`
- 검증 방법: 브라우저 DOM, 새로고침, repository 결과

### TC-015 미래·시작일 이전 날짜 차단

- 기능명: DailyLog 날짜 제약
- 목적: 기록 불가능 날짜에서 입력을 만들 수 없는지 확인
- Preconditions: 2026-08-20 기준 대시보드
- 입력값: 2026-08-21 이후 미래 날짜
- 실행 절차: 캘린더의 미래 날짜 상태 확인
- 예상 결과: 미래 날짜 버튼 비활성, 기록 폼 미제공
- 실제 결과: 2026-08-21 이후 날짜가 모두 disabled임을 확인
- 상태: `PASS`
- 검증 방법: 실제 DOM의 disabled 상태

### TC-016 날짜별 기록 수정·삭제·연속 사용

- 기능명: DailyLog update/delete
- 목적: 같은 활동의 여러 기록과 연속 수정에서 상태가 꼬이지 않는지 확인
- Preconditions: 저장된 기록 2개 이상
- 입력값: 수정 문장, 삭제 대상 ID
- 실행 절차: 첫 기록 수정 → 둘째 기록 생성 → 첫 기록 삭제 → 새로고침
- 예상 결과: 대상만 변경·삭제, 나머지 기록과 활동 관계 유지
- 실제 결과: 실제 빈 QA 계정에서 첫 기록 생성·수정·새로고침 유지와 같은 날짜 두 번째 기록 생성을 확인했다. 두 기록 중 두 번째 기록만 개별 삭제한 뒤 캘린더가 `기록 2개`에서 `기록 1개`로 줄고, 수정한 첫 기록과 원래 활동의 `진행 중` 상태·`기록된 날 1일`·`쌓인 기록 1개`·타임라인 관계가 유지됐다. 최종 정리에서 남은 기록을 삭제한 뒤 캘린더 `기록 없음`과 활동 0개를 재확인했다.
- 상태: `PASS`
- 검증 방법: 이벤트 목록·타임라인·새로고침 비교

## 완료 경험·첨부

### TC-017 완료 경험 필수 입력과 정상 저장

- 기능명: Experience create
- 목적: 빈 입력을 차단하고 유효한 과거 경험을 저장하는지 확인
- Preconditions: `/experiences/new`
- 입력값: 제목·기간·역할·내용·성과
- 실행 절차: 빈 제출 → 유효 입력 제출 → 상세 확인
- 예상 결과: 빈 제출 오류, 정상 제출은 새 상세와 동일 데이터
- 실제 결과: 실제 빈 QA 계정에서 빈 제출 차단 후 제목·기간·역할·내용·성과를 저장했다. UUID 상세로 이동하고 새로고침 뒤 입력값이 유지됐다.
- 상태: `PASS`
- 검증 방법: 화면 alert, URL, 상세 DOM

### TC-018 긴 경험 입력 상한

- 기능명: Experience/AI 공통 입력 한도
- 목적: 긴 입력이 조용히 잘리지 않고 90% 이후 안내·초과 오류를 제공하는지 확인
- Preconditions: 자동 테스트 실행
- 입력값: 제목 200자, 역할 1,000자, 내용 8,000자, 성과 4,000자 경계와 초과값
- 실행 절차: 관련 Node 테스트 실행
- 예상 결과: 경계 허용, 초과량 계산, 폼과 AI route 상한 일치
- 실제 결과: 관련 자동 테스트 모두 PASS
- 상태: `PASS`
- 검증 방법: `experienceInputLimits`와 role 구조 테스트

### TC-019 관련 링크 오류·중복·새로고침

- 기능명: 관련 링크
- 목적: 잘못된 URL·빈 URL 설명·중복 URL을 차단하고 정상 링크를 유지하는지 확인
- Preconditions: 경험 작성 폼
- 입력값: 잘못된 URL, 중복 URL, 정상 URL+설명
- 실행 절차: 각 입력 제출 후 정상 링크 저장·새로고침
- 예상 결과: 잘못된 입력 차단, 정상 링크와 설명·파비콘 유지
- 실제 결과: 잘못된 URL과 동일 URL 중복 행이 각각 구체적인 오류로 저장 전에 차단됐다. 정상 HTTPS URL과 설명은 실제 경험 상세에 저장되고 새로고침 뒤 유지됐다.
- 상태: `PASS`
- 검증 방법: validation alert, 상세 링크 href, 새로고침

### TC-020 첨부 선택 validation

- 기능명: 경험 사진·PDF 첨부
- 목적: 형식·개수·용량·빈 파일 제약을 확인
- Preconditions: Node 테스트 실행
- 입력값: JPG/PNG/WebP/PDF, 4개 파일, 5MB 초과, 빈 파일, 미지원 형식
- 실행 절차: 첨부 validation 테스트 실행
- 예상 결과: 허용 파일 통과, 나머지 명확히 거부
- 실제 결과: 관련 자동 테스트 모두 PASS
- 상태: `PASS`
- 검증 방법: `experienceAttachments.test.mjs`

### TC-021 실제 private 첨부 업로드·조회·삭제

- 기능명: Supabase Storage와 metadata RLS
- 목적: 실제 로그인 환경에서 첨부 전체 흐름 확인
- Preconditions: migration 적용, 로그인, 완료 경험, 비민감 테스트 파일
- 입력값: 작은 이미지 1개 또는 PDF 1개
- 실행 절차: 업로드 → 상세 signed URL → 새로고침 → 개별 삭제
- 예상 결과: 본인만 조회, 새로고침 유지, 삭제 뒤 metadata/object 제거, 경험 원문·분석 상태 불변
- 실제 결과: 합성한 비민감 PDF 1개를 실제 private Storage에 업로드하고 상세의 첨부 1개·파일명·형식·용량·signed link를 확인했다. 개별 삭제 후 파일명과 첨부 구획이 사라졌으며, 새로고침 뒤에도 첨부 0개를 유지했다. 경험의 제목·기간·역할·원문·성과와 `미분석` 상태는 삭제 전후 모두 동일했다.
- 상태: `PASS`
- 검증 방법: 브라우저, Storage 응답, repository 재조회

## AI 분석·추천·답변

### TC-022 AI 분석 정상 구조·저장

- 기능명: `/api/analyze`
- 목적: 실제 경험 분석이 필수 구조를 반환하고 계정 DB에 저장되는지 확인
- Preconditions: 로그인 QA 계정, 완료 경험, OpenAI key
- 입력값: 기존 비민감 QA 경험 1개
- 실행 절차: 분석 1회 → 결과 확인 → 새로고침/재조회
- 예상 결과: HTTP 200, summary·STAR·achievements·evidenceGaps·keywords, 분석 metadata, 저장 결과 유지
- 실제 결과: test4의 기존 비민감 경험 1개에서 `다시 분석하기`를 1회 실행했다. `/api/analyze`는 HTTP 200, `gpt-5.6-luna`, `status: success`, `retry: false`, 약 11.55초로 완료됐고 실제 OpenAI 호출은 정확히 1회였다. 결과에서 summary, STAR의 S/T/A/R, achievements 4개, evidenceGaps 4개, keywords 10개와 분석 완료 metadata를 확인했다. 생성 시각이 갱신됐으며 직접 URL 재진입과 새로고침 뒤에도 같은 생성 시각과 결과 구조가 조회되어 DB 저장을 확인했다. 경험 원문은 수정하거나 삭제하지 않았다.
- 상태: `PASS`
- 검증 방법: network status, DOM 필드, repository 재조회

### TC-023 AI 분석 실패·취소 보존

- 기능명: AI 분석 예외 처리
- 목적: API 실패나 사용자 취소 시 원본과 마지막 유효 분석을 보존하는지 확인
- Preconditions: 기존 분석 또는 입력 경험
- 입력값: 취소, mock 불가 시 실제 실패를 유발하지 않는 구조 테스트
- 실행 절차: 요청 시작 → 취소/실패 → 재진입
- 예상 결과: 원본 보존, 부분 결과 미저장, 재시도 가능
- 실제 결과: 테스트 프로세스 안에서 AI API와 repository만 가상 모듈로 교체해 `OPENAI_API_ERROR`와 `REQUEST_CANCELLED`를 각각 주입했다. 두 조건 모두 분석 저장 함수 호출은 0회였고 경험 원문과 마지막 정상 분석 snapshot이 보존됐다. 취소 결과는 `REQUEST_CANCELLED`를 유지했다.
- 상태: `PASS`
- 검증 방법: `node --test src/lib/experienceAnalysisWorkflow.failure.test.mjs` — 2 tests, 2 pass. production route·client에는 fault 분기나 임시 header를 추가하지 않음

### TC-024 텍스트 AI 추천·자동 저장

- 기능명: `/api/recommend`
- 목적: 짧은 문항에서 근거 기반 추천과 저장을 확인
- Preconditions: 로그인 QA 계정, 완료 경험 존재
- 입력값: 비민감 QA 질문 1개와 목적
- 실행 절차: 추천 1회 → Top match 구조 → 추천 기록 재조회
- 예상 결과: HTTP 200, 요구사항·1~3 matches·근거·부족 정보·과장 주의점, 실제 경험 ID, 자동 저장
- 실제 결과: 실제 OpenAI 호출 1회에서 HTTP 200과 질문 분석, 실제 experience ID 기반 3개 matches, 추천 이유·직접/부족 근거·과장 주의점·활용 각도를 확인했다. 추천 기록이 24개에서 25개로 증가했고 새로고침 뒤 동일 질문·생성 시각이 유지됐다.
- 상태: `PASS`
- 검증 방법: network status, 결과 DOM, 추천 기록

### TC-025 추천 빈 상태와 중복 실행 방지

- 기능명: 추천 UI 상태
- 목적: 경험이 없을 때 다음 행동을 제공하고 진행 중 중복 요청을 막는지 확인
- Preconditions: 구조 테스트와 빈 데이터 조건
- 입력값: 경험 0개, 동일 task key 반복
- 실행 절차: 관련 Node 테스트 실행
- 예상 결과: 활동 추가 안내, 동일 key 작업 1개, 취소는 입력 보존
- 실제 결과: 관련 자동 테스트 모두 PASS
- 상태: `PASS`
- 검증 방법: recommendation page 및 background task 구조 테스트

### TC-026 추천 이미지 validation·원본 비저장

- 기능명: 추천 vision 입력
- 목적: 이미지 상한과 요청·저장 contract 확인
- Preconditions: Node 테스트 실행
- 입력값: JPG/PNG/WebP, 최대 3장, 빈/초과/미지원 파일
- 실행 절차: 이미지 validation·migration·route 구조 테스트 실행
- 예상 결과: 허용 형식만 준비, 서버 data URL 재검증, 기록에는 inputSource만 저장
- 실제 결과: 관련 자동 테스트 모두 PASS
- 상태: `PASS`
- 검증 방법: recommendation image 관련 4개 테스트 파일

### TC-027 답변 초안 생성·분량·누적 저장

- 기능명: `/api/answer-drafts`
- 목적: 선택 match에서 1개 초안을 생성하고 기존 type을 보존하는지 확인
- Preconditions: 로그인, 저장된 추천과 원본 경험
- 입력값: 자기소개서 300/500/1000 또는 100~2000 직접 입력 중 대표 1개
- 실행 절차: 초안 1회 생성 → 필드·분량 → 새로고침 재조회
- 예상 결과: 본문·usedEvidence·missingEvidenceNotes·cautions, 목표 분량, 같은 추천에 누적 저장
- 실제 결과: test4의 기존 자기소개서 추천 1순위 경험에서 500자 버전 1개를 생성했다. `/api/answer-drafts`는 HTTP 200, `gpt-5.6-luna`, `status: success`, `retry: false`, 약 10.97초로 완료돼 실제 OpenAI 호출은 1회뿐이었고 자동 보정 호출은 발생하지 않았다. 첫 결과는 목표 440~480자 안의 공백 포함 451자였으며 제목·본문·usedEvidence 4개·missingEvidenceNotes·cautions 구조를 확인했다. 추천 기록 화면 새로고침 후 같은 500자 탭에서 제목, 451자 본문과 세 보조 구획이 다시 조회되어 DB 저장을 확인했다. 기존 추천과 경험은 삭제하거나 수정하지 않았다.
- 상태: `PASS`
- 검증 방법: network, 글자 수, repository 재조회

### TC-028 AI 입력 guard와 rate limit

- 기능명: AI API 공통 보호
- 목적: 잘못된 JSON·본문 초과·최소 근거 부족·호출 제한이 OpenAI 전에 차단되는지 확인
- Preconditions: 로그인 session
- 입력값: malformed JSON, route별 상한 초과, 빈 근거, 제한 횟수 반복
- 실행 절차: 각 대표 요청의 HTTP 응답 확인
- 예상 결과: 400/413/422/429와 공통 오류 구조, 429 `Retry-After`
- 실제 결과: 실제 로그인 session에서 malformed JSON은 HTTP 400 `BAD_REQUEST`, 32,000 bytes 상한 초과는 HTTP 413 `PAYLOAD_TOO_LARGE`, 제목 201자 입력은 HTTP 400 `BAD_REQUEST`, 의미 있는 행동 근거 부족은 HTTP 422 `INSUFFICIENT_INPUT`으로 차단됐다. 같은 runtime의 21번째 분석 요청은 HTTP 429 `RATE_LIMITED`와 `Retry-After: 596`을 반환했다. 모든 요청은 guard에서 종료됐고 OpenAI 요청은 발생하지 않았다.
- 상태: `PASS`
- 검증 방법: 동일 origin 임시 local probe의 HTTP status/header/JSON, 개발 서버 `POST /api/analyze` 400·413·422·429 로그. probe 파일은 검증 직후 제거

## 새로고침·반응형·접근성

### TC-029 데이터 없는 추천·기록 화면

- 기능명: 빈 상태 구분
- 목적: 추천 가능 경험 없음과 추천 기록 없음·검색 결과 없음을 구분
- Preconditions: 빈 repository 또는 검색 미일치
- 입력값: `/recommend`, `/recommend/history`, 존재하지 않는 검색어
- 실행 절차: 각 화면 로딩 완료
- 예상 결과: 원인별 문구와 적절한 다음 행동
- 실제 결과: 빈 QA 계정의 `/recommend`에서 경험 추가 CTA, `/recommend/history`에서 0개·첫 추천 CTA를 실제 확인했다. 데이터 계정에서는 검색 미일치 시 0개 status와 `검색 결과가 없습니다` 안내를 확인했다.
- 상태: `PASS`
- 검증 방법: 실제 DOM과 링크

### TC-030 존재하지 않는 경험 ID

- 기능명: 상세 오류 상태
- 목적: 존재하지 않는 ID가 다른 데이터 내용을 노출하지 않는지 확인
- Preconditions: 로그인 session
- 입력값: 존재하지 않는 experience UUID `00000000-0000-0000-0000-000000000000`
- 실행 절차: 상세 URL 직접 접근
- 예상 결과: 일관된 찾을 수 없음/접근 불가 상태, 데이터 내용 미노출
- 실제 결과: 실제 로그인 session에서 직접 URL 접근 시 `경험을 찾을 수 없습니다`와 목록 복귀 링크만 표시됐고 다른 경험 내용은 노출되지 않았다.
- 상태: `PASS`
- 검증 방법: HTTP/DOM과 console error

### TC-031 390px 모바일 핵심 화면

- 기능명: 모바일 반응형
- 목적: 대시보드·나의 활동·AI·추천 기록·완료 경험 상세의 가로 잘림과 핵심 콘텐츠 접근 확인
- Preconditions: 390px viewport
- 입력값: 핵심 route와 대표 데이터
- 실행 절차: 각 화면에서 `scrollWidth <= clientWidth`, 주요 버튼·dialog 확인
- 예상 결과: 가로 overflow 0, 44px 조작 영역, footer 접근 가능
- 실제 결과: preview 4개 route와 실제 로그인 데이터 5개 route(`/dashboard`, `/experiences`, `/recommend`, `/recommend/history`, 대표 완료 경험 상세) 모두 390×844에서 `clientWidth=scrollWidth=bodyScrollWidth=379`, overflow 0을 확인했다.
- 상태: `PASS`
- 검증 방법: viewport override, DOM, layout 측정

### TC-032 reduced motion·초점·Escape

- 기능명: 접근성 회귀
- 목적: 비필수 애니메이션 감소와 overlay focus contract 확인
- Preconditions: 관련 자동 테스트
- 입력값: reduced motion, dialog/MorphSurface Escape
- 실행 절차: 구조·controller 테스트 실행
- 예상 결과: 반복 motion 중단, Escape 닫기, trigger focus 복귀
- 실제 결과: 관련 자동 테스트 모두 PASS
- 상태: `PASS`
- 검증 방법: Liquid Glass, AI loading, MorphSurface, scrollbar 테스트

## 미구현·제외 범위 추적

### TC-033 localStorage 계정 이전

- 기능명: 로컬 데이터 가져오기
- 목적: 미구현 기능을 실패와 분리
- Preconditions: 없음
- 입력값: 기존 localStorage 데이터
- 실행 절차: 실제 route/UI/repository upsert 존재 여부 확인
- 예상 결과: 현재 기본 플로우에 없음, 원본 자동 삭제 없음
- 실제 결과: ledger schema만 존재하고 사용자 이전 UI·upsert는 없음
- 상태: `NOT_IMPLEMENTED`
- 검증 방법: route/component/repository 검색과 범위 문서

### TC-034 durable AI rate limit·idempotency

- 기능명: 운영 AI hardening
- 목적: 현재 runtime-local 보호와 미구현 운영 보호를 구분
- Preconditions: 없음
- 입력값: 다중 instance/재시작, idempotency key
- 실행 절차: 관련 구현 검색과 계약 확인
- 예상 결과: 현재 기능에는 없음
- 실제 결과: runtime-local rate guard와 UI task 중복 방지만 구현
- 상태: `NOT_IMPLEMENTED`
- 검증 방법: `aiApiProtection.ts`, `AI_API_CONTRACT.md`

### TC-035 비밀번호 재설정·관리자·결제 등

- 기능명: 2차 MVP 제외 기능
- 목적: 제외 범위를 제품 실패로 집계하지 않음
- Preconditions: 없음
- 입력값: reset/admin/payment/public profile 경로
- 실행 절차: route와 범위 문서 확인
- 예상 결과: 현재 구현 없음
- 실제 결과: route 없음, 명시적 OUT_OF_SCOPE
- 상태: `NOT_IMPLEMENTED`
- 검증 방법: app route 목록과 PRD/CURRENT_PHASE
