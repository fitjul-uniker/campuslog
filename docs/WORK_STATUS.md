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
- [x] 핵심 화면 구현
- [x] AI 분석 / 추천 기능 연결
- [ ] MVP 검증

현재 프로젝트는 인터랙티브 노트 UI 작업이 PR #23의 merge commit `23492c1`로 Organization `main`에 반영된 뒤, 해당 `main`에서 분기한 `codex/fix-experience-list-scroll`에서 경험 목록 내부 스크롤과 고정 `새 경험 기록하기` CTA를 보강한 상태입니다. AI 분석과 AI 추천 기능은 기존 1차 MVP 데이터 흐름을 유지합니다. 현재 버그 수정은 commit / push / PR 전이며, 다음 단계는 변경 검토 후 Organization PR 반영 여부를 결정하는 것입니다.

## 현재 MVP 방향

CampusLog 1차 MVP는 대학생이 활동 경험을 기록하고, AI가 해당 경험을 분석한 뒤 자기소개서, 포트폴리오, 면접 준비 상황에 맞는 경험을 추천하는 흐름에 집중합니다.

1차 MVP는 4~5주차까지 Next.js Full Stack, Browser localStorage, `sampleExperiences.ts` 기반 공통 샘플 데이터, Next.js App Router API Routes, OpenAI API, Vercel 배포를 기준으로 만듭니다.

현재 기준 핵심 기능은 아래 3가지입니다.

- 활동 경험 기록
- AI 경험 분석
- AI 경험 추천 및 활용

2026-07-05 멘토링 기준 1차 MVP 구현은 활동 경험 입력 → AI 요약 / 역량 태그 분석 → 활용 문장 생성 / 복사 / 저장 흐름에 집중합니다.

로그인 / 회원가입, 결제, 커뮤니티, 외부 서비스 자동 연동, 파일 첨부, 고급 추천 기능, Supabase, DB, UNIKER 이후 개인 Backend Portfolio Edition용 별도 백엔드 스택은 1차 MVP에서 구현하지 않습니다.

2026-07-03 기준으로 화면 구조와 CTA 흐름을 정리했습니다. 작성 / 수정 화면은 경험 입력과 수정에 집중하고, 저장 후 활동 경험 상세 화면으로 이동합니다. AI 분석 요청은 활동 경험 상세 화면에서 실행합니다.

2026-07-06 기준으로 멘토링 피드백을 반영해 `AGENTS.md` 작업 규칙을 보강했습니다. 보강 내용에는 작업 유형별 기준 문서 확인, 작은 작업 단위 진행, `feature/*` / `docs/*` / `fix/*` 브랜치와 PR 기반 협업, reviewer subagent 분리, 리뷰 심각도 기준, 작업 후 기록 문서 업데이트 규칙이 포함됩니다.

2026-07-09 기준으로 `docs/DESIGN.md`와 `docs/IMPLEMENTATION_PLAN.md`를 확정하고, `feature/base-structure` 작업을 통해 `web/`의 Next.js App Router 기본 구조를 `main`에 머지했습니다. 현재 앱에는 메인 / 경험 작성 / 경험 상세 / 경험 수정 / AI 분석 결과 / AI 추천 라우트, AppShell, Navigation, 공통 스타일, 기본 타입 파일이 있습니다.

2026-07-09 `feature/experience-crud` 기준으로 Browser localStorage 기반 경험 작성, 목록, 상세, 수정, 삭제 흐름을 구현했습니다. 경험 데이터는 `campuslog:v1:experiences`에 저장하고, 분석 / 추천 결과 저장 기본 구조는 각각 `campuslog:v1:analyses`, `campuslog:v1:recommendations` key를 유지합니다. 샘플 데이터는 `sampleExperiences.ts`에 개발 참고용으로만 두고 사용자 localStorage에는 자동 주입하지 않습니다.

2026-07-09 `feature/ai-analysis` 기준으로 `/api/analyze`를 구현하고, 활동 경험 상세 화면의 AI 분석 요청 CTA와 분석 결과 화면을 실제 동작에 연결했습니다. OpenAI API 호출은 새 dependency 없이 Next.js API Route의 server-side `fetch`로 처리하며, API Key는 `web/.env.local`의 `OPENAI_API_KEY`를 서버에서만 읽습니다. 분석 결과는 `campuslog:v1:analyses`에 `experienceId` 기준으로 저장하고, 저장 시 `id`, `generatedAt`, `sourceExperienceUpdatedAt`을 부여하며, 연결된 경험의 `analysisStatus`를 `analyzed`로 변경합니다. 로컬 검증 중 상위 쉘 환경에 남아 있던 기존 `OPENAI_API_KEY`가 `.env.local`보다 우선되어 `invalid_api_key`가 발생하는 문제를 확인했고, `env -u OPENAI_API_KEY npm run dev`로 `.env.local`의 새 키만 사용했을 때 `/api/analyze` 성공 응답을 확인했습니다.

