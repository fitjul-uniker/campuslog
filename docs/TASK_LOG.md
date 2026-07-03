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
| 작업 요약 | CampusLog 개발 단계를 1차 MVP, 2차 MVP, 3차 확장으로 확정하고 문서 전반에 일관되게 반영 |
| 수정한 파일 | `PRD.md`, `README.md`, `AGENTS.md`, `docs/USER_FLOW.md`, `docs/IA.md`, `docs/SCREEN_SPEC.md`, `docs/WORK_STATUS.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`, `docs/TASK_LOG.md` |
| 변경 내용 | 1차 MVP는 Next.js, Browser localStorage, `sampleExperiences.ts`, OpenAI API, Vercel 기준으로 명확화. Supabase는 2차 MVP 확장 예정, Spring Boot / MySQL / AWS S3는 UNIKER 이후 3차 확장으로 분리 |
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
