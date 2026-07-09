# CampusLog Task Log

## 목적

이 문서는 날짜별 작업 기록을 남기고, 어떤 파일을 왜 수정했는지 추적하기 위한 문서입니다.

## 작성 규칙

- 작업이 끝날 때마다 최신 항목을 위에 추가합니다.
- 문서, 코드, 설정 파일 변경을 모두 기록합니다.
- 검증하지 못한 내용은 "미검증"으로 명확히 적습니다.
- 실제 개인정보, API Key, 토큰, 비밀번호는 기록하지 않습니다.

## 로그 템플릿

```md
### YYYY-MM-DD - 작업 제목

| 항목 | 내용 |
| --- | --- |
| 날짜 | YYYY-MM-DD |
| 작업자 | 이름 또는 Codex |
| 작업 요약 |  |
| 수정한 파일 |  |
| 변경 내용 |  |
| 검증한 내용 |  |
| 남은 작업 |  |
| 관련 커밋 메시지 |  |
```

## 작업 로그

### 2026-07-09 - PR 언어 규칙 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | 커밋 메시지와 PR 제목은 영어로 유지하되, PR 본문은 한국어로 작성하도록 `AGENTS.md`와 `docs/GIT_WORKFLOW.md`의 협업 규칙을 보강 |
| 수정한 파일 | `AGENTS.md`, `docs/GIT_WORKFLOW.md`, `docs/TASK_LOG.md` |
| 변경 내용 | `AGENTS.md`의 Git / PR 규칙에 커밋 메시지와 PR 제목은 영어, PR 본문은 한국어라는 기준을 추가. `docs/GIT_WORKFLOW.md`의 PR 생성 절차에도 같은 기준을 명시 |
| 검증한 내용 | `AGENTS.md`와 `docs/GIT_WORKFLOW.md`의 PR 언어 규칙이 서로 충돌하지 않는지 확인하고 `git diff --check`로 문서 형식을 점검 |
| 남은 작업 | 다음 PR부터 본문은 한국어, 제목과 커밋 메시지는 영어로 작성 |
| 관련 커밋 메시지 | `docs: clarify PR language rules` |

### 2026-07-09 - localStorage 기반 경험 CRUD 구현

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | `feature/experience-crud` 범위로 활동 경험 작성, 목록, 상세, 수정, 삭제 흐름을 Browser localStorage 기반으로 구현하고, 생성일 / 수정일 표시와 활동기간 입력 폼을 정리 |
| 수정한 파일 | `web/src/lib/storage.ts`, `web/src/lib/date.ts`, `web/src/lib/sampleExperiences.ts`, `web/src/app/page.tsx`, `web/src/app/experiences/new/page.tsx`, `web/src/app/experiences/[id]/page.tsx`, `web/src/app/experiences/[id]/edit/page.tsx`, `web/src/app/experiences/[id]/analysis/page.tsx`, `web/src/app/globals.css`, `web/src/components/common/EmptyState.tsx`, `web/src/components/common/StatusBadge.tsx`, `web/src/components/experiences/*`, `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md` |
| 변경 내용 | `campuslog:v1:*` storage key를 유지하며 경험 CRUD, 분석 / 추천 결과 저장 기본 구조, JSON parse fallback, SSR window guard를 구현. 새 경험 저장 후 상세 이동, 수정 후 상세 이동, 삭제 시 경험 / 분석 / 추천 참조 정리, 최근 수정순 목록 표시, 필수값 검증을 연결. 활동기간은 시작월 / 종료월 입력 폼으로 받고 기존 `period` 문자열 저장 구조를 유지. 생성 직후에는 생성일만 표시하고 실제 수정 이후에만 수정일을 표시하도록 변경 |
| 검증한 내용 | `cd web && npm run lint`, `cd web && npm run build`, `git diff --check` 통과. dev server에서 `/`, `/experiences/new`, `/experiences/[id]`, `/experiences/[id]/edit`, `/experiences/[id]/analysis` 흐름을 수동 확인 |
| 남은 작업 | `/api/analyze`와 OpenAI API 기반 AI 분석 요청 / 결과 저장 구현, `/api/recommend`와 AI 추천 구현, 정렬 / 필터 UI 및 실제 동작 구현, Vercel 배포 준비 |
| 관련 커밋 메시지 | `feature: add localStorage experience CRUD` |

