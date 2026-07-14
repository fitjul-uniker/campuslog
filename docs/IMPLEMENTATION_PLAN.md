# CampusLog 2차 MVP 구현 계획

## 0. 문서 상태

- v1.1 고도화: 구현·검증 완료, main merge 완료
- 현재 활성 계획 단계: 2차 MVP. 기능 구현은 최신 main에서 기능 브랜치를 만들어 시작
- 단계 기준: `docs/CURRENT_PHASE.md`
- 제품 기준: `PRD.md`
- 이 문서는 두 병렬 Track의 개발 순서와 통합 계약을 정합니다.

## 1. 전환 순서

```text
최신 main 확인
→ 2차 MVP Track별 브랜치 생성
→ 계약 우선 구현
→ 기능 및 디자인 병렬 고도화
→ 통합·보안·사용자 테스트
```

2차 MVP 기능은 `main`에 직접 추가하지 않고 최신 `main`에서 분리한 작은 브랜치로 진행합니다.

## 2. Track A — 인증·데이터·AI

담당: 다른 팀원

### A1. 인증 기반

- Supabase project와 환경 변수 정책
- 이메일 또는 이에 준하는 아이디 + 비밀번호 회원가입, 로그인, 로그아웃
- Google OAuth 로그인
- 세션 확인과 복구
- 보호 라우트와 redirect 정책
- 사용자 식별자 기준 데이터 소유권
- RLS 정책과 권한 테스트

우선순위:

1. Supabase Auth 환경 변수와 서버 / 클라이언트 인증 helper
2. 이메일 + 비밀번호 로그인·회원가입·로그아웃
3. Google OAuth와 auth callback
4. 보호 라우트와 로그인 후 원래 화면 복귀
5. 인증 오류 code와 사용자 문구 contract

2026-07-13 진행 상태:

- `feature/auth-foundation`에서 Supabase Auth helper, 이메일/비밀번호 server action, Google OAuth 시작과 callback, 로그아웃, 보호 라우트 middleware, `/login`, `/signup`, 인증 error / redirect contract를 구현했습니다.
- 기존 v1.1 커버와 제품 UI는 유지하고 인증이 필요한 route만 보호합니다.
- 로그아웃은 기존 네비게이션 톤에 맞춰 데스크톱 사이드바 하단과 모바일 헤더 우측에 배치합니다.
- DB schema / RLS / repository 전환은 PR #30으로 main에 반영되었습니다. localStorage migration은 정식 사용자 데이터 보존 요구가 생길 때 선택 작업으로 진행합니다.

권장 PR 단위:

1. `feature/auth-foundation` 완료
2. `feature/database-schema`
3. `refactor/data-repository`
4. `feature/user-data-sync`

파일 책임:

- Track A는 인증 client/server 모듈, server action, validation schema, 세션·redirect와 사용자용 오류 code contract를 담당합니다.
- Track B는 Track A contract를 사용하는 `/login`, `/signup` route UI와 `components/auth/**`, 문구·상태·접근성을 담당합니다.
- Track A contract를 먼저 merge한 뒤 Track B 인증 UI를 연결하며, 한 PR에서 상대 Track의 파일을 함께 재설계하지 않습니다.

### A2. DB schema와 repository

v1.1 브라우저 모델을 기준으로 아래 데이터를 사용자 계정에 연결합니다.

- experiences
- tracked activities
- daily logs
- experience analyses
- recommendations
- experience synthesis drafts와 활동별 합성·재시도 상태

구현 원칙:

- UI가 localStorage와 Supabase 구현에 직접 결합되지 않도록 repository 경계를 둡니다.
- 모든 사용자 데이터에는 소유자 식별자와 생성·수정 시간을 둡니다.
- activityId, experienceId 등 기존 관계와 멱등성 계약을 유지합니다.
- 합성 초안은 원본 활동·사용된 daily log와 연결하고 RLS를 적용합니다. 완료 경험 저장을 검증한 뒤 초안을 제거하며 `generatedExperienceId` 또는 동등한 유일성 제약으로 중복 생성을 막습니다.
- schema 변경은 migration과 rollback 영향을 문서화합니다.

권장 PR 단위:

1. `feature/database-schema`
2. `refactor/data-repository`
3. `feature/user-data-sync` (Deferred / Optional)

### A3. localStorage 데이터 전환 (Deferred / Optional)

현재 결정:

- 정식 사용자는 계정별 Supabase DB부터 새로 시작합니다.
- 기존 테스트 계정이나 초기 사용자 데이터를 계정 DB로 옮겨야 하는 요구가 없으므로 localStorage → 계정 DB 이전 UI / upsert 구현은 High 필수 범위에서 제외합니다.
- 로그인 세션에서는 localStorage 데이터를 기본 데이터로 자동 표시하지 않습니다.
- localStorage 원본은 자동 이전하거나 자동 삭제하지 않습니다.

