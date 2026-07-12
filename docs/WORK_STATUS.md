# CampusLog Work Status

## 현재 단계

- [x] 1차 MVP 핵심 흐름 구현
- [x] v1.1 진행형 경험 기록·캘린더·AI 완료 경험 합성 고도화
- [x] v1.1 정적 검사, production build, 데스크톱·모바일 브라우저 검증
- [x] 2차 MVP 단계와 두 작업 Track 문서화
- [x] v1.1 commit / push / Draft PR #27
- [ ] 팀 리뷰와 main merge
- [ ] 2차 MVP 기능 브랜치 시작

현재 브랜치는 `feature/progressive-experience-tracking`입니다. v1.1 전체 변경은 `e21a864`로 commit하고 원격 branch에 push했으며, 팀 저장소의 Draft PR #27에서 review / merge를 기다리고 있습니다.

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
- Supabase Auth / Postgres와 사용자별 데이터 격리
- 기존 localStorage 데이터 이전 정책과 repository 구조
- AI 분석·추천 정확도, 근거, 결과 구조 고도화
- 인증된 API, rate limit, 비용 한도, 오류 관측성

### Track B. 디자인·사용자 경험 고도화

담당: 사용자

- 현재 검정·차콜 디자인 시스템 고도화
- 로그인·회원가입·데이터 이전 UX
- 오늘의 기록, 나의 활동, CampusLog AI 사용성 개선
- loading / empty / error / success / offline 상태
- 모바일·데스크톱 반응형, 키보드 접근성, 대비, reduced motion

## 다음 작업 순서

1. Draft PR #27 팀 리뷰와 필요한 수정 반영
2. 승인 후 main merge
3. 최신 main에서 Track별 브랜치 생성
4. 인증·DB contract와 인증 UX를 먼저 합의
5. 각 Track 작은 PR로 병렬 진행
6. 통합 회귀·보안·비용·접근성 검증

## 활성 기준 문서

1. `docs/CURRENT_PHASE.md`
2. `PRD.md`
3. `docs/USER_FLOW.md`
4. `docs/IA.md`
5. `docs/SCREEN_SPEC.md`
6. `docs/DESIGN.md`
7. `docs/IMPLEMENTATION_PLAN.md`
8. `docs/TODO.md`
9. `docs/ISSUE_LOG.md`
10. `docs/TASK_LOG.md`

`docs/archive/**`는 과거 기준선과 회귀 확인용이며 현재 2차 MVP 구현을 제한하지 않습니다.

## 남은 위험

- 이메일 확인·비밀번호 재설정·OAuth의 세부 인증 범위 미확정
- 비밀번호 validation과 계정 열거 방지 오류 문구 contract 미확정
- localStorage → DB 마이그레이션 충돌·중복·삭제 정책 미확정
- 활동 종료 합성 초안 RLS·보존·완료 Experience 멱등 저장 구현 필요
- RLS와 다른 사용자 데이터 접근 방지 검증 필요
- 공개 AI API rate limit과 비용 한도 필요
- AI 고도화 품질 평가 기준 필요
- Track 간 공통 파일 충돌과 merge 순서 관리 필요

## Git 상태 주의

v1.1 checkpoint는 commit·push·Draft PR까지 완료했습니다. PR #27이 main에 merge되기 전에는 이 브랜치에 2차 MVP 기능을 추가하지 않고 리뷰 수정만 반영합니다. merge와 이후 브랜치 정리는 팀과 사용자의 승인 후 진행합니다.