### 2026-07-09 - 프로젝트 구조와 기술 방향 문서 정합성 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | UNIKER 1차/2차 MVP를 Next.js Full Stack 기준으로 정리하고, 기존 프론트엔드 경로를 `web/`으로 변경했으며, 별도 백엔드 폴더를 사용하지 않는 방향을 문서에 반영 |
| 수정한 파일 | `AGENTS.md`, `README.md`, `PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/TASK_LOG.md`, `docs/DESIGN.md`, `docs/WORK_STATUS.md`, `docs/IA.md`, `docs/USER_FLOW.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/SCREEN_SPEC.md` |
| 변경 내용 | 1차 MVP는 `web/`의 Next.js Full Stack 앱과 App Router API Routes 기준으로 정리. 2차 MVP는 Next.js Full Stack + Supabase 기반으로 정리. Spring Boot / MySQL / AWS RDS / AWS S3는 CampusLog 본 MVP가 아니라 UNIKER 이후 개인 Backend Portfolio Edition에서 별도 검토하는 항목으로 분리 |
| 검증한 내용 | 전체 Markdown 문서에서 기존 프론트엔드 / 백엔드 폴더 경로, `Spring Boot`, `MySQL`, `AWS RDS`, `AWS S3` 표현을 검색하고 남은 표현의 맥락을 확인 |
| 남은 작업 | 후속 기능 구현 시 `web/` 기준으로 작업하고, 별도 백엔드 폴더를 만들지 않도록 유지 |
| 관련 커밋 메시지 | `docs: align project structure and MVP stack` |

### 2026-07-09 - 작업 기록 문서 최신화

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | 2026-07-09에 진행된 디자인 확정, 구현 계획 작성, 프론트엔드 기본 구조 구현, 브랜치 정리 규칙 추가 작업이 기록 문서에 반영되지 않은 상태를 확인하고 작업 상태 문서를 최신화 |
| 수정한 파일 | `docs/TASK_LOG.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/ISSUE_LOG.md` |
| 변경 내용 | 오늘 커밋 이력을 기준으로 완료된 문서 / 기본 구조 작업을 `TASK_LOG.md`와 `TODO.md`에 반영. `WORK_STATUS.md`의 현재 단계와 완료된 개발 작업을 프론트엔드 기본 구조 머지 상태로 수정. `IMPLEMENTATION_PLAN.md`에 남아 있던 확인 필요 사항 중 후속 결정이 필요한 항목을 `ISSUE_LOG.md`에 추가 |
| 검증한 내용 | `git log --since='2026-07-09 00:00:00'`, `git show --stat`, `docs/IMPLEMENTATION_PLAN.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/ISSUE_LOG.md`, `AGENTS.md`를 확인 |
| 남은 작업 | 이후 작업부터는 실제 변경이 끝날 때 `docs/TASK_LOG.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/ISSUE_LOG.md` 갱신 필요 여부를 완료 단계에서 먼저 점검 |
| 관련 커밋 메시지 | `docs: update project status logs` |