2026-07-10 `feature/ai-recommendation` 기준으로 `/api/recommend`를 구현하고, AI 경험 추천 및 활용 화면을 실제 동작에 연결했습니다. 추천 요청은 저장된 경험 전체와 저장된 분석 결과 배열을 서버 API Route로 전달하며, 서버에서만 `OPENAI_API_KEY`를 읽어 OpenAI Responses API를 호출합니다. 추천 결과는 가장 적합한 경험 1개, 추천 이유, 관련 태그, 강조할 성과, 활용 방향, 참고 문장을 포함하고, 클라이언트에서 `id`, `purpose`, `prompt`, `generatedAt`을 붙여 `campuslog:v1:recommendations`에 최근순 배열로 저장합니다. 왼쪽 내비게이션에서 AI 추천과 추천 기록을 분리하고, `/recommend/history` 화면에서 과거 활용 목적 / 질문 / 추천 경험을 목록으로 선택해 다시 볼 수 있도록 보강했습니다.

2026-07-10 `fix/recommendation-context-alignment` 기준으로 `/api/recommend`의 추천 생성 흐름을 2단계로 분리했습니다. 1단계는 저장된 경험 전체와 분석 결과를 기준으로 가장 적합한 `recommendedExperienceId`만 선택하고, 2단계는 서버가 확정한 선택 경험 1개와 해당 분석 결과만 근거로 추천 이유, 관련 태그, 강조할 성과, 활용 방향, 참고 문장을 생성합니다. 이 변경은 추천 경험 제목은 "대학 축제 메인 무대 운영 및 음향 장비 돌발 상황 대응"인데 추천 이유와 참고 문장은 CampusLog MVP 개발 경험처럼 다른 경험을 기준으로 생성되는 문제를 줄이기 위한 버그 수정입니다.

2026-07-10 `design/dashboard-polish` 기준으로 메인 대시보드의 CTA 위계, 빈 상태, 목록 로딩 skeleton, 실패 Alert, 경험 카드 정보 구조, 분석 상태 배지, 정렬/필터 컨트롤 UI 배치를 정리했습니다. 정렬/필터 컨트롤은 목록 가까이에 disabled 상태로 표시하되 실제 데이터 처리 동작은 추가하지 않았습니다. storage 구조, localStorage key, API Route, AI 요청 방식, 경험 CRUD 로직은 변경하지 않았습니다.

2026-07-10 `design/responsive-brand-polish` 기준으로 Campus Green + Mint 브랜드 토큰, focus ring, hover 상태, 데스크톱 좌측 사이드바 / 모바일 상단 App Bar 레이아웃, 모바일 CTA / 카드 / EmptyState / 상세 화면 줄바꿈을 정리했습니다. 새 로고를 직접 제작하지 않고 기존 `lucide-react`의 `BookMarked` 아이콘을 브랜드 마크와 favicon / app icon 후보로 재사용했습니다. storage 구조, localStorage key, API Route, AI 요청 방식, 경험 CRUD 로직은 변경하지 않았습니다.

2026-07-11 `feature/interactive-notebook-ui-review` 기준으로 `/`의 검은 가죽 노트를 React Three Fiber 기반 실제 3D 구조로 옮겼습니다. 앞표지 / 뒷표지 / 책등 / 종이 묶음을 분리하고 `black-leather-book.webp`를 앞표지 전용 텍스처로 사용했으며, 포인터 회전, 감쇠 복귀, 미세 부유, 책 hover 확대, 인터랙티브 그림자, 정적 이미지 없는 로딩 전환, `prefers-reduced-motion`, 모바일 DPR 제한을 포함합니다.

2026-07-11 `feature/interactive-notebook-ui-review` 기준으로 대시보드의 CampusLog 워드마크와 공통 책 프레임을 정리하고, 새 경험 작성은 우측 하단 CTA 하나로 통일했습니다. 데스크톱 좌측 메뉴는 `나의 경험`, `AI 추천 및 활용`, `추천 기록`으로 구성하며 포인터 근접 이동과 비활성 메뉴의 미세 blur를 적용합니다. Fork 커밋을 이력에 포함하지 않고 작업 트리 내용만 옮겼으며, 사용자 수동 테스트 통과 후 PR #23의 merge commit `23492c1`로 Organization `main`에 반영했습니다.

2026-07-11 사용자 수동 테스트에서 경험 작성, `/api/analyze` 성공 응답과 분석 결과 화면, `/api/recommend` 성공 응답과 추천 기록 저장 / 열람 흐름이 정상 동작하는 것을 확인했습니다. 기존 `invalid_api_key` 재검증 이슈는 해결 상태로 변경했습니다.

