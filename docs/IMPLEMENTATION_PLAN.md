# CampusLog 2차 MVP 구현 계획

## 0. 문서 상태

- v1.1 고도화: 구현·검증 완료, commit / review / merge 예정
- 현재 활성 계획 단계: 2차 MVP. 기능 구현은 v1.1 merge 후 시작
- 단계 기준: `docs/CURRENT_PHASE.md`
- 제품 기준: `PRD.md`
- 이 문서는 두 병렬 Track의 개발 순서와 통합 계약을 정합니다.

## 1. 전환 순서

```text
v1.1 변경 검증
→ 논리적 commit
→ push / Draft PR / 팀 리뷰
→ main merge와 v1.1 기준선 확인
→ 2차 MVP Track별 브랜치 생성
→ 계약 우선 구현
→ 기능 및 디자인 병렬 고도화
→ 통합·보안·사용자 테스트
```

v1.1 브랜치에는 2차 MVP의 인증·DB 기능을 섞지 않습니다. 2차 MVP 기능은 v1.1 merge 이후 최신 `main`에서 분리한 작은 브랜치로 진행합니다.

## 2. Track A — 인증·데이터·AI

담당: 다른 팀원

### A1. 인증 기반

- Supabase project와 환경 변수 정책
- 회원가입, 로그인, 로그아웃
- 세션 확인과 복구
- 보호 라우트와 redirect 정책
- 사용자 식별자 기준 데이터 소유권
- RLS 정책과 권한 테스트

권장 PR 단위:

1. `feature/auth-foundation`
2. `feature/auth-contract`
3. `feature/protected-routes`

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
3. `feature/user-data-sync`

### A3. localStorage 데이터 전환

- 로그인 전 기존 브라우저 데이터 탐지
- 마이그레이션 가능 여부와 대상 개수 계산
- 번들 샘플·개발 fixture·파싱 실패 항목 판별과 이전 대상 제외
- 제외된 항목 수와 사유를 Track B가 표시할 수 있는 결과 contract 제공
- 사용자 확인 후 계정 데이터로 이전
- 중복 키와 연결 관계 보존
- 성공 전 localStorage 원본 삭제 금지
- 부분 실패와 재시도 지원
- 동일 작업 반복 시 중복 생성 방지

정책이 확정되기 전 자동 이전이나 자동 삭제를 구현하지 않습니다.

### A4. AI 분석·추천 고도화

- 분석 입력과 결과 schema 검토
- 추천 후보 선택과 상세 생성의 근거 일치 유지
- 결과 근거와 사용된 활동 표시 강화
- 실패, timeout, 재시도, 저장 실패 계약 통일
- 사용자별 AI 호출 인증
- rate limit과 OpenAI spend limit / alert
- 기존 활동 종료 합성 API의 사용자 소유권 확인, 호출 제한, 초안 보존과 완료 경험 생성 멱등성 회귀 검증
- 모델명과 prompt version 기록 검토

여러 추천 후보, 비교, feedback 학습 등은 PRD에서 범위를 확정한 뒤 구현합니다.

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
- localStorage 데이터 이전 안내
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
| 마이그레이션 | 대상, 중복, 결과, rollback | 선택·진행·완료·부분 실패 UX |
| 이전 대상 판별 | 사용자 생성 데이터, 샘플·fixture·파싱 실패 제외 사유 | 실제 이전 가능 개수와 제외 안내 |
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

프로필, 계정 설정, 비밀번호 재설정, OAuth route는 실제 2차 MVP 범위가 확정될 때 추가합니다.

## 6. 통합 순서

1. 인증과 session contract
2. DB schema, RLS, repository
3. 기존 데이터 read 호환
4. localStorage migration 정책과 UX
5. 기존 활동·경험 화면을 repository에 연결
6. AI API 인증과 결과 고도화
7. 디자인 시스템과 주요 흐름 polish
8. 통합 회귀·보안·접근성·비용 테스트

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
- migration 부분 실패
- 모바일·데스크톱 주요 흐름
- 키보드·대비·reduced motion

### 배포

- Vercel 환경 변수
- Supabase production 설정
- OpenAI project spend limit / alert
- 오류 관측과 rollback 절차

## 8. 아직 확정하지 않는 항목

- OAuth provider
- 이메일 인증과 비밀번호 재설정 범위
- Supabase 설정과 공유할 비밀번호 validation, 계정 열거 방지 오류 문구 정책
- localStorage 자동 / 수동 마이그레이션 최종 정책
- Supabase Storage를 사용할 실제 파일 기능
- 여러 추천 후보 수와 비교 UI
- AI model 교체와 평가 dataset
- AI API별 입력 상한, 제한 초과 error code, `retryAfter`, 중복 요청 처리 계약
- 사용자 feedback 저장과 추천 학습 활용

이 항목은 담당자가 임의로 결정하지 않고 `ISSUE_LOG.md` 또는 별도 decision record에서 팀 확인 후 구현합니다.
