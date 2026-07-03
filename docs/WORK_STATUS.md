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
- [ ] 프론트엔드 초기 세팅
- [ ] 핵심 화면 구현
- [ ] AI 분석 / 추천 기능 연결
- [ ] MVP 검증

현재 프로젝트는 1차 MVP 구현 준비 단계입니다.

## 현재 MVP 방향

CampusLog 1차 MVP는 대학생이 활동 경험을 기록하고, AI가 해당 경험을 분석한 뒤 자기소개서, 포트폴리오, 면접 준비 상황에 맞는 경험을 추천하는 흐름에 집중합니다.

1차 MVP는 4~5주차까지 Next.js, Browser localStorage, `sampleExperiences.ts` 기반 공통 샘플 데이터, OpenAI API, Vercel 배포를 기준으로 만듭니다.

현재 기준 핵심 기능은 아래 3가지입니다.

- 활동 경험 기록
- AI 경험 분석
- AI 경험 추천 및 활용

로그인 / 회원가입, Supabase, DB, Spring Boot, MySQL, AWS S3, 파일 업로드는 1차 MVP에서 구현하지 않습니다.

2026-07-03 기준으로 화면 구조와 CTA 흐름을 정리했습니다. 작성 / 수정 화면은 경험 입력과 수정에 집중하고, 저장 후 활동 경험 상세 화면으로 이동합니다. AI 분석 요청은 활동 경험 상세 화면에서 실행합니다.

## 현재 완료된 문서

- [x] `PRD.md`
- [x] `README.md`
- [x] `AGENTS.md`
- [x] `docs/USER_FLOW.md`
- [x] `docs/IA.md`
- [x] `docs/SCREEN_SPEC.md`
- [x] `docs/GIT_WORKFLOW.md`
- [x] `docs/WORK_STATUS.md`
- [x] `docs/TODO.md`
- [x] `docs/ISSUE_LOG.md`
- [x] `docs/TASK_LOG.md`

사용자 흐름 문서는 `docs/USER_FLOW.md`를 기준으로 확인합니다.

## 현재 완료된 개발 작업

- 아직 확인된 구현 작업 없음
- 현재는 기획 문서와 작업 기록 문서를 정리하는 단계

## 아직 시작하지 않은 작업

- Next.js 프론트엔드 초기 세팅
- LocalStorage 데이터 구조 설계
- `sampleExperiences.ts` 샘플 데이터 설계
- 활동 경험 목록 / 작성 / 수정 / 상세 화면 구현
- 활동 경험 상세 화면에서 AI 분석 요청 CTA 구현
- 작성 / 수정 화면 저장 후 활동 경험 상세로 이동하는 흐름 구현
- AI 경험 분석 결과 화면 구현
- AI 경험 추천 및 활용 화면 구현
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

- [ ] Next.js 프론트엔드 초기 세팅
- [ ] LocalStorage 데이터 구조 설계
- [ ] `sampleExperiences.ts` 샘플 데이터 설계
- [ ] 활동 경험 목록 / 작성 / 수정 / 상세 화면 구현 순서 확정
- [ ] 활동 경험 상세 화면에서 AI 분석 요청 CTA 구현
- [ ] Vercel 배포 준비

## 주의사항

- `PRD.md`의 MVP 범위와 제외 기능을 우선 기준으로 봅니다.
- 1차 MVP 기능 범위는 확정되었으므로 임의로 기능 우선순위를 바꾸지 않습니다.
- 로그인, 회원가입, Supabase, DB, Spring Boot 백엔드, MySQL 구축, AWS S3, 파일 업로드는 1차 MVP 제외 범위입니다.
- Supabase Auth / Postgres / Storage는 2차 MVP로 보류되었습니다.
- Spring Boot, MySQL 또는 AWS RDS, AWS S3는 UNIKER 이후 3차 확장으로 보류되었습니다.
- 작성 / 수정 화면에서는 AI 분석 요청을 바로 실행하지 않고, 저장 후 활동 경험 상세 화면에서 AI 분석 요청을 실행합니다.
- API Key, 토큰, 비밀번호 등 민감한 정보는 문서나 코드에 직접 작성하지 않습니다.
- 실제 사용자 개인정보나 민감한 활동 기록을 샘플 데이터로 사용하지 않습니다.
- 기존 문서를 수정할 때는 수정 이유와 변경 내용을 `docs/TASK_LOG.md`에 남깁니다.
