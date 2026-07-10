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
| ISSUE-001 | Resolved | High | Decision | MVP 기능 범위 최종 확정 필요 | 10주 MVP에서 반드시 구현할 기능과 제외할 기능 확정 | 1차 MVP 범위를 활동 경험 기록, AI 경험 분석, AI 경험 추천 및 활용으로 확정. 로그인 / 회원가입, DB, Supabase, 파일 업로드, 개인 Backend Portfolio Edition용 별도 백엔드 스택은 1차 MVP에서 제외 | Codex | 2026-06-30 | 2026-07-01 |
| ISSUE-002 | Resolved | Medium | Decision | USER_FLOW.md 파일명 정리 완료 | 사용자 흐름 문서 파일명 정리 | 운영진 요구 파일명에 맞춰 FLOW.md를 USER_FLOW.md로 변경 | Codex | 2026-06-30 | 2026-06-30 |
| ISSUE-003 | Resolved | Medium | Decision | 추천 결과 저장 기능 우선순위 결정 | 추천 결과 저장을 첫 구현에 포함할지, 복사 기능 이후 낮은 우선순위로 둘지 결정 | 추천 결과 저장은 1차 MVP 범위에 포함하되, 첫 구현에서는 복사 기능보다 낮은 우선순위로 둠 | Codex | 2026-06-30 | 2026-07-03 |
| ISSUE-004 | Resolved | Medium | Decision | LocalStorage만 사용할지 SQLite까지 고려할지 결정 필요 | 1차 MVP에서는 LocalStorage만 사용할지, SQLite 도입 가능성을 검토할지 결정 | 1차 MVP는 Browser localStorage만 사용하고 SQLite는 도입하지 않음 | Codex | 2026-06-30 | 2026-07-01 |
| ISSUE-005 | Deferred | Medium | Decision | 2차 MVP에서 Next.js Full Stack + Supabase 도입 범위 결정 | Supabase Auth, Supabase Postgres, Supabase Storage, Next.js API Route 또는 Server Action의 도입 범위와 우선순위 결정 | 2차 MVP 확장 예정 항목으로 보류 | 미정 | 2026-07-01 | - |
| ISSUE-006 | Deferred | Low | Decision | UNIKER 이후 개인 Backend Portfolio Edition 마이그레이션 전략 결정 | Spring Boot REST API, MySQL 또는 AWS RDS, AWS S3로 확장할 범위와 마이그레이션 순서 결정 | CampusLog 본 MVP가 아니라 UNIKER 이후 개인 백엔드 포트폴리오 확장 항목으로 보류 | 미정 | 2026-07-01 | - |
| ISSUE-007 | Resolved | Medium | Question | `sampleExperiences.ts` 초기 화면 자동 주입 여부 결정 필요 | 샘플 경험을 실제 사용자 localStorage에 자동 저장할지, 빈 상태 검증용 개발 데이터로만 둘지 결정 | `sampleExperiences.ts`는 개발 참고용 샘플 데이터만 정의하고 실제 사용자 localStorage에는 자동 주입하지 않음. 첫 화면은 기본적으로 빈 상태가 보이도록 유지 | Codex | 2026-07-09 | 2026-07-09 |
| ISSUE-008 | Resolved | Medium | Decision | OpenAI API 호출 방식 결정 필요 | API Route에서 OpenAI SDK를 사용할지, server-side `fetch`를 사용할지 결정 | 새 dependency를 추가하지 않고 `web/src/app/api/analyze/route.ts`에서 server-side `fetch`로 OpenAI Responses API를 호출하는 방식으로 결정 | Codex | 2026-07-09 | 2026-07-09 |
| ISSUE-009 | Resolved | Low | Decision | 책갈피 노트 파비콘 구현 방식 결정 필요 | 직접 제작한 파비콘을 사용할지, 임시 Lucide 기반 아이콘으로 시작할지 결정 | 새 로고를 직접 제작하지 않고, 기존 의존성인 `lucide-react`의 `BookMarked` 아이콘 기반 SVG 후보를 `web/public/favicon.svg`, `web/public/app-icon.svg`로 적용 | Codex | 2026-07-09 | 2026-07-10 |
| ISSUE-010 | Open | Low | Question | 정렬 옵션 표현 확정 필요 | 문서별 `오래된순` / `오래된 작성순` 표현을 `createdAt` 오름차순 기준으로 통일할지 결정 | - | 미정 | 2026-07-09 | - |
| ISSUE-011 | Resolved | Medium | Decision | 추천 결과 저장 구현 PR 범위 결정 필요 | 추천 결과 저장을 `feature/ai-recommendation` 안에서 함께 구현할지, 별도 작은 PR로 분리할지 결정 | 추천 결과 저장은 `feature/ai-recommendation` 범위에 포함해 구현. 추천 성공 시 클라이언트에서 `campuslog:v1:recommendations`에 최근순 배열로 저장 | Codex | 2026-07-09 | 2026-07-10 |
| ISSUE-012 | Resolved | Medium | Bug | 로컬 AI 분석 요청이 `invalid_api_key`로 실패 | `web/.env.local`의 새 API Key가 적용되지 않는 원인 확인 | 상위 쉘 환경에 남아 있던 기존 `OPENAI_API_KEY`가 `web/.env.local`보다 우선 적용되어 발생. `env -u OPENAI_API_KEY npm run dev`로 `.env.local`의 새 키만 사용했을 때 `/api/analyze` 성공 응답을 확인 | Codex | 2026-07-09 | 2026-07-09 |
| ISSUE-013 | Open | Medium | Bug | localStorage JSON parse 실패가 빈 상태와 구분되지 않음 | `storage.ts`의 `readJson` / `readStoredExperiences`가 malformed JSON을 빈 배열로 fallback하므로 대시보드에서 데이터 파싱 실패 Alert를 정확히 표시할 정책을 정해야 함 | 이번 `design/dashboard-polish`에서는 storage 구조와 CRUD 로직 변경 금지 범위를 지키기 위해 수정하지 않고, 대시보드에서는 예기치 않은 load exception만 Alert로 처리 | 미정 | 2026-07-10 | - |
| ISSUE-014 | Open | Medium | Bug | 로컬 AI 분석 / 추천 요청이 `invalid_api_key`로 실패 | 유효한 `OPENAI_API_KEY` 기준으로 AI 분석 성공 저장, AI 추천 성공 저장, 추천 기록 유지까지 재검증 필요 | `design/responsive-brand-polish` 검증 중 `/api/analyze`, `/api/recommend`가 각각 401 `invalid_api_key`로 실패함. 이번 브랜치에서는 API 호출 방식과 환경 변수 처리 로직을 변경하지 않고 UI 실패 상태까지만 확인 | 미정 | 2026-07-10 | - |
| ISSUE-015 | Resolved | High | Bug | AI 추천 결과에서 추천 경험과 추천 이유 / 태그 / 성과 / 활용 방향 / 참고 문장이 서로 다른 경험 기준으로 섞임 | 추천 경험 선택 결과와 상세 추천 문장 생성 컨텍스트를 같은 경험으로 고정해야 함 | `/api/recommend`를 경험 선택 단계와 상세 추천 문장 생성 단계로 분리. 선택 단계는 `recommendedExperienceId`만 반환하고, 상세 생성 단계에는 서버가 확정한 선택 경험 1개와 해당 분석 결과만 전달하도록 수정. 최종 응답의 추천 경험 id / title은 서버의 선택 경험 객체에서 구성 | Codex | 2026-07-10 | 2026-07-10 |

## 이슈 추가 템플릿

| 이슈 ID | 상태 | 우선순위 | 유형 | 내용 | 결정 필요 사항 | 해결 내용 | 담당자 | 기록일 | 해결일 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ISSUE-000 | Open | High / Medium / Low | Decision / Bug / Risk / Question |  |  |  | 미정 | YYYY-MM-DD | - |
