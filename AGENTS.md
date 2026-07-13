# AGENTS.md v4

## Product

CampusLog는 대학생이 프로젝트, 공모전, 인턴, 대외활동 등 다양한 활동 경험을 기록하고, AI 분석과 추천을 통해 자기소개서·포트폴리오·면접 준비에 다시 활용하도록 돕는 서비스입니다.

1차 MVP와 v1.1 제품 고도화는 완료 기준선입니다. 현재 활성 계획 단계는 **2차 MVP**이며 기능 구현은 v1.1 merge 후 시작합니다. 작업 단계와 허용 범위는 반드시 `docs/CURRENT_PHASE.md`에서 확인합니다.

## Source of truth

작업을 시작할 때 필요한 문서를 직접 열어 확인하고, 완료 보고에 확인한 문서를 적습니다.

현재 기준 우선순위는 아래와 같습니다.

1. 현재 대화에서 사용자가 명시적으로 승인한 요구사항
2. `docs/CURRENT_PHASE.md`: 활성 단계, 작업 Track, 포함·제외 범위, 완료 조건
3. `PRD.md`: 현재 제품 목표와 성공 기준
4. `docs/USER_FLOW.md`: 현재 사용자 흐름
5. `docs/IA.md`: 메뉴·라우트·화면 관계
6. `docs/SCREEN_SPEC.md`: 화면별 입력, 출력, 상태, 버튼 동작
7. `docs/DESIGN.md`: 현재 디자인 시스템과 UX 품질 기준
8. 현재 코드, schema, API 계약과 테스트 결과
9. `README.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/GIT_WORKFLOW.md`
10. `docs/TODO.md`, `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`
11. `docs/archive/**`: 회고와 회귀 확인용이며 현재 구현을 제한하지 않음

기능 범위 판단은 `docs/CURRENT_PHASE.md`와 `PRD.md`를 우선합니다. 문서와 코드가 다르면 무조건 과거 문서로 되돌리지 않고, 현재 사용자 요구와 활성 단계에 맞는 의도를 확인해 코드와 관련 문서를 함께 정리합니다.

사용자가 현재 작업에서 범위 확장을 명시적으로 승인했다면 과거 1차 MVP 제외 목록을 이유로 작업을 중단하지 않습니다. 대신 같은 작업 또는 연결된 문서 PR에서 단계·PRD·화면 명세·결정 기록을 갱신합니다.

작업 유형별 확인 순서:

- 단계 / 기능 범위: `docs/CURRENT_PHASE.md` → `PRD.md` → `docs/TODO.md` → `docs/WORK_STATUS.md`
- 인증 / DB / 데이터: `docs/CURRENT_PHASE.md` → `PRD.md` → `docs/USER_FLOW.md` → `docs/SCREEN_SPEC.md` → schema / API 코드
- AI 분석 / 추천: `docs/CURRENT_PHASE.md` → `PRD.md` → `docs/USER_FLOW.md` → `docs/SCREEN_SPEC.md` → API 코드
- UI / UX: `docs/CURRENT_PHASE.md` → `docs/DESIGN.md` → `docs/SCREEN_SPEC.md` → `docs/IA.md` → 현재 코드
- 사용자 흐름: `docs/USER_FLOW.md` → `docs/IA.md` → `docs/SCREEN_SPEC.md`
- Git / PR: `docs/GIT_WORKFLOW.md` → 현재 브랜치와 `git status`

## Current development tracks

### v1.1 baseline

아래 흐름은 이미 완성된 기준선이며 2차 MVP에서도 회귀시키지 않습니다.

```text
활동 추가
→ 날짜별 한 일 기록
→ 캘린더 확인
→ 활동 종료
→ AI 완료 경험 합성
→ 나의 활동 저장
→ AI 분석
→ CampusLog AI 추천과 추천 기록
```

상세 기록은 `docs/archive/MVP_V1_1_BASELINE.md`를 참고합니다.

### Track A — 인증·데이터·AI 고도화

다른 팀원이 담당합니다.

- 이메일 또는 이에 준하는 아이디 + 비밀번호 로그인 / 회원가입 / 로그아웃 / 세션
- Google OAuth 로그인
- Supabase Auth / Postgres와 사용자별 접근 제어
- 필요 시 Supabase Storage
- localStorage 데이터의 계정 이전 정책
- AI 분석 및 추천 품질·근거·결과 구조 고도화
- JD / 직무 요구사항 / 우대사항 원문 기반 경험 추천과 부족 경험 비교
- 질문 이미지 OCR / vision 입력과 답변 초안 생성
- 인증된 API, 입력 검증, rate limit, 비용 한도, 오류 로깅