향후 실제 기존 사용자 데이터 보존 요구가 생기면 다음 범위로 별도 PR을 진행합니다.

- 로그인 전 기존 브라우저 데이터 탐지
- 마이그레이션 가능 여부와 대상 개수 계산
- 번들 샘플·개발 fixture·파싱 실패 항목 판별과 이전 대상 제외
- 제외된 항목 수와 사유를 Track B가 표시할 수 있는 결과 contract 제공
- 사용자 확인 후 계정 데이터로 이전
- 중복 키와 연결 관계 보존
- 성공 전 localStorage 원본 삭제 금지
- 부분 실패와 재시도 지원
- 동일 작업 반복 시 중복 생성 방지

자동 이전이나 자동 삭제는 구현하지 않습니다.

### A4. AI 분석·추천 고도화

로그인·DB foundation은 main에 반영되었고 사용자가 기본 인증과 계정별 데이터 분리를 확인했습니다. AI API 보호 foundation 이후 실제 AI 품질 고도화는 자소서·지원서 작성에 바로 쓰는 것을 목표로 아래 순서로 진행합니다.

운영 hardening 전제:

- 로그인 사용자만 `/api/analyze`, `/api/recommend`, `/api/synthesize-activity`를 호출할 수 있게 서버에서 세션을 확인합니다.
- 입력 상한, rate limit, 중복 요청 방지, `retryAfter`, OpenAI spend limit / alert, 오류 code를 정리합니다.
- 실패, timeout, 저장 실패 시 원본 경험과 활동 기록을 보존합니다.

2026-07-14 진행 상태:

- `feature/ai-api-protection`에서 세 AI API Route에 route handler 내부 Supabase 세션 확인, 비로그인 401 JSON error contract, 요청 크기 / 필드 상한, OpenAI timeout, 사용자별 runtime-local rate guard, 429 `RATE_LIMITED` + `retryAfter` contract를 추가했습니다.
- runtime-local rate guard는 foundation이며 Vercel 다중 인스턴스에 견디는 durable rate limit, AI route 자체의 중복 요청 멱등성, OpenAI project spend limit / alert 설정은 후속 hardening으로 남깁니다.
- `feature/ai-analysis-v2`에서 `/api/analyze` structured output과 prompt를 v2로 확장하고, STAR, 원본 근거, 부족 정보, 자소서 소재 각도, 역량별 근거를 타입 / 저장소 / Supabase migration / 분석 결과 화면에 연결했습니다. 기존 분석 네 필드는 유지하고 v1 저장 결과는 기본값으로 보정해 읽습니다.
- `feature/ai-recommendation-v2`에서 `/api/recommend` structured output과 prompt를 v2로 확장하고, 문항 / JD 요구사항 추출, 경험 Top 3, 매칭 근거, 부족 근거, 과장 위험, 활용 각도를 타입 / 저장소 / Supabase migration / 추천 결과와 기록 화면에 연결했습니다. 기존 추천 v1 필드는 유지하고 v1 저장 결과는 1개 match와 빈 요구사항으로 보정해 읽습니다.
- `feature/ai-answer-drafts`에서 `/api/answer-drafts` structured output과 prompt를 추가하고, 추천 v2의 선택 match / extractedRequirements / 경험 원본 / 분석 v2 결과를 활용해 사용자가 선택한 답변 초안 1종을 생성합니다. 초안은 추천에 쓰인 원 질문 / 문항 / JD / 면접 질문을 직접 답하도록 작성합니다. 추천 기록 row를 변경하지 않고 별도 `answer_drafts` table 및 `campuslog:v1:answer-drafts` localStorage key에 `(recommendationId, experienceId)` 기준으로 누적 저장해 기존 추천 v1/v2 하위 호환을 유지합니다.

1. AI 경험 분석 v2 — 구현 완료
   - 기존 `summary`, `competencyTags`, `achievements`, `keywords`를 STAR, 원본 근거, 부족 정보, 자소서 소재 각도까지 확장합니다.
   - 분석 결과가 어떤 원본 설명, 성과, 일일 기록에서 도출됐는지 표시할 수 있는 schema를 정의합니다.
   - 역량 태그는 근거 문장과 함께 반환하고, 근거가 약하면 `evidenceGaps` 또는 보완 질문으로 분리합니다.
   - 재분석 필요 상태는 기존 `needs_reanalysis`를 유지하고, 분석 결과에는 모델명, prompt version, 결과 schema version을 저장합니다.