### 2026-07-09 - 프론트엔드 기본 구조 구현

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | `feature/base-structure` 범위로 Next.js App Router 기반 프론트엔드 골격을 만들고 기본 라우트, AppShell, Navigation, 공통 스타일, 타입 파일을 추가 |
| 수정한 파일 | `web/package.json`, `web/package-lock.json`, `web/next.config.ts`, `web/eslint.config.mjs`, `web/tsconfig.json`, `web/next-env.d.ts`, `web/src/app/layout.tsx`, `web/src/app/page.tsx`, `web/src/app/globals.css`, `web/src/app/experiences/new/page.tsx`, `web/src/app/experiences/[id]/page.tsx`, `web/src/app/experiences/[id]/edit/page.tsx`, `web/src/app/experiences/[id]/analysis/page.tsx`, `web/src/app/recommend/page.tsx`, `web/src/components/layout/AppShell.tsx`, `web/src/components/layout/Navigation.tsx`, `web/src/lib/types.ts`, `web/src/lib/utils.ts` |
| 변경 내용 | 메인 / 경험 작성 / 경험 상세 / 경험 수정 / AI 분석 결과 / AI 추천 라우트의 placeholder 화면을 만들고, 좌측 사이드바형 앱 셸과 모바일 상단 내비게이션의 기본 구조를 추가. `lucide-react`, Next.js, React, TypeScript 기반 설정과 공통 스타일 토큰을 준비 |
| 검증한 내용 | 커밋 `9c789f5 feature: add frontend base structure`의 변경 파일과 `web/src` 구조를 확인. 실제 브라우저 실행 검증은 이 기록 보강 작업에서는 미검증 |
| 남은 작업 | `feature/experience-crud`에서 localStorage 기반 경험 CRUD, `sampleExperiences.ts`, 상세 / 작성 / 수정 실제 동작 구현 필요 |
| 관련 커밋 메시지 | `feature: add frontend base structure` |

### 2026-07-09 - 디자인 / 구현 계획 및 작업 규칙 반영

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-09 |
| 작업자 | Codex |
| 작업 요약 | 1차 MVP의 디자인 방향을 확정하고, 구현 단계 / 브랜치 / PR 단위 / 위험 요소 / 확인 필요 사항을 `docs/IMPLEMENTATION_PLAN.md`에 정리. PR merge 후 작업 브랜치 정리 여부를 사용자에게 먼저 묻는 규칙을 `AGENTS.md`에 추가 |
| 수정한 파일 | `docs/DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md`, `AGENTS.md` |
| 변경 내용 | 노트 / 단권화 컨셉, 캠퍼스 그린 + 민트 색상 방향, 좌측 사이드바형 대시보드, App Router 라우트 구조, localStorage 설계, AI API Route 설계, 7/9~7/16 개발 로드맵을 정리. 작업 완료 후 브랜치 삭제 전 사용자 확인 규칙을 추가 |
| 검증한 내용 | 커밋 `e0ac8df`, `4465da7`, `0fad08b`, `16e3906`의 변경 파일과 문서 내용을 확인 |
| 남은 작업 | 구현 계획의 확인 필요 사항을 후속 작업 전에 결정하고, 실제 기능 구현은 `feature/experience-crud`부터 진행 |
| 관련 커밋 메시지 | `docs: finalize MVP design direction`, `docs: add CampusLog implementation plan`, `docs: clarify MVP implementation plan`, `docs: add branch cleanup prompt rule` |

### 2026-07-06 - AGENTS 작업 규칙 멘토링 피드백 반영

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-06 |
| 작업자 | Codex |
| 작업 요약 | 멘토링 피드백을 반영해 Codex가 CampusLog 작업 중 기준 문서, 작업 단위, 브랜치 / PR 협업, 리뷰 역할, 완료 보고를 더 명확히 따르도록 `AGENTS.md` 작업 규칙을 보강 |
| 수정한 파일 | `AGENTS.md` |
| 변경 내용 | 작업 유형별 참고 문서 순서를 추가하고, 전체 MVP를 한 번에 구현하지 않는 작은 단위 개발 원칙을 명시. `feature/*`, `docs/*`, `fix/*` 브랜치와 PR 기반 협업 규칙을 강화하고, 구현 에이전트와 reviewer subagent 분리 규칙 및 `critical` / `major` / `minor` / `suggestion` 리뷰 기준을 추가. 작업 후 요약 항목과 기록 문서 업데이트 규칙을 보강하고, 1차 MVP 범위 제한을 다시 강조 |
| 검증한 내용 | `AGENTS.md`, `PRD.md`, `README.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/GIT_WORKFLOW.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`를 확인하고 `git diff --check`로 문서 변경 상태를 점검 |
| 남은 작업 | 다음 개발 작업은 `AGENTS.md`의 작업 유형별 문서 확인 순서와 작은 브랜치 / PR 흐름에 맞춰 진행 |
| 관련 커밋 메시지 | `docs: strengthen AGENTS working rules` |

