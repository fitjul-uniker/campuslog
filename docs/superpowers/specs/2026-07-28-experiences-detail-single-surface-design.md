# Experiences Detail Single-Surface Design

## Context

`/experiences`의 우측 활동 상세는 바깥 `.dashboard-experience-detail`이 흰색 64% Liquid Glass를 사용하고, 내부 `.dashboard-detail-meta`와 각 `.dashboard-detail-content section`은 흰색 92%, `.dashboard-detail-actions`는 흰색 44%를 사용한다. 서로 다른 세 재료가 중첩되어 하나의 상세 패널 안에서 흰색과 회색의 색 차이가 보인다.

사용자는 우측 상세 전체가 한 색으로 읽히길 요청했고, near-white 단일 표면과 내부 투명 구조를 승인했다.

## Goal

- 우측 활동 상세를 하나의 일관된 near-white 표면으로 표시한다.
- 내부 정보 구획은 배경색이 아니라 얇은 구분선과 간격으로 전달한다.
- 현재 상세·선택·스크롤·분석·액션 동작은 유지한다.

## Approved Presentation

- `.dashboard-experience-detail.liquid-section`은 `var(--liquid-content-fill)`을 사용한다.
- 상세 안의 `.dashboard-detail-meta`와 `.dashboard-detail-content section`은 `background: transparent`, `box-shadow: none`을 사용한다.
- `.dashboard-detail-actions`도 `background: transparent`, `box-shadow: none`, `backdrop-filter: none`으로 평탄화한다.
- 메타·본문 섹션의 기존 1px hairline 구분선과 spacing은 유지한다.
- 상세 외곽의 border, radius, shadow와 scrollbar는 유지해 페이지 배경과 패널 경계를 구분한다.
- 버튼 자체의 primary, destructive, hover, focus-visible 상태는 변경하지 않는다.

## Scope

이번 변경은 `.dashboard-experience-detail`에만 적용한다.

- AI 분석 스플릿 패널 내부의 분석 결과와 부족 정보 표면은 정보 밀도와 상호작용이 다르므로 변경하지 않는다.
- 목록 선택 행, 왼쪽 활동 목록, 브라우저 scrollbar는 변경하지 않는다.
- API, schema, repository, 인증, 사용자 데이터는 변경하지 않는다.

## Responsive and Accessibility

- 860px 이하 세로 배치에서도 전체 상세가 한 색으로 유지되어야 한다.
- 390px에서 메타 1열, 본문, 액션 버튼이 기존처럼 가로 overflow 없이 표시되어야 한다.
- 구분선 대비는 유지하고 텍스트 대비를 낮추지 않는다.
- focus-visible, forced colors, reduced motion 계약은 변경하지 않는다.

## Verification

- 실제 브라우저 계산값에서 상세·메타·본문·액션의 배경이 동일하게 보여야 한다.
- 내부 메타·본문·액션은 transparent이며 box shadow가 없어야 한다.
- 상세 외곽은 near-white 표면과 기존 shadow를 유지해야 한다.
- 390×844, 860×800, 861×800, 1024×800, 1400×900에서 가로 overflow가 없어야 한다.
- 선택, 상세 닫기, 분석 열기·닫기, scrollbar 동작이 유지되어야 한다.
- 전체 테스트, lint, typecheck, production build, `git diff --check`를 통과해야 한다.

## Documentation and Git

구현 후 `docs/DESIGN.md`, `docs/SCREEN_SPEC.md`, `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md`, `design-qa.md`를 실제 검증 결과에 맞게 갱신한다. commit, push, PR은 사용자의 별도 Git 승인 전까지 진행하지 않는다.
