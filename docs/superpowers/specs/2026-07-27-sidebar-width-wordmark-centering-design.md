# CampusLog Sidebar Width and Wordmark Centering Design

## Goal

브라우저 폭을 늘리거나 줄여도 데스크톱 `CampusLog` 워드마크가 inset 사이드바의 시각적 중심에 유지되고, 메뉴와 계정 영역이 답답하지 않도록 사이드바 폭을 소폭 확장한다.

## Approved Direction

- 1180px 이상 데스크톱의 Liquid Glass 사이드바 폭은 `224px`로 사용한다.
- 861~1179px compact desktop의 사이드바 폭은 `200px`로 사용한다.
- 워드마크 링크는 사이드바의 실제 `left`와 `width`를 공유하고 내부 콘텐츠를 가운데 정렬한다.
- 메인 콘텐츠의 폭과 왼쪽 여백은 기존 `--liquid-sidebar-width` 계산을 그대로 사용해 사이드바 확장량만큼 함께 이동한다.
- 860px 이하 모바일 앱 바와 모바일 워드마크는 변경하지 않는다.

## UX and Responsive Constraints

- 워드마크의 중심과 사이드바의 중심 차이는 시각적으로 발생하지 않아야 한다.
- 데스크톱과 compact desktop 모두 사이드바의 inset 값과 워드마크의 `left` 값이 같아야 한다.
- 860px 이하에서는 기존처럼 데스크톱 사이드바와 `.app-brand`를 숨기고 모바일 헤더를 사용한다.
- 가로 overflow를 새로 만들지 않는다.
- API, schema, repository, 인증, 사용자 데이터 흐름은 변경하지 않는다.

## Files

- `web/src/app/globals.css`: Liquid Glass 사이드바 폭과 워드마크 정렬
- `web/src/components/layout/AppShell.structure.test.mjs`: 반응형 셸 회귀 테스트
- `docs/DESIGN.md`, `docs/SCREEN_SPEC.md`: 활성 디자인 기준
- `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md`: 실제 작업 기록
- `design-qa.md`: 검증한 viewport와 결과

## Verification

- 구조 테스트에서 wide `224px`, compact `200px`, 동일 inset과 가운데 정렬, 모바일 전환 유지 확인
- 전체 Node 구조 테스트, ESLint, TypeScript, Next.js build, `git diff --check`
- 1400px, 1024px, 861px, 860px에서 워드마크/사이드바 중심과 가로 overflow 확인