### 2026-07-05 - 멘토링 후 개발 / 협업 운영 방향 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-05 |
| 작업자 | Codex |
| 작업 요약 | 멘토링에서 정리된 1차 MVP 개발 순서, 브랜치 / PR 협업 방식, Codex 코드 이해와 리뷰 기준, 다음 액션을 팀 작업 기록에 남김 |
| 수정한 파일 | `docs/TASK_LOG.md`, `docs/WORK_STATUS.md` |
| 변경 내용 | 전체 MVP를 한 번에 구현하지 않고 메인 화면처럼 작고 검증 가능한 단위부터 진행하기로 정리. 기능별 브랜치 생성, PR 리뷰 후 `main` merge, `main` 안정 버전 유지, 팀원별 기능 단위 분담 원칙을 기록. Codex가 생성한 코드는 한 줄씩 모두 해석하기보다 사용자 흐름, 주요 파일 역할, 데이터 흐름, 테스트 방법 중심으로 이해하고, 구현 에이전트와 reviewer subagent를 분리해 `critical` / `major` / `minor` / `suggestion` 기준으로 리뷰하기로 정리. 2026-07-07 라이브 강의 이후 `DESIGN.md`를 확정하고 첫 화면 구현을 시작하며, 1차 MVP는 활동 경험 입력 → AI 요약 / 역량 태그 분석 → 활용 문장 생성 / 복사 / 저장 흐름에 집중하고 로그인, 결제, 커뮤니티, 외부 서비스 자동 연동, 파일 첨부, 고급 추천 기능은 제외하기로 기록 |
| 검증한 내용 | `AGENTS.md`, `docs/TASK_LOG.md`, `docs/WORK_STATUS.md`, `docs/ISSUE_LOG.md`, `docs/GIT_WORKFLOW.md`를 확인하고 기존 기록 방식과 충돌하지 않도록 반영 |
| 남은 작업 | 2026-07-07 라이브 강의 이후 `DESIGN.md`를 확정하고, 첫 화면 구현 작업을 별도 기능 브랜치에서 시작 |
| 관련 커밋 메시지 | `docs: record mentoring operation decisions` |

### 2026-07-03 - 기획 문서 정합성 승인 항목 반영

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-03 |
| 작업자 | Codex |
| 작업 요약 | CampusLog 기획 문서 간 화면 구조, AI 분석 요청 위치, 분석 결과 의미, 추천 범위, 추천 결과 저장 우선순위 표현을 승인 항목 기준으로 정리 |
| 수정한 파일 | `README.md`, `PRD.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md` |
| 변경 내용 | 활동 경험 상세 화면을 독립 화면으로 명확화하고, 작성 / 수정 저장 후 상세 이동 및 상세 화면에서 AI 분석 요청 흐름으로 통일. 분석 결과는 특정 활동 경험에 연결된 localStorage 저장 기록으로 정리. AI 경험 추천 및 활용은 저장된 경험 전체와 분석 결과 기준으로 가장 적합한 경험 1개를 추천하는 흐름으로 정리 |
| 검증한 내용 | 문서 간 용어와 1차 MVP 제외 범위가 충돌하지 않는지 검색으로 확인 |
| 남은 작업 | Next.js 프론트엔드 초기 세팅, LocalStorage 데이터 구조 설계, 활동 경험 상세 화면과 AI 분석 요청 CTA 구현 |
| 관련 커밋 메시지 | `docs: align MVP planning flow` |

