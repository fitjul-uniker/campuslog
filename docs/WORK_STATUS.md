# CampusLog Work Status

## 목적

이 문서는 CampusLog의 현재 작업 상태를 한눈에 확인하기 위한 문서입니다. 다른 Codex 계정이나 팀원이 이어서 작업할 때 가장 먼저 확인합니다.

## 프로젝트명

CampusLog

## 현재 단계

- [x] MVP 기획 문서 정리
- [x] 개발 단계 전략 확정
- [x] 1차 MVP 기능 범위 최종 확정
- [x] 문서 정합성 검토 승인 항목 반영
- [x] 프론트엔드 초기 세팅
- [ ] 핵심 화면 구현
- [ ] AI 분석 / 추천 기능 연결
- [ ] MVP 검증

현재 프로젝트는 1차 MVP 프론트엔드 기본 구조를 `main`에 반영한 상태입니다. 다음 구현 단계는 `feature/experience-crud` 범위의 localStorage 기반 경험 CRUD입니다.

## 현재 MVP 방향

CampusLog 1차 MVP는 대학생이 활동 경험을 기록하고, AI가 해당 경험을 분석한 뒤 자기소개서, 포트폴리오, 면접 준비 상황에 맞는 경험을 추천하는 흐름에 집중합니다.

1차 MVP는 4~5주차까지 Next.js, Browser localStorage, `sampleExperiences.ts` 기반 공통 샘플 데이터, OpenAI API, Vercel 배포를 기준으로 만듭니다.

현재 기준 핵심 기능은 아래 3가지입니다.

- 활동 경험 기록
- AI 경험 분석
- AI 경험 추천 및 활용

2026-07-05 멘토링 기준 1차 MVP 구현은 활동 경험 입력 → AI 요약 / 역량 태그 분석 → 활용 문장 생성 / 복사 / 저장 흐름에 집중합니다.

로그인 / 회원가입, 결제, 커뮤니티, 외부 서비스 자동 연동, 파일 첨부, 고급 추천 기능, Supabase, DB, Spring Boot, MySQL, AWS S3는 1차 MVP에서 구현하지 않습니다.

2026-07-03 기준으로 화면 구조와 CTA 흐름을 정리했습니다. 작성 / 수정 화면은 경험 입력과 수정에 집중하고, 저장 후 활동 경험 상세 화면으로 이동합니다. AI 분석 요청은 활동 경험 상세 화면에서 실행합니다.

2026-07-06 기준으로 멘토링 피드백을 반영해 `AGENTS.md` 작업 규칙을 보강했습니다. 보강 내용에는 작업 유형별 기준 문서 확인, 작은 작업 단위 진행, `feature/*` / `docs/*` / `fix/*` 브랜치와 PR 기반 협업, reviewer subagent 분리, 리뷰 심각도 기준, 작업 후 기록 문서 업데이트 규칙이 포함됩니다.

2026-07-09 기준으로 `docs/DESIGN.md`와 `docs/IMPLEMENTATION_PLAN.md`를 확정하고, `feature/base-structure` 작업을 통해 Next.js App Router 기반 프론트엔드 기본 구조를 `main`에 머지했습니다. 현재 앱에는 메인 / 경험 작성 / 경험 상세 / 경험 수정 / AI 분석 결과 / AI 추천 placeholder 라우트, AppShell, Navigation, 공통 스타일, 기본 타입 파일이 있습니다. 실제 경험 CRUD, localStorage 저장, AI API Route 연결은 아직 구현 전입니다.

## 현재 운영 방향

- 전체 MVP를 한 번에 구현하지 않고, 메인 화면처럼 작고 검증 가능한 단위부터 구현합니다.
- 기능별로 브랜치를 만들고 PR 리뷰 후 `main`에 merge하며, `main`은 안정 버전으로 유지합니다.
- 팀원 모두가 개발 경험을 얻을 수 있도록 기능 단위로 작업을 나눕니다.
- Codex가 생성한 코드는 한 줄씩 모두 이해하려 하기보다 사용자 흐름, 주요 파일 역할, 데이터 흐름, 테스트 방법 중심으로 이해합니다.
- 구현을 맡은 에이전트와 코드 리뷰를 맡은 reviewer subagent를 분리하고, 리뷰는 `critical` / `major` / `minor` / `suggestion` 기준으로 정리합니다.
- Codex 작업 전에는 `AGENTS.md`의 작업 규칙과 참고 문서 순서를 먼저 확인합니다.

