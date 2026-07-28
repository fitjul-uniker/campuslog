# Experiences Selection and Scrollbar Polish Design

## Context

`/experiences`에서 활동을 선택하면 목록의 선택 항목만 거의 불투명한 흰색 표면과 그림자를 사용해 회색빛 Liquid Glass 목록 위에 별도 탭처럼 떠 보인다. 우측 상세·분석 패널의 스크롤바는 마지막 스크롤 이벤트 700ms 뒤 투명 상태로 즉시 바뀌어 갑자기 사라지는 인상을 준다.

이번 변경은 사용자가 승인한 다음 방향을 적용한다.

- 선택 항목은 흰색 카드가 아니라 목록 안의 평평한 차콜 틴트로 표시한다.
- 선택 상태는 굵은 글자와 얇은 왼쪽 인디케이터로 보강한다.
- 스크롤바는 유휴 상태에도 아주 옅게 남기고 스크롤 중에는 더 진하게 표시한다.

## Goals

- 선택 항목이 목록과 같은 재료 계층 안에서 읽히게 한다.
- 흰색과 회색 표면이 겹쳐 보이는 현상을 제거한다.
- 스크롤 가능성을 계속 인지할 수 있게 하면서 콘텐츠보다 스크롤바가 두드러지지 않게 한다.
- 기존 목록 선택, 상세 열기, 키보드 탐색, 분석 패널, 반응형 흐름을 유지한다.

## Non-goals

- 목록·상세의 정보 구조나 활동 데이터를 변경하지 않는다.
- 사이드바의 현재 메뉴 capsule은 변경하지 않는다.
- 브라우저 페이지 스크롤바와 왼쪽 활동 목록 스크롤바는 변경하지 않는다.
- API, schema, repository, 인증, 사용자 데이터를 변경하지 않는다.

## Selected Activity Treatment

선택된 `.dashboard-experience-title-button`은 다음 표현을 사용한다.

- 배경: `rgb(29 29 31 / 5.5%)` 수준의 옅은 차콜 틴트
- 그림자: 제거
- 테두리: 별도 흰색 경계 없이 투명 유지
- 모서리: 현재 14px radius 유지
- 글자: 현재 선택 굵기 유지
- 왼쪽 인디케이터: 버튼 안쪽에 2px 차콜 선을 세로 중앙 24px 높이로 표시
- hover: 선택 상태에서는 틴트를 약간만 진하게 하고 위치·크기를 바꾸지 않음
- focus-visible: 기존 outline을 유지해 인디케이터와 별개로 키보드 초점을 전달

인디케이터는 `::before` 의사 요소로 구현하고 장식이므로 접근성 트리에 추가하지 않는다. 버튼의 기존 선택 의미, `aria-current`, `aria-controls`, 목록 포커스 이동은 그대로 유지한다.

## Scrollbar Treatment

우측 `.dashboard-experience-detail`과 `.dashboard-analysis-split-panel`만 다음 상태를 사용한다.

- 유휴 상태: 6px gutter 안에 `rgb(101 105 112 / 18%)` thumb
- 스크롤 중: `rgb(101 105 112 / 52%)` thumb
- 전환: thumb 색상·opacity를 180~220ms ease로 전환
- 활성 유지: 마지막 스크롤 이벤트 900ms 뒤 유휴 상태로 복귀
- 폭: `scrollbar-gutter: stable`을 유지해 상태 전환 전후 `clientWidth`가 같아야 함
- forced colors: 시스템 스크롤바를 그대로 표시

스크롤바는 더 이상 완전히 투명해지지 않는다. `data-scrolling="true"`는 활성 강도를 표시하는 상태로만 사용한다. 기존 공용 controller/hook 구조와 cleanup은 유지하고 delay 상수만 900ms로 조정한다.

## Responsive and Accessibility

- 861px 이상 목록·상세/분석 분할 구조에서 선택 인디케이터가 목록 폭을 밀지 않아야 한다.
- 860px 이하 단일 열에서도 선택 행과 텍스트가 잘리지 않아야 한다.
- 390px에서 인디케이터, 제목, 상태 배지가 겹치지 않아야 한다.
- hover 없는 장치에서도 선택 배경과 인디케이터가 유지된다.
- reduced motion에서는 스크롤바 색 전환 시간을 80ms 이하로 줄인다.
- forced colors에서는 사용자 에이전트가 제공하는 선택·스크롤바 대비를 막지 않는다.

## Verification

- 선택 항목에 흰색 불투명 배경과 drop shadow가 없어야 한다.
- 선택 항목은 차콜 틴트와 2px 왼쪽 인디케이터를 가져야 한다.
- 스크롤바는 유휴 상태에서도 옅게 보이고 스크롤 중 진해져야 한다.
- 마지막 이벤트 900ms 뒤 `data-scrolling`은 제거되지만 thumb는 완전히 사라지지 않아야 한다.
- 상세와 분석 패널 `clientWidth`는 상태 전환 전후 동일해야 한다.
- 390×844, 860×800, 861×800, 1024×800, 1400×900에서 가로 overflow가 없어야 한다.
- 전체 구조·동작 테스트, lint, typecheck, production build, `git diff --check`를 통과해야 한다.

## Documentation and Git

구현 후 `docs/DESIGN.md`, `docs/SCREEN_SPEC.md`, `docs/TODO.md`, `docs/TASK_LOG.md`, `docs/ISSUE_LOG.md`, `docs/WORK_STATUS.md`, `design-qa.md`를 실제 검증 결과에 맞게 갱신한다. commit, push, PR은 사용자의 별도 Git 승인 전까지 진행하지 않는다.
