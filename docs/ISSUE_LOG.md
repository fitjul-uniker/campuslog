# CampusLog Issue Log

## 목적

이 문서는 CampusLog 프로젝트의 문제, 버그, 의사결정 보류 사항을 기록하기 위한 문서입니다.

## 상태 기준

- `Open`: 아직 결정 또는 해결되지 않음
- `In Progress`: 논의 또는 해결 진행 중
- `Resolved`: 결정 또는 해결 완료
- `Deferred`: 현재 1차 MVP 이후로 보류

## 유형 기준

- `Decision`: 팀 의사결정 필요
- `Bug`: 구현 후 발견된 버그
- `Risk`: 일정, 범위, 기술 선택 관련 위험
- `Question`: 추가 확인 필요

## 이슈 목록

| 이슈 ID | 상태 | 우선순위 | 유형 | 내용 | 결정 필요 사항 | 해결 내용 | 담당자 | 기록일 | 해결일 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ISSUE-001 | Resolved | High | Decision | MVP 기능 범위 최종 확정 필요 | 10주 MVP에서 반드시 구현할 기능과 제외할 기능 확정 | 1차 MVP 범위를 활동 경험 기록, AI 경험 분석, AI 경험 추천 및 활용 지원으로 확정. 로그인 / 회원가입, DB, Supabase, Spring Boot, 파일 업로드는 1차 MVP에서 제외 | Codex | 2026-06-30 | 2026-07-01 |
| ISSUE-002 | Resolved | Medium | Decision | USER_FLOW.md 파일명 정리 완료 | 사용자 흐름 문서 파일명 정리 | 운영진 요구 파일명에 맞춰 FLOW.md를 USER_FLOW.md로 변경 | Codex | 2026-06-30 | 2026-06-30 |
| ISSUE-003 | Open | Medium | Decision | 추천 결과 저장 기능을 1차 구현에 포함할지 결정 필요 | 추천 결과 저장을 첫 구현에 포함할지, 복사 기능 이후 2순위로 둘지 결정 | - | 미정 | 2026-06-30 | - |
| ISSUE-004 | Resolved | Medium | Decision | LocalStorage만 사용할지 SQLite까지 고려할지 결정 필요 | 1차 MVP에서는 LocalStorage만 사용할지, SQLite 도입 가능성을 검토할지 결정 | 1차 MVP는 Browser localStorage만 사용하고 SQLite는 도입하지 않음 | Codex | 2026-06-30 | 2026-07-01 |
| ISSUE-005 | Deferred | Medium | Decision | 2차 MVP에서 Supabase Auth / DB / Storage 도입 범위 결정 | Supabase Auth, Supabase Postgres, Supabase Storage, Next.js API Route 또는 Server Action의 도입 범위와 우선순위 결정 | 2차 MVP 확장 예정 항목으로 보류 | 미정 | 2026-07-01 | - |
| ISSUE-006 | Deferred | Low | Decision | 3차 확장에서 Spring Boot / MySQL / RDS / S3 마이그레이션 전략 결정 | UNIKER 이후 Spring Boot REST API, MySQL 또는 AWS RDS, AWS S3로 확장할 범위와 마이그레이션 순서 결정 | UNIKER 이후 백엔드 포트폴리오 확장 항목으로 보류 | 미정 | 2026-07-01 | - |

## 이슈 추가 템플릿

| 이슈 ID | 상태 | 우선순위 | 유형 | 내용 | 결정 필요 사항 | 해결 내용 | 담당자 | 기록일 | 해결일 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ISSUE-000 | Open | High / Medium / Low | Decision / Bug / Risk / Question |  |  |  | 미정 | YYYY-MM-DD | - |