2. 추천 v2 — 구현 완료
   - 자기소개서 문항, 면접 질문, JD 원문, 직무 요구사항, 우대사항을 입력으로 받습니다.
   - 입력에서 요구 역량, 필수 조건, 우대 조건, 답변 의도를 추출하는 parser contract를 정의합니다.
   - 저장된 경험과 분석 v2 결과를 비교해 경험 Top 3, 매칭 이유, 부족 근거, 과장 위험을 반환합니다.
   - 1개만 추천하는 기존 흐름은 fallback으로 유지하고, Top 3 비교 UI는 추천 v2 contract에 맞춰 구현합니다.
3. 답변 초안 생성 — 구현 완료
   - 추천 경험과 요구사항을 기반으로 사용자가 선택한 500자, 800자, 1000자 자기소개서, 45~60초 면접 답변, 포트폴리오 설명 중 1개 버전의 초안을 생성합니다.
   - 답변 초안은 기록에 없는 사실을 만들지 않고, 부족한 근거가 있으면 본문 대신 `missingEvidenceNotes` 또는 `cautions`에 분리합니다.
   - 초안은 추천 기록과 별도 저장소에 연결하고, 추천 결과 / 추천 기록 화면에서 각 Top 3 경험별 버전 선택, 선택 초안 생성, 탭 전환, 복사, 재생성을 제공합니다.
4. 기록 보완 루프
   - AI가 부족한 정보를 질문 형태로 제안하고, 사용자가 답하면 원본 경험 또는 보완 답변으로 저장할 위치를 정합니다.
   - 보완 답변이 들어오면 분석 v2를 재생성하고 관련 추천 결과의 stale 상태를 표시합니다.
   - 질문은 사용자가 실제로 답하기 쉬운 단위로 제한하며, 개인정보나 허위 성과를 요구하지 않습니다.
5. OCR / JD 이미지 입력
   - 텍스트 붙여넣기 기반 JD / 문항 추천 흐름이 안정화된 뒤 붙입니다.
   - 질문 이미지나 공고 캡처는 원본 저장 없이 일회성 AI 입력으로 처리하는 것을 기본값으로 합니다.
   - Storage 도입, 원본 보존, OCR 비용 정책은 별도 결정 없이는 구현하지 않습니다.

권장 PR 단위:

1. `feature/ai-api-protection`
2. `feature/ai-analysis-v2`
3. `feature/ai-recommendation-v2`
4. `feature/ai-answer-drafts`
5. `feature/ai-evidence-followup`
6. `feature/ai-question-ocr` (Optional)

## 3. Track B — 디자인·사용자 경험

담당: 사용자

### B1. 디자인 시스템 정리

- 검정·차콜·웜그레이 token 정리
- Petrona 워드마크와 Pretendard 본문 위계
- spacing, radius, border, shadow, focus token
- Button, Input, Textarea, Badge, Tabs, Dialog, Alert 상태
- Tailwind / shadcn 도입 시 기존 화면과 같은 시각 계약 유지

### B2. 주요 흐름 고도화

- 오늘의 기록 작성 속도와 활동 선택 경험
- 나의 활동 탐색, 진행 상태와 상세 연결
- 활동 종료와 AI 초안 검토의 이해도
- CampusLog AI 입력·결과·추천 기록의 위계
- 모바일 내비게이션과 긴 콘텐츠 처리

### B3. 인증·DB UX

- 로그인 / 회원가입 폼
- Track A 인증 contract 기반 route UI와 `components/auth/**` 표현 계층
- 인증 확인 중과 세션 만료
- localStorage 데이터 이전 안내는 Deferred / Optional. 실제 기존 사용자 데이터 보존 요구가 생길 때만 설계
- 동기화, offline, 재연결 상태
- 권한 오류와 데이터 없음 상태

### B4. 품질 검증

- 390×844 모바일
- 1280×720 이상 데스크톱
- 키보드 탐색과 focus 복귀
- 텍스트 대비와 200% 확대
- reduced motion
- loading / empty / error / success / partial success

권장 PR 단위:

1. `design/tokens-and-components`
2. `ux/auth-and-migration`
3. `ux/activity-flow`
4. `ux/campuslog-ai`
5. `design/responsive-accessibility`

## 4. 병렬 개발 계약

| 계약 | Track A 책임 | Track B 책임 |
| --- | --- | --- |
| 인증 상태 | session / error / redirect 제공 | 상태별 화면과 문구 |
| 저장 상태 | pending / success / error / retry 계약 | 사용자 피드백과 입력 보존 |
| 마이그레이션 (Deferred) | 실제 기존 사용자 데이터 보존 요구가 생길 때 대상, 중복, 결과, rollback 제공 | 선택·진행·완료·부분 실패 UX |
| 이전 대상 판별 (Deferred) | 실제 기존 사용자 데이터 보존 요구가 생길 때 사용자 생성 데이터, 샘플·fixture·파싱 실패 제외 사유 제공 | 실제 이전 가능 개수와 제외 안내 |
| AI 결과 | schema, 근거, error code | 결과 위계, 수정·복사·재시도 UX |
| AI 호출 제한 | error code, 입력 상한, `retryAfter`, 중복 요청·멱등성 | 제한 이유, 재시도 가능 시점, 입력 보존 |
| 권한 | RLS와 서버 검증 | 접근 불가와 재로그인 안내 |

