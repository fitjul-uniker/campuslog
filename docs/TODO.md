# CampusLog TODO

## 목적

이 문서는 CampusLog의 남은 작업을 우선순위별로 관리하기 위한 문서입니다.

## 작성 규칙

- 새 작업은 우선순위에 맞는 섹션에 추가합니다.
- 완료한 작업은 체크 후 `Done` 섹션으로 이동합니다.
- 1차 MVP 범위 변경이 필요한 작업은 바로 구현하지 않고 `docs/ISSUE_LOG.md`에도 기록합니다.

## High Priority

- [ ] `sampleExperiences.ts` 작성
- [ ] localStorage 기반 경험 CRUD 구현
- [ ] 활동 경험 목록 / 작성 / 수정 / 상세 화면 실제 동작 구현
- [ ] 활동 경험 상세 화면 구현
- [ ] 활동 경험 상세 화면에서 AI 분석 요청 CTA 실행 흐름 구현
- [ ] 작성 / 수정 화면 저장 후 활동 경험 상세로 이동하는 흐름 구현
- [ ] Vercel 배포 준비

## Medium Priority

- [ ] README 실행 방법 보완
- [ ] OpenAI API 연결 방식 결정
- [ ] `sampleExperiences.ts` 초기 화면 자동 주입 여부 결정
- [ ] 추천 결과 저장을 `feature/ai-recommendation`에 포함할지 별도 PR로 분리할지 결정
- [ ] 정렬 옵션의 `오래된순` / `오래된 작성순` 표현 확정
- [ ] 2차 MVP Supabase Auth / Postgres / Storage 도입 범위 검토

## Low Priority

- [ ] 책갈피 노트 파비콘 구현 방식 결정
- [ ] 3차 확장 Spring Boot REST API 도입 방향 정리
- [ ] 3차 확장 MySQL 또는 AWS RDS 전환 방향 정리
- [ ] 3차 확장 AWS S3 파일 저장 방향 정리

## Done

- [x] 작업 기록 문서 2026-07-09 상태 최신화
- [x] 브랜치 정리 프롬프트 규칙 추가
- [x] Next.js 프론트엔드 초기 세팅
- [x] 프론트엔드 기본 라우트 / AppShell 구조 추가
- [x] 1차 MVP 구현 계획 문서 작성
- [x] DESIGN.md 1차 MVP 디자인 방향 확정
- [x] LocalStorage 데이터 구조 설계
- [x] 활동 경험 목록 / 작성 / 수정 / 상세 화면 구현 순서 확정
- [x] AI 경험 분석 결과 화면 구현 순서 정리
- [x] AI 경험 추천 및 활용 화면 구현 순서 정리
- [x] 추천 결과 localStorage 저장 구현 순서 정리
- [x] MVP 기능 범위 최종 확정
- [x] 개발 단계 전략 확정
- [x] SQLite 도입 여부 검토: 1차 MVP에서는 사용하지 않음
- [x] USER_FLOW.md 파일명 정리 여부 결정
- [x] GitHub 협업 규칙 문서 작성
- [x] PRD.md 작성
- [x] README.md 작성
- [x] AGENTS.md 작성
- [x] USER_FLOW.md 작성
- [x] IA.md 작성
- [x] SCREEN_SPEC.md 작성
- [x] 문서 정합성 검토 승인 항목 반영
