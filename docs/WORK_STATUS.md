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

현재 브랜치는 `feature/auth-foundation`입니다. 최신 `main`에서 fast-forward pull을 확인한 뒤 분기했고, Supabase Auth 기반 인증 뼈대 구현과 로컬 검증을 완료했습니다.

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
- 기존 localStorage 데이터 이전 정책과 repository 구조
- AI 분석·추천 정확도, 근거, 결과 구조 고도화
- JD 원문·직무 요구사항·우대사항 기반 경험 추천과 부족 경험 비교
- 질문 이미지 OCR / vision 입력과 답변 초안 생성
- 인증된 API, rate limit, 비용 한도, 오류 관측성

### Track B. 디자인·사용자 경험 고도화

담당: 사용자

- 현재 검정·차콜 디자인 시스템 고도화
- 로그인·회원가입·데이터 이전 UX
- 오늘의 기록, 나의 활동, CampusLog AI 사용성 개선
- loading / empty / error / success / offline 상태
- 모바일·데스크톱 반응형, 키보드 접근성, 대비, reduced motion

## 다음 작업 순서

1. `feature/auth-foundation` PR을 main에 반영
2. 최신 main에서 DB schema / RLS 브랜치 시작
3. Experience / TrackedActivity / DailyLog / SynthesisDraft / Analysis / Recommendation 테이블과 사용자 소유권 정의
4. repository 경계를 만들고 현재 localStorage read/write를 계정별 DB 저장으로 교체
5. localStorage migration 정책과 UX 연결
6. AI API 인증, rate limit, 비용 제한 적용
7. 인증·DB 전환이 안정화된 뒤 JD / OCR / 답변 초안 AI 고도화 진행
8. 통합 회귀·보안·비용·접근성 검증

## 활성 기준 문서

1. `docs/CURRENT_PHASE.md`
2. `PRD.md`
3. `docs/USER_FLOW.md`
4. `docs/IA.md`
5. `docs/SCREEN_SPEC.md`
6. `docs/DESIGN.md`
7. `docs/IMPLEMENTATION_PLAN.md`
8. `docs/AUTH_CONTRACT.md`
9. `docs/TODO.md`
10. `docs/ISSUE_LOG.md`
11. `docs/TASK_LOG.md`

`docs/archive/**`는 과거 기준선과 회귀 확인용이며 현재 2차 MVP 구현을 제한하지 않습니다.

## 남은 위험

- 이메일 확인·비밀번호 재설정, Google OAuth callback과 동일 이메일 계정 연결 정책 미확정
- 비밀번호 validation과 계정 열거 방지 오류 문구 contract 미확정
- Supabase 기본 email provider signup rate limit 때문에 개발 테스트용 SMTP / confirm email 정책 결정 필요
- localStorage → DB 마이그레이션 충돌·중복·삭제 정책 미확정
- 활동 종료 합성 초안 RLS·보존·완료 Experience 멱등 저장 구현 필요
- RLS와 다른 사용자 데이터 접근 방지 검증 필요
- 공개 AI API rate limit과 비용 한도 필요
- JD 원문·질문 이미지 OCR·부족 경험 비교·답변 초안의 AI 품질 평가 기준 필요
- OCR 이미지 원본 저장 여부와 Supabase Storage 도입 범위 미확정
- Track 간 공통 파일 충돌과 merge 순서 관리 필요

## Git 상태 주의

v1.1 checkpoint는 main에 병합되었습니다. 2차 MVP 기능은 `main`에 직접 추가하지 않고, 최신 main에서 작은 기능 브랜치로 진행합니다.