2026-07-11 `codex/fix-experience-list-scroll` 기준으로 `/dashboard`의 고정 높이 책 프레임에서 경험 목록이 첫 카드 아래로 스크롤되지 않던 문제를 수정했습니다. 오른쪽 페이지 높이 체인을 보강하고 목록 전용 스크롤 영역과 고정 `새 경험 기록하기` 액션 영역을 분리했습니다. 데스크톱 1440×900과 모바일 390×844에서 마지막 카드 접근, 스크롤 중 CTA 좌표 고정, 빈 상태 CTA 노출, 새 경험 작성 화면 이동을 확인했으며 localStorage와 AI 데이터 흐름은 변경하지 않았습니다.

## 현재 운영 방향

- 전체 MVP를 한 번에 구현하지 않고, 메인 화면처럼 작고 검증 가능한 단위부터 구현합니다.
- 기능별로 브랜치를 만들고 PR 리뷰 후 `main`에 merge하며, `main`은 안정 버전으로 유지합니다.
- 팀원 모두가 개발 경험을 얻을 수 있도록 기능 단위로 작업을 나눕니다.
- Codex가 생성한 코드는 한 줄씩 모두 이해하려 하기보다 사용자 흐름, 주요 파일 역할, 데이터 흐름, 테스트 방법 중심으로 이해합니다.
- 구현을 맡은 에이전트와 코드 리뷰를 맡은 reviewer subagent를 분리하고, 리뷰는 `critical` / `major` / `minor` / `suggestion` 기준으로 정리합니다.
- Codex 작업 전에는 `AGENTS.md`의 작업 규칙과 참고 문서 순서를 먼저 확인합니다.

## 현재 디자인 운영 방향

- 디자인 품질은 이번 프로젝트의 최우선 목표 중 하나입니다.
- Three.js, React Three Fiber, GSAP, Framer Motion, WebGL, shader, Lottie, particle, glassmorphism, morphing animation, scroll-based animation, micro interaction, premium landing experience는 성능 / 접근성 / 유지보수성을 지키는 범위에서 사용할 수 있습니다.
- 디자인 작업의 판단 기준은 "과한 효과를 피한다"가 아니라 "핵심 흐름을 더 명확하고 인상적으로 만드는가"입니다.
- 로그인, DB, 파일 업로드, Supabase 같은 제품 범위 확장은 여전히 1차 MVP 제외 범위이지만, 3D / WebGL / motion / premium hero 같은 표현 방식은 제외 범위가 아닙니다.
- 고급 비주얼을 추가할 때는 Core Web Vitals, 모바일 렌더링, reduced motion, 텍스트 대비, 키보드 접근성을 함께 확인합니다.

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

- `web/` Next.js App Router 기본 설정
- 메인 / 경험 작성 / 경험 상세 / 경험 수정 / AI 분석 결과 / AI 추천 placeholder 라우트
- `AppShell`, `Navigation` 기본 레이아웃
- `web/src/app/globals.css` 공통 스타일
- `web/src/lib/types.ts`, `web/src/lib/utils.ts` 기본 파일
- localStorage 기반 경험 CRUD 구현
- 경험 목록 대시보드, 빈 상태, 경험 카드 구현
- 활동 경험 작성 / 수정 공통 폼 구현
- 활동 경험 상세 화면과 삭제 확인 흐름 구현
- 경험 삭제 시 연결 분석 결과와 해당 경험을 참조하는 추천 결과 함께 삭제
- 기존 분석 결과가 있는 경험 수정 시 `needs_reanalysis` 상태로 바뀔 수 있도록 storage 로직 준비
- 생성 직후에는 생성일만 표시하고, 실제 수정 이후에만 수정일 표시
- 활동기간 시작월 / 종료월 입력 폼 적용
- `sampleExperiences.ts` 개발 참고용 샘플 데이터 작성
- `/api/analyze` AI 경험 분석 API Route 구현
- 활동 경험 상세 화면의 AI 분석 요청 CTA, loading / disabled, 실패 후 재시도 UI 구현
- 분석 결과를 `campuslog:v1:analyses`에 저장하고 경험의 `analysisStatus`를 `analyzed`로 변경하는 흐름 구현
- AI 경험 분석 결과 화면에서 요약, 핵심 역량 태그, 주요 성과, 키워드, 생성일 표시
- 기존 분석 결과가 있는 경험이 수정된 경우 `needs_reanalysis` 안내와 다시 분석 액션 제공
- `/api/recommend` AI 경험 추천 API Route 구현
- `/api/recommend` AI 추천 API에서 경험 선택과 선택 경험 기반 상세 추천 문장 생성을 분리
- AI 경험 추천 및 활용 화면에서 활용 목적 / 질문 입력, 경험 없음 / 입력 없음 / 로딩 / 실패 / 성공 상태 처리
- 추천 결과 화면에서 추천 경험 1개, 추천 이유, 관련 태그, 강조할 성과, 활용 방향, 참고 문장 표시
- 추천 참고 문장 클립보드 복사와 실패 안내 구현
- 추천 결과를 `campuslog:v1:recommendations`에 최근순 배열로 저장
- 왼쪽 내비게이션에서 AI 추천과 추천 기록 메뉴 분리
- `/recommend/history` 추천 기록 화면에서 과거 활용 목적 / 질문 / 추천 결과 다시 보기 구현
- 대시보드 UI/UX polish
- 대시보드 Primary / Secondary CTA 위계 정리
- 경험 목록 근처에 저장된 경험 개수와 정렬/필터 컨트롤 UI 배치
- 경험 카드 제목 / 분석 상태 / 기간 / 역할 / 미리보기 / AI 태그 / 수정일 위계 정리
- 대시보드 빈 상태, 목록 skeleton loading, 실패 Alert / 다시 시도 UI 정리
- 분석 상태 배지의 `미분석` / `분석 완료` / `재분석 필요` 라벨과 색상 정리
- 데스크톱 / 모바일 경험 목록 내부 스크롤 복구와 고정 `새 경험 기록하기` CTA 적용
- 브랜드 및 반응형 UI/UX 개선(responsive/brand polish)
- Campus Green + Mint 토큰, 링크 / 버튼 / 배지 / focus ring / hover 상태 정리
- 데스크톱 좌측 사이드바와 우측 메인 콘텐츠 정렬 보강
- 모바일 상단 App Bar, 세로 스크롤, CTA 풀폭 배치 보강
- ExperienceCard 긴 제목 / 긴 역할 / 긴 태그 / 상세 링크 줄바꿈 보강
- EmptyState 모바일 정렬과 버튼 간격 보강
- Lucide `BookMarked` 기반 `favicon.svg`, `app-icon.svg` 후보 적용

