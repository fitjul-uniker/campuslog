# CampusLog TODO

## 목적

이 문서는 CampusLog의 남은 작업을 우선순위별로 관리하기 위한 문서입니다.

## 작성 규칙

- 새 작업은 우선순위에 맞는 섹션에 추가합니다.
- 완료한 작업은 체크 후 `Done` 섹션으로 이동합니다.
- 1차 MVP 범위 변경이 필요한 작업은 바로 구현하지 않고 `docs/ISSUE_LOG.md`에도 기록합니다.

## High Priority

- [ ] Vercel 배포 준비

## Medium Priority

- [ ] README 실행 방법 보완
- [ ] 정렬 / 필터 실제 데이터 처리 구현
- [ ] 정렬 옵션의 `오래된순` / `오래된 작성순` 표현 확정
- [ ] 2차 MVP Next.js Full Stack + Supabase Auth / Postgres / Storage 도입 범위 검토

## Low Priority

- [ ] 책갈피 노트 파비콘 구현 방식 결정
- [ ] UNIKER 이후 개인 Backend Portfolio Edition의 Spring Boot REST API 도입 방향 정리
- [ ] UNIKER 이후 개인 Backend Portfolio Edition의 MySQL 또는 AWS RDS 전환 방향 정리
- [ ] UNIKER 이후 개인 Backend Portfolio Edition의 AWS S3 파일 저장 방향 정리

## Done

- [x] 대시보드 UI/UX polish
- [x] 경험 카드 정보 위계 정리
- [x] 대시보드 빈 상태 CTA 위계 정리
- [x] 경험 목록 skeleton 로딩 상태 구현
- [x] 대시보드 실패 Alert / 다시 시도 UI 정리
- [x] 분석 상태 배지 색상과 fallback 정리
- [x] 정렬 / 필터 컨트롤 UI 배치
- [x] AI 경험 추천 및 활용 기능 구현
- [x] `/api/recommend` AI 경험 추천 API Route 구현
- [x] 추천 입력 폼과 추천 결과 화면 구현
- [x] 추천 참고 문장 복사 기능 구현
- [x] 추천 결과 localStorage 저장 구현
- [x] 저장된 추천 기록 목록과 선택 열람 UI 구현
- [x] 왼쪽 내비게이션에서 AI 추천과 추천 기록 메뉴 분리
- [x] 추천 결과 저장을 `feature/ai-recommendation`에 포함할지 별도 PR로 분리할지 결정: `feature/ai-recommendation`에 포함
- [x] AI 경험 분석 API Route 구현
- [x] OpenAI API 연결 방식 결정: API Route에서 server-side `fetch` 사용
- [x] 활동 경험 상세 화면에서 AI 분석 요청 CTA 실행 흐름 구현
- [x] AI 경험 분석 결과 화면 구현
- [x] 분석 결과 localStorage 저장 및 `analysisStatus: "analyzed"` 전환 구현
- [x] AI 분석 실패 시 경험 데이터 유지와 재시도 UI 구현
- [x] localStorage 기반 경험 CRUD 구현
- [x] 활동 경험 목록 / 작성 / 수정 / 상세 화면 실제 동작 구현
- [x] 활동 경험 상세 화면 구현
- [x] 작성 / 수정 화면 저장 후 활동 경험 상세로 이동하는 흐름 구현
- [x] 경험 삭제 시 연결 분석 결과와 추천 결과 정리 정책 구현
- [x] 생성 직후에는 생성일만 표시하고 수정 후 수정일 표시
- [x] 활동기간 시작월 / 종료월 입력 폼 적용
- [x] `sampleExperiences.ts` 작성
- [x] `sampleExperiences.ts` 초기 화면 자동 주입 여부 결정: 자동 주입하지 않고 개발 참고용 데이터로만 유지
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