### 2026-07-01 - 개발 단계 전략 문서 반영

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-07-01 |
| 작업자 | Codex |
| 작업 요약 | CampusLog 개발 단계를 1차 MVP, 2차 MVP, UNIKER 이후 개인 Backend Portfolio Edition으로 정리하고 문서 전반에 일관되게 반영 |
| 수정한 파일 | `PRD.md`, `README.md`, `AGENTS.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/WORK_STATUS.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/TASK_LOG.md` |
| 변경 내용 | 1차 MVP는 Next.js, Browser localStorage, `sampleExperiences.ts`, OpenAI API, Vercel 기준으로 명확화. Supabase는 2차 MVP 확장 예정, Spring Boot / MySQL / AWS S3는 UNIKER 이후 개인 Backend Portfolio Edition으로 분리 |
| 검증한 내용 | 요청 기준 문서 전체를 먼저 확인하고, 1차 MVP 범위가 활동 경험 기록, AI 경험 분석, AI 경험 추천 및 활용으로 유지되는지 점검 |
| 남은 작업 | Next.js 프론트엔드 초기 세팅, LocalStorage 데이터 구조 설계, `sampleExperiences.ts` 샘플 데이터 설계, Vercel 배포 준비 |
| 관련 커밋 메시지 | `docs: clarify phased MVP roadmap` |

### 2026-06-30 - 사용자 흐름 문서 파일명 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-06-30 |
| 작업자 | Codex |
| 작업 요약 | `FLOW.md`를 `USER_FLOW.md`로 파일명 변경 |
| 수정한 파일 | `docs/USER_FLOW.md`, `README.md`, `AGENTS.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md` |
| 변경 내용 | 운영진 요구 파일명에 맞춰 사용자 흐름 문서 파일명과 관련 기준 문서 참조를 `USER_FLOW.md` 기준으로 정리 |
| 검증한 내용 | 프로젝트 내 `FLOW.md` 참조를 검색하고 활성 기준 문서 참조가 `USER_FLOW.md`로 바뀌었는지 확인 |
| 남은 작업 | MVP 기능 범위 최종 확정, 구현 시작 전 화면 구현 순서 정리 |
| 관련 커밋 메시지 | `docs: rename user flow document` |

### 2026-06-30 - GitHub 협업 규칙 문서 추가

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-06-30 |
| 작업자 | Codex |
| 작업 요약 | CampusLog 팀이 GitHub에서 안전하게 협업하기 위한 브랜치, PR, 커밋, Codex 작업 규칙 문서를 추가 |
| 수정한 파일 | `docs/GIT_WORKFLOW.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/TODO.md` |
| 변경 내용 | GitHub 협업 규칙 문서를 새로 작성하고, 완료 문서 목록과 TODO 상태를 업데이트 |
| 검증한 내용 | `PRD.md`, `README.md`, `AGENTS.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`를 확인 |
| 남은 작업 | MVP 기능 범위 최종 확정, 구현 시작 전 화면 구현 순서 정리 |
| 관련 커밋 메시지 | `docs: add GitHub workflow guide` |

### 2026-06-30 - 작업 상태 기록 문서 추가

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-06-30 |
| 작업자 | Codex |
| 작업 요약 | CampusLog 프로젝트의 작업 상태, 작업 로그, TODO, 이슈 관리를 위한 문서 4개를 추가 |
| 수정한 파일 | `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md` |
| 변경 내용 | 현재 문서 정리 단계 상태를 기록하고, 다음 작업자가 바로 이어서 사용할 수 있는 템플릿과 초기 항목을 작성 |
| 검증한 내용 | `PRD.md`, `README.md`, `AGENTS.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`를 기준 문서로 확인 |
| 남은 작업 | MVP 기능 범위 최종 확정, GitHub 협업 규칙 문서 작성, 구현 시작 전 화면 구현 순서 정리 |
| 관련 커밋 메시지 | `docs: add work tracking templates` |