공유 타입이나 핵심 컴포넌트 변경 전 담당 PR과 merge 순서를 합의합니다.

## 5. 예상 라우트

v1.1 라우트는 유지합니다.

| Route | 역할 | 단계 |
| --- | --- | --- |
| `/` | 브랜드 진입 | baseline |
| `/dashboard` | 오늘의 기록 | baseline |
| `/activities/new` | 활동 추가 | baseline |
| `/activities/[id]` | 진행 활동 상세와 AI 합성 | baseline |
| `/experiences` | 나의 활동 | baseline |
| `/experiences/**` | 과거 경험 CRUD와 AI 분석 | baseline |
| `/recommend` | AI 기반 활동 추천 | baseline / AI 고도화 |
| `/recommend/history` | 추천 기록 | baseline / AI 고도화 |
| `/login` | 로그인 | 2차 MVP |
| `/signup` | 회원가입 | 2차 MVP |
| `/auth/callback` | OAuth callback 처리 | 2차 MVP |

프로필, 계정 설정, 비밀번호 재설정 route는 실제 2차 MVP 범위가 확정될 때 추가합니다. Google OAuth callback은 인증 기반 작업에 포함합니다.

## 6. 통합 순서

1. 인증과 session contract
2. DB schema, RLS, repository
3. 기존 활동·경험 화면을 repository에 연결
4. AI API 인증, rate limit, 비용 제한
5. AI 경험 분석 v2: STAR, 원본 근거, 부족 정보, 자소서 소재 각도 — 구현 완료
6. 추천 v2: 문항 / JD 요구사항 추출, 경험 Top 3 매칭, 부족 근거 표시 — 구현 완료
7. 답변 초안 생성: 500자 / 800자 / 1000자 자기소개서 + 면접 + 포트폴리오 버전 — 구현 완료
8. 기록 보완 루프: AI 보완 질문, 사용자 답변, 분석 재생성
9. OCR / JD 이미지 입력: 텍스트 흐름 안정화 후 Optional
10. 디자인 시스템과 주요 흐름 polish
11. Vercel + Supabase preview 환경 통합 확인
12. 통합 회귀·보안·접근성·비용 테스트

디자인 Track은 mock contract로 먼저 진행할 수 있지만, API response나 schema를 임의로 확정하지 않습니다. 데이터 Track은 기존 화면을 임의로 단순화하지 않고 상태 계약을 제공합니다.

## 7. 완료 검증

### 기능

- 인증·세션·로그아웃
- 사용자별 데이터 격리
- v1.1 데이터 흐름 회귀 없음
- localStorage 데이터 정책과 구현 일치
- AI 분석·추천 고도화 결과와 저장

### 보안

- RLS / 권한 우회 테스트
- 서버 환경 변수와 service role key 비노출
- 민감 정보 로그 제외
- AI API 인증과 rate limit
- 계정·데이터 삭제 정책 검토

### UX

- 로그인 전후 목적 화면 복귀
- 저장 중 이탈과 오류 복구
- localStorage migration은 Deferred / Optional이며 실제 기존 사용자 데이터 보존 요구가 생길 때만 부분 실패 UX를 검증
- 모바일·데스크톱 주요 흐름
- 키보드·대비·reduced motion

### 배포

- Vercel 환경 변수
- Supabase production 설정
- OpenAI project spend limit / alert
- 오류 관측과 rollback 절차

## 8. 아직 확정하지 않는 항목

- Google OAuth provider 설정 세부값과 callback URL
- 이메일 인증과 비밀번호 재설정 범위
- Supabase 설정과 공유할 비밀번호 validation, 계정 열거 방지 오류 문구 정책
- localStorage 자동 / 수동 마이그레이션은 Deferred / Optional. 자동 이전과 자동 삭제는 하지 않음
- Supabase Storage를 사용할 실제 파일 기능. OCR용 일회성 이미지는 원본 저장 없이 먼저 검토
- 추천 후보 Top 3의 비교 UI 세부 표현
- JD 요구사항 추출 schema, 부족 경험 비교 기준, 보완 답변 저장 위치
- AI model 교체와 평가 dataset
- AI API durable rate limit 저장소, 중복 요청 멱등성 처리 방식, OpenAI spend alert 운영 체크리스트
- 사용자 feedback 저장과 추천 학습 활용

이 항목은 담당자가 임의로 결정하지 않고 `ISSUE_LOG.md` 또는 별도 decision record에서 팀 확인 후 구현합니다.