## 현재 완료된 문서

- [x] `PRD.md`
- [x] `README.md`
- [x] `AGENTS.md` (v3 작업 규칙 보강 완료)
- [x] `docs/USER_FLOW.md`
- [x] `docs/IA.md`
- [x] `docs/SCREEN_SPEC.md`
- [x] `docs/DESIGN.md`
- [x] `docs/IMPLEMENTATION_PLAN.md`
- [x] `docs/GIT_WORKFLOW.md`
- [x] `docs/WORK_STATUS.md`
- [x] `docs/TODO.md`
- [x] `docs/ISSUE_LOG.md`
- [x] `docs/TASK_LOG.md`

사용자 흐름 문서는 `docs/USER_FLOW.md`를 기준으로 확인합니다.

## 현재 완료된 개발 작업

- `frontend/` Next.js App Router 기본 설정
- 메인 / 경험 작성 / 경험 상세 / 경험 수정 / AI 분석 결과 / AI 추천 placeholder 라우트
- `AppShell`, `Navigation` 기본 레이아웃
- `frontend/src/app/globals.css` 공통 스타일
- `frontend/src/lib/types.ts`, `frontend/src/lib/utils.ts` 기본 파일

현재 구현은 `feature/base-structure` 단계입니다. 실제 경험 저장 / 수정 / 삭제, AI 분석 요청, AI 추천 요청은 아직 동작하지 않습니다.

## 아직 시작하지 않은 작업

- localStorage 기반 경험 CRUD 구현
- `sampleExperiences.ts` 작성과 초기 화면 자동 주입 여부 결정
- 활동 경험 목록 / 작성 / 수정 / 상세 화면 실제 동작 구현
- 활동 경험 상세 화면에서 AI 분석 요청 CTA 구현
- 작성 / 수정 화면 저장 후 활동 경험 상세로 이동하는 흐름 구현
- AI 경험 분석 결과 화면 구현
- AI 경험 추천 및 활용 화면 구현
  - 추천 결과 localStorage 저장 구현 (첫 구현에서는 복사 기능보다 낮은 2순위)
- OpenAI API 연결 방식 검토
- Vercel 배포 준비

## 다음 작업자가 먼저 확인해야 할 문서

1. `PRD.md`
2. `docs/USER_FLOW.md`
3. `docs/IA.md`
4. `docs/SCREEN_SPEC.md`
5. `README.md`
6. `AGENTS.md`
7. `docs/GIT_WORKFLOW.md`
8. `docs/TODO.md`
9. `docs/ISSUE_LOG.md`
10. `docs/TASK_LOG.md`

## 다음 추천 작업

- [ ] `feature/experience-crud` 브랜치에서 localStorage 기반 경험 CRUD 구현
- [ ] `sampleExperiences.ts` 작성과 초기 주입 여부 결정
- [ ] 활동 경험 작성 저장 후 상세 화면 이동 구현
- [ ] 활동 경험 상세 / 수정 / 삭제 흐름 구현
- [ ] 경험 수정 시 `재분석 필요` 상태 처리
- [ ] Vercel 배포 준비

## 주의사항

- `PRD.md`의 MVP 범위와 제외 기능을 우선 기준으로 봅니다.
- 1차 MVP 기능 범위는 확정되었으므로 임의로 기능 우선순위를 바꾸지 않습니다.
- 로그인, 회원가입, 결제, 커뮤니티, 외부 서비스 자동 연동, 파일 첨부, 고급 추천 기능, Supabase, DB, Spring Boot 백엔드, MySQL 구축, AWS S3는 1차 MVP 제외 범위입니다.
- Supabase Auth / Postgres / Storage는 2차 MVP로 보류되었습니다.
- Spring Boot, MySQL 또는 AWS RDS, AWS S3는 UNIKER 이후 3차 확장으로 보류되었습니다.
- 작성 / 수정 화면에서는 AI 분석 요청을 바로 실행하지 않고, 저장 후 활동 경험 상세 화면에서 AI 분석 요청을 실행합니다.
- API Key, 토큰, 비밀번호 등 민감한 정보는 문서나 코드에 직접 작성하지 않습니다.
- 실제 사용자 개인정보나 민감한 활동 기록을 샘플 데이터로 사용하지 않습니다.
- 기존 문서를 수정할 때는 수정 이유와 변경 내용을 `docs/TASK_LOG.md`에 남깁니다.