### Track B — 디자인·사용자 경험 고도화

사용자가 담당합니다.

- 검정·차콜 기반 최신 CampusLog 디자인 시스템
- 정보 구조, 폼, 문구, 탐색 흐름 개선
- 인증 및 데이터 전환 UX
- 로딩, 빈 상태, 오류, 성공, 네트워크 복구 상태
- 모바일 / 데스크톱 반응형과 접근성
- 과한 색상·그라디언트·반복 애니메이션 없는 미니멀 SaaS 완성도

### Track coordination

- 디자인 Track은 API·DB 계약을 임의로 바꾸지 않습니다.
- 데이터·AI Track은 승인된 사용자 흐름과 화면 상태를 임의로 바꾸지 않습니다.
- 계약 변경은 관련 타입 / schema / API 문서와 화면 상태를 함께 갱신합니다.
- 같은 파일을 양쪽 Track에서 수정해야 하면 담당자와 병합 순서를 먼저 정합니다.

## Development workflow

한 번의 작업은 하나의 명확한 목적을 가져야 하며 검증 가능한 작은 단위로 끝냅니다.

1. 요구사항, 담당 Track, 수정 범위와 기존 변경 상태를 확인합니다.
2. 성공 기준과 검증 방법을 먼저 정합니다.
3. 하나의 화면, 흐름, schema 또는 API 계약 단위로 구현합니다.
4. 사용자 데이터와 기존 v1.1 흐름을 보존합니다.
5. 코드와 관련 활성 문서를 함께 갱신합니다.
6. lint, typecheck, build, 테스트 또는 브라우저 확인 후 보고합니다.

현재 작업 트리가 이미 수정된 상태라면 기존 변경을 사용자 소유로 보고 보존합니다. 관련 없는 파일을 정리하거나 되돌리지 않습니다.

## 2nd MVP scope

현재 허용 범위:

- 이메일 또는 이에 준하는 아이디 + 비밀번호 인증과 Google OAuth 세션
- 사용자별 DB 저장과 접근 제어
- 기존 localStorage 데이터의 안전한 이전 또는 유지 정책
- 현재 활동·경험·분석·추천 기능의 DB 연결
- AI 분석·추천 품질과 결과 활용 흐름 고도화
- 디자인 시스템, 주요 화면과 전체 UX 고도화
- 공개 배포를 위한 보안, 비용, 관측성, 접근성 개선

별도 승인 전 제외 범위:

- 결제 / 구독
- 커뮤니티 / 팀 협업
- 전체 관리자 시스템
- 네이티브 모바일 앱
- 공개 프로필 / 소셜 기능
- 외부 서비스 자동 동기화
- PDF 포트폴리오 자동 생성
- UNIKER 이후 개인 Backend Portfolio Edition의 Spring Boot / MySQL / AWS 스택

## Build and verify

공통 회귀 확인:

- 활동 추가와 날짜별 기록이 동작하는가
- 활동 종료 후 AI 초안과 완료 경험 저장이 유지되는가
- 나의 활동에서 진행 활동과 완료 경험을 확인할 수 있는가
- AI 분석과 CampusLog AI 추천 흐름이 유지되는가

Track A 추가 확인:

- 로그인·회원가입·로그아웃과 세션 복구가 동작하는가
- 사용자별 데이터가 분리되고 다른 사용자 데이터에 접근할 수 없는가
- localStorage 마이그레이션이 중복·손실 없이 처리되는가
- API 인증, 입력 검증, rate limit, 비용 제한이 적용되는가
- AI 결과가 근거와 실패·재시도 상태를 제공하는가

Track B 추가 확인:

- `docs/DESIGN.md`의 최신 토큰과 화면 밀도를 따르는가
- 모바일과 데스크톱에서 가로 잘림이 없는가
- 키보드 접근성, focus-visible, 텍스트 대비, reduced motion을 지키는가
- loading / empty / error / success 상태가 사용자에게 명확한가
- 핵심 CTA와 읽기 흐름을 장식이나 모션이 가리지 않는가

## Security and privacy guardrails