현재 구현은 인터랙티브 노트 UI가 Organization `main`에 병합된 뒤 `codex/fix-experience-list-scroll`에서 대시보드 목록 스크롤과 고정 CTA를 보강하고 변경 검토를 준비하는 단계입니다. 경험 저장 / 수정 / 삭제, AI 경험 분석 요청 / 결과 저장, AI 경험 추천 요청 / 결과 저장은 기존 localStorage와 Next.js API Route 흐름을 유지하며, 이번 단계에서는 해당 데이터 로직을 변경하지 않았습니다.

## 아직 시작하지 않은 작업

- 정렬 / 필터 실제 데이터 처리 구현
- README 실행 방법 보완
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

- [ ] `codex/fix-experience-list-scroll` 변경 검토 후 commit / push / PR 반영 여부 결정
- [ ] 모바일 AI 추천 진입과 WebGL 오류 fallback 후속 범위 결정
- [ ] Vercel 배포 준비

## 주의사항

- `PRD.md`의 MVP 범위와 제외 기능을 우선 기준으로 봅니다.
- 1차 MVP 기능 범위는 확정되었으므로 임의로 기능 우선순위를 바꾸지 않습니다.
- 로그인, 회원가입, 결제, 커뮤니티, 외부 서비스 자동 연동, 파일 첨부, 고급 추천 기능, Supabase, DB, UNIKER 이후 개인 Backend Portfolio Edition용 별도 백엔드 스택은 1차 MVP 제외 범위입니다.
- Supabase Auth / Postgres / Storage는 2차 MVP의 Next.js Full Stack + Supabase 범위로 보류되었습니다.
- Spring Boot, MySQL 또는 AWS RDS, AWS S3는 CampusLog 본 MVP가 아니라 UNIKER 이후 개인 Backend Portfolio Edition에서만 별도 검토합니다.
- 작성 / 수정 화면에서는 AI 분석 요청을 바로 실행하지 않고, 저장 후 활동 경험 상세 화면에서 AI 분석 요청을 실행합니다.
- API Key, 토큰, 비밀번호 등 민감한 정보는 문서나 코드에 직접 작성하지 않습니다.
- 로컬에서 AI 분석을 검증할 때 상위 쉘 환경의 기존 `OPENAI_API_KEY`가 `web/.env.local`보다 우선될 수 있으므로, 필요하면 `unset OPENAI_API_KEY` 또는 `env -u OPENAI_API_KEY npm run dev`로 `.env.local`의 키만 사용해 확인합니다.
- 실제 사용자 개인정보나 민감한 활동 기록을 샘플 데이터로 사용하지 않습니다.
- 기존 문서를 수정할 때는 수정 이유와 변경 내용을 `docs/TASK_LOG.md`에 남깁니다.
