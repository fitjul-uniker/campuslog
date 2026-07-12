# CampusLog Issue Log

## 목적

이 문서는 CampusLog 프로젝트의 문제, 버그, 의사결정 보류 사항을 기록하기 위한 문서입니다.

## 상태 기준

- `Open`: 아직 결정 또는 해결되지 않음
- `In Progress`: 논의 또는 해결 진행 중
- `Resolved`: 결정 또는 해결 완료
- `Deferred`: 현재 활성 단계 이후로 보류

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
| ISSUE-005 | In Progress | High | Decision | 2차 MVP에서 Next.js Full Stack + Supabase 도입 범위 결정 | Supabase Auth, Postgres, RLS, 조건부 Storage, Next.js API Route 또는 Server Action의 도입 범위와 우선순위 결정 | 2차 MVP 활성 Track A로 전환. 로그인·회원가입·사용자별 DB는 포함하며 Storage는 실제 파일 기능이 승인될 때 도입 | Track A 담당자 | 2026-07-01 | - |
| ISSUE-006 | Deferred | Low | Decision | UNIKER 이후 개인 Backend Portfolio Edition 마이그레이션 전략 결정 | Spring Boot REST API, MySQL 또는 AWS RDS, AWS S3로 확장할 범위와 마이그레이션 순서 결정 | CampusLog 본 MVP가 아니라 UNIKER 이후 개인 백엔드 포트폴리오 확장 항목으로 보류 | 미정 | 2026-07-01 | - |
| ISSUE-007 | Resolved | Medium | Question | `sampleExperiences.ts` 초기 화면 자동 주입 여부 결정 필요 | 샘플 경험을 실제 사용자 localStorage에 자동 저장할지, 빈 상태 검증용 개발 데이터로만 둘지 결정 | `sampleExperiences.ts`는 개발 참고용 샘플 데이터만 정의하고 실제 사용자 localStorage에는 자동 주입하지 않음. 첫 화면은 기본적으로 빈 상태가 보이도록 유지 | Codex | 2026-07-09 | 2026-07-09 |
| ISSUE-008 | Resolved | Medium | Decision | OpenAI API 호출 방식 결정 필요 | API Route에서 OpenAI SDK를 사용할지, server-side `fetch`를 사용할지 결정 | 새 dependency를 추가하지 않고 `web/src/app/api/analyze/route.ts`에서 server-side `fetch`로 OpenAI Responses API를 호출하는 방식으로 결정 | Codex | 2026-07-09 | 2026-07-09 |
| ISSUE-009 | Resolved | Low | Decision | 파비콘과 앱 설치 아이콘 구현 방식 결정 필요 | 앱 셸의 CampusLog 워드마크를 아이콘에도 유지할지 결정 | 사용자가 요청한 CampusLog 텍스트 워드마크를 `web/public/favicon.svg`, `web/public/app-icon.svg`에 동일하게 적용 | Codex | 2026-07-09 | 2026-07-11 |
| ISSUE-010 | Resolved | Low | Question | 정렬 옵션 표현 확정 필요 | 문서별 `오래된순` / `오래된 작성순` 표현을 `createdAt` 오름차순 기준으로 통일할지 결정 | 제목 전용 목록과 검색으로 대시보드를 재구성하면서 정렬 옵션을 현재 MVP 화면에서 제거하고 최근 수정순 기본 순서를 유지 | Codex | 2026-07-09 | 2026-07-12 |
| ISSUE-011 | Resolved | Medium | Decision | 추천 결과 저장 구현 PR 범위 결정 필요 | 추천 결과 저장을 `feature/ai-recommendation` 안에서 함께 구현할지, 별도 작은 PR로 분리할지 결정 | 추천 결과 저장은 `feature/ai-recommendation` 범위에 포함해 구현. 추천 성공 시 클라이언트에서 `campuslog:v1:recommendations`에 최근순 배열로 저장 | Codex | 2026-07-09 | 2026-07-10 |
| ISSUE-012 | Resolved | Medium | Bug | 로컬 AI 분석 요청이 `invalid_api_key`로 실패 | `web/.env.local`의 새 API Key가 적용되지 않는 원인 확인 | 상위 쉘 환경에 남아 있던 기존 `OPENAI_API_KEY`가 `web/.env.local`보다 우선 적용되어 발생. `env -u OPENAI_API_KEY npm run dev`로 `.env.local`의 새 키만 사용했을 때 `/api/analyze` 성공 응답을 확인 | Codex | 2026-07-09 | 2026-07-09 |
| ISSUE-013 | Open | Medium | Bug | localStorage JSON parse 실패가 빈 상태와 구분되지 않음 | `storage.ts`의 `readJson` / `readStoredExperiences`가 malformed JSON을 빈 배열로 fallback하므로 대시보드에서 데이터 파싱 실패 Alert를 정확히 표시할 정책을 정해야 함 | 이번 `design/dashboard-polish`에서는 storage 구조와 CRUD 로직 변경 금지 범위를 지키기 위해 수정하지 않고, 대시보드에서는 예기치 않은 load exception만 Alert로 처리 | 미정 | 2026-07-10 | - |
| ISSUE-014 | Resolved | Medium | Bug | 로컬 AI 분석 / 추천 요청이 `invalid_api_key`로 실패 | 유효한 `OPENAI_API_KEY` 기준으로 AI 분석 성공 저장, AI 추천 성공 저장, 추천 기록 유지까지 재검증 필요 | `feature/interactive-notebook-ui-review` 사용자 수동 테스트에서 경험 작성 후 `/api/analyze` 200, `/api/recommend` 200 응답과 분석 결과 / 추천 기록 화면 이동을 확인 | Codex | 2026-07-10 | 2026-07-11 |
| ISSUE-015 | Resolved | High | Bug | AI 추천 결과에서 추천 경험과 추천 이유 / 태그 / 성과 / 활용 방향 / 참고 문장이 서로 다른 경험 기준으로 섞임 | 추천 경험 선택 결과와 상세 추천 문장 생성 컨텍스트를 같은 경험으로 고정해야 함 | `/api/recommend`를 경험 선택 단계와 상세 추천 문장 생성 단계로 분리. 선택 단계는 `recommendedExperienceId`만 반환하고, 상세 생성 단계에는 서버가 확정한 선택 경험 1개와 해당 분석 결과만 전달하도록 수정. 최종 응답의 추천 경험 id / title은 서버의 선택 경험 객체에서 구성 | Codex | 2026-07-10 | 2026-07-10 |
| ISSUE-016 | Resolved | High | Bug | 860px 이하에서 데스크톱 사이드바가 숨겨지지만 모바일 헤더에는 AI 추천 및 활용 / 추천 기록 메뉴가 없어 해당 화면의 UI 진입 경로가 사라짐 | 모바일 상단에서 세 핵심 화면에 모두 진입할 수 있어야 함 | 모바일 상단 내비게이션에 `경험`, `AI 추천`, `기록` 링크를 추가하고 390px 브라우저에서 가로 overflow 없이 세 경로가 노출되는 것을 확인 | Codex | 2026-07-11 | 2026-07-12 |
| ISSUE-017 | Open | Medium | Risk | WebGL / Canvas / texture 렌더 실패 시 정적 이미지 노출을 막기 위해 fallback과 error boundary가 비시각 상태를 반환하므로 표지 시각 요소가 비어 보일 수 있음 | 정적 이미지가 먼저 보이지 않는 요구를 유지하면서 오류 발생 때만 표시할 CSS 기반 fallback을 추가할지 결정 필요 | 이번 이관에서는 `0929b98`의 코드를 변경하지 않고 사용자 수동 검토 대상으로 유지 | 미정 | 2026-07-11 | - |
| ISSUE-018 | Resolved | High | Decision | 최신 기준 문서와 Fork UI의 `/` → `/dashboard` 역할이 달라 branded intro 유지 여부 결정 필요 | 현재 branded intro를 유지할지, 첫 viewport 안에 핵심 기능 진입을 함께 노출할지 결정 | 사용자가 현재 `/` 3D 노트 표지와 `/dashboard` 전환을 직접 테스트해 통과 처리하고 PR 진행을 승인. PRD / DESIGN / IMPLEMENTATION_PLAN과 관련 화면 문서를 실제 승인 구조로 갱신 | Codex | 2026-07-11 | 2026-07-11 |
| ISSUE-019 | Resolved | High | Bug | `/dashboard`의 고정 높이 책 프레임에서 저장된 경험 목록이 스크롤되지 않아 첫 카드 아래 경험에 접근할 수 없고, CTA도 목록 스크롤 영역과 분리되지 않음 | 데스크톱과 모바일에서 목록만 책 내부 스크롤 대상으로 두고 `새 경험 기록하기` CTA를 고정할 높이 / overflow 구조 확정 필요 | 오른쪽 페이지와 앞면에 확정 높이와 `min-height: 0`을 적용해 내부 스크롤을 복구하고, 목록 전용 `dashboard-page-scroll`과 고정 `dashboard-page-action`을 분리. 1440×900과 390×844에서 마지막 카드 접근 및 스크롤 중 CTA 좌표 변화 0px 확인 | Codex | 2026-07-11 | 2026-07-11 |
| ISSUE-020 | Resolved | High | Decision | 관련 링크를 URL·설명 객체로 바꿀 때 기존 문자열 배열 보존과 파비콘 로딩 방식 결정 필요 | 기존 v1 활동 손실 없이 새 구조로 전환하고 임의 URL·비공개 호스트 요청을 피하는 방법 결정 | 기존 `campuslog:v1:experiences`를 보존하고 링크 개수·비-URL 메모를 유지한 채 v2 key에 `{ url, description }[]`로 자동 변환. 완료 marker로 이전 데이터 재등장을 차단. 파비콘은 전체 URL이 아닌 공개 도메인만 고정 제공처에 전달하며 비공개 호스트·IP 주소·실패 응답은 `Link2` fallback 사용 | Codex | 2026-07-12 | 2026-07-12 |
| ISSUE-021 | Open | Low | Risk | 구조화된 관련 링크의 실제 저장·상세 표시·새로고침 유지 E2E 수동 검증 미완료 | 사용자 데이터에 테스트 활동을 남기지 않으면서 URL·설명 저장, 상세 파비콘, 새로고침 유지까지 확인할 방법 결정 | 폼의 URL·설명 입력, 파비콘, 추가·삭제·초점 이동과 기존 v1 활동 유지는 확인했지만 새 테스트 활동 저장은 수행하지 않음. 사용자 수동 확인 후 결과 기록 필요 | 미정 | 2026-07-12 | - |
| ISSUE-022 | Resolved | High | Decision | 확정된 1차 MVP를 넘어 진행형 경험 기록과 메인 캘린더를 구현할지 결정 필요 | 기존 기능 보존, 새 브랜치, 저장·AI 범위와 메인 화면 역할 결정 | 사용자가 2026-07-13에 MVP 범위를 제한하지 말고 새 브랜치에서 구현하도록 명시적으로 승인. `/dashboard`는 오늘의 기록, `/experiences`는 완료 경험과 진행 활동을 통합한 `나의 활동`으로 분리하고 localStorage + API Route를 유지 | Codex | 2026-07-13 | 2026-07-13 |
| ISSUE-023 | Resolved | High | Risk | 활동 종료 AI 합성의 환각, 프롬프트 인젝션, 중복 Experience 생성 가능성 | 입력 근거 제한, 서버 검증, 저장 멱등성과 실패 복구 정책 필요 | 완료 상태·날짜 범위를 서버에서 검증하고 모든 사용자 입력을 비신뢰 데이터로 취급. usedLogIds를 실제 입력 ID로 재검증하고 activityId 기준 트랜잭션 저장, draft 무효화, 활동 다시 열기를 구현. 실제 API 200과 단일 Experience 저장 확인 | Codex | 2026-07-13 | 2026-07-13 |
| ISSUE-024 | Open | High | Risk | 공개 배포에서 AI API Route 반복 호출로 OpenAI 비용이 증가할 수 있음 | `/api/analyze`, `/api/recommend`, `/api/synthesize-activity`의 인증, 입력 상한, rate limit, `retryAfter`, 중복 요청, OpenAI spend limit / alert 정책 결정 | 입력 상한, timeout, API Key 서버 보관은 적용했으나 서버리스 환경의 신뢰 가능한 호출 빈도 제한과 UI 오류 contract는 Vercel 배포 준비와 함께 적용 필요 | Track A + Track B | 2026-07-13 | - |
| ISSUE-025 | Open | High | Decision | v1.1 localStorage 데이터를 2차 MVP 사용자 DB로 이전할 정책 필요 | 자동 / 수동 이전, 사용자 생성 데이터 판별, 샘플·fixture·파싱 실패 제외, 중복 처리, 부분 실패, 원본 삭제 시점, 동일 요청 멱등성 결정 | 성공 전 localStorage 원본을 삭제하지 않고 사용자 선택과 재시도를 제공하며, 서버 데이터 유무와 관계없이 이전 가능한 로컬 데이터가 있으면 안내하는 것을 기본 원칙으로 설정. 세부 정책은 Track A·B가 공동 확정 | Track A + Track B | 2026-07-13 | - |
| ISSUE-026 | Open | High | Risk | 인증·DB Track과 디자인·UX Track의 공통 파일 및 계약 충돌 가능성 | 공유 타입, repository, 인증 상태, API error, 공통 컴포넌트의 담당과 merge 순서 결정 | `CURRENT_PHASE.md`와 `IMPLEMENTATION_PLAN.md`에 병렬 개발 계약을 추가. Track A는 인증 모듈·server action·validation·오류 contract, Track B는 해당 contract 기반 route UI·표현 계층을 담당 | 팀 | 2026-07-13 | - |
| ISSUE-027 | Resolved | High | Decision | 1차 MVP 문서가 v1.1 이후 고도화 개발을 제한함 | 완료된 1차 MVP 기준선을 보존하면서 현재 활성 개발 기준을 전환할 방법 결정 | v1.1을 archive 기준선으로 고정하고 `CURRENT_PHASE.md`를 최우선 문서로 추가. 2차 MVP를 인증·데이터·AI Track과 디자인·UX Track으로 분리 | 사용자 + Codex | 2026-07-13 | 2026-07-13 |
| ISSUE-028 | Open | High | Risk | 인증 오류 문구가 이메일 계정 존재 여부를 노출할 수 있음 | Supabase 인증 응답 매핑, 비밀번호 validation 공유, 로그인·회원가입 사용자 문구와 계정 열거 방지 정책 결정 | Supabase 원문 오류를 직접 노출하지 않고 Track A가 공통 사용자용 오류 code를 제공하며 Track B는 해당 code의 승인된 문구만 표시하는 것을 기본 원칙으로 설정 | Track A + Track B | 2026-07-13 | - |
| ISSUE-029 | Open | High | Decision | 활동 종료 AI 합성 초안과 상태의 DB 소유권·보존 계약 필요 | 합성 초안 RLS, 원본 활동·로그 관계, 마이그레이션, 저장 후 삭제, 실패·재시도, 합성 API 제한, 완료 Experience 멱등성 구현 확정 | 미완료 초안과 상태를 사용자 소유 데이터로 취급하고 완료 Experience 저장 검증 후 초안을 제거하는 v1.1 정책을 기본값으로 설정 | Track A | 2026-07-13 | - |

## 이슈 추가 템플릿

| 이슈 ID | 상태 | 우선순위 | 유형 | 내용 | 결정 필요 사항 | 해결 내용 | 담당자 | 기록일 | 해결일 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ISSUE-000 | Open | High / Medium / Low | Decision / Bug / Risk / Question |  |  |  | 미정 | YYYY-MM-DD | - |