- API Key, 토큰, 비밀번호, service role key를 코드나 문서에 직접 넣지 않습니다.
- 실제 값은 서버 환경 변수로 관리하고 예시에는 placeholder만 사용합니다.
- `.env`와 실제 사용자 데이터를 커밋하지 않습니다.
- 인증 토큰과 관리자 권한을 브라우저에 노출하지 않습니다.
- Row Level Security 또는 동등한 사용자별 접근 제어를 검증합니다.
- 샘플 데이터에는 전화번호, 이메일, 학번, 주소, 실제 지원서 원문 등 민감정보를 넣지 않습니다.
- AI 요청에는 기능에 필요한 최소 데이터만 전달하고, 사용자 입력을 비신뢰 데이터로 취급합니다.
- 데이터 삭제, 계정 삭제, 마이그레이션처럼 되돌리기 어려운 작업은 구현 전 정책을 확정합니다.
- 공개 배포 전 AI 호출 빈도 제한과 OpenAI project spend limit / alert를 설정합니다.

## Change safety

- 요청하지 않은 파일은 수정하지 않습니다.
- 대규모 리팩토링은 기능 변경과 분리합니다.
- 기존 내용을 삭제하거나 대체하기 전 이유와 마이그레이션 영향을 확인합니다.
- 새 dependency는 품질, 안정성, 유지보수성에 실질적 이점이 있을 때만 추가합니다.
- schema와 저장소를 바꿀 때 기존 데이터 호환, rollback, 중복 방지 정책을 함께 구현합니다.
- 현재 active 문서에는 최신 기준을 한 번만 적고, 하단 override를 계속 덧붙이지 않습니다.
- 과거 기준은 `docs/archive/**`로 이동합니다.

변경 후 기록 문서 갱신:

- `docs/WORK_STATUS.md`: 현재 단계, 완료 / 미완료, 다음 작업
- `docs/TASK_LOG.md`: 수정 파일, 이유, 검증 결과
- `docs/ISSUE_LOG.md`: 범위 변경, 결정, 위험, 보류 이슈
- `docs/TODO.md`: Track별 우선순위와 담당 상태

## Git and PR rules

- `main`은 안정 상태로 유지하고 직접 수정하지 않습니다.
- v1.1 변경은 검증 후 commit / push / review / merge하고, 이후 2차 MVP 브랜치를 시작합니다.
- 하나의 브랜치와 PR에는 하나의 목적만 담습니다.
- 권장 브랜치:
  - `feature/auth-*`, `feature/database-*`, `feature/ai-*`
  - `design/*`, `ux/*`
  - `fix/*`, `refactor/*`, `docs/*`
- 커밋과 PR 제목은 영어, PR 본문은 한국어로 작성합니다.
- PR에는 작업 Track, 목적, schema / API / UI 영향, 마이그레이션, 검증, 남은 이슈를 적습니다.
- 사용자가 승인하기 전에는 commit, push, PR 생성, merge를 진행하지 않습니다.
- merge 후 브랜치를 삭제하기 전 사용자에게 확인합니다.

## Review rules

구현과 최종 리뷰 관점을 분리합니다.

- 인증 / 권한: auth / security reviewer
- DB / migration: data / schema reviewer
- AI Route: api / AI reviewer
- UI / UX: web / accessibility reviewer
- 전체 완료: integration reviewer

심각도:

- `critical`: 개인정보·인증정보 유출, 권한 우회, 다른 사용자 데이터 접근, 데이터 손실, 무제한 비용 위험
- `major`: 로그인·저장·AI·핵심 흐름 불능, schema / 화면 계약 충돌, 마이그레이션 오류, 필수 검증 누락
- `minor`: UI 세부 불일치, 네이밍, 카피, 문서 정합성, 작은 중복
- `suggestion`: 다음 작업에서 개선 가능한 제안

## Output format

작업 완료 후 아래 형식으로 요약합니다.

```text
작업 전 정리:
- 요구사항 / 담당 Track:
- 수정 범위:
- 확인한 기준 문서:
- 성공 기준:
- 검증 방법:

작업 완료 요약:
- 수정한 파일:
- 주요 변경 내용:
- 사용자 흐름 영향:
- schema / API / 데이터 영향:
- 주요 컴포넌트 / 함수 역할:
- 확인한 기준 문서:
- 검증한 내용:
- 테스트 / 확인 방법:
- 보안 / 개인정보 확인:
- 남은 이슈:
- 의도적으로 수정하지 않은 파일:
- 기록 문서 업데이트:
- git diff 요약:
- 추천 커밋 메시지:
```
