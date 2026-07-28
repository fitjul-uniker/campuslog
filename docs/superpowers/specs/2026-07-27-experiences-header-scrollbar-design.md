# Experiences Header and Transient Scrollbar Design

## Goal

`/experiences`를 다른 CampusLog 상위 화면과 같은 `페이지 헤더 → 기능 섹션` 위계로 정리하고, 우측 상세·분석 패널의 내부 스크롤바는 실제 스크롤 중에만 보이게 한다.

## Problem Evidence

- 현재 `/experiences`는 `나의 활동` 제목, 설명, 개수, 검색이 `dashboard-experience-list-pane liquid-workspace` 안에 들어가 있어 페이지 제목과 목록이 하나의 Glass 카드처럼 보인다.
- `/dashboard`와 `/recommend`는 페이지 제목과 설명이 Glass 밖의 `primary-page-heading`에 있고, 실제 기능 영역만 별도 `liquid-workspace`로 구분된다.
- 우측 상세와 AI 분석 패널은 `overflow: auto`와 `scrollbar-gutter: stable`을 사용하며, 내부 스크롤바가 작업하지 않을 때도 지속적으로 눈에 들어온다.

확인한 화면:

- `docs/qa-artifacts/experiences-header-inside-surface-before.png`
- `docs/qa-artifacts/recommend-header-separated-reference.png`

## Approved Information Architecture

### Page Header

Glass 밖의 독립 `primary-page-heading`에 다음만 둔다.

- H1 `나의 활동`
- 설명 `진행 중인 활동과 완료된 경험을 한곳에서 확인합니다.`

페이지 Breadcrumb은 기존 위치와 계층을 유지한다.

### Activity Workspace

목록용 `dashboard-experience-list-pane liquid-workspace` 안에는 기능 섹션 헤더를 둔다.

- H2 `전체 활동`
- 전체 활동 개수
- `진행 중` 개수
- 검색 컨트롤
- 검색 결과 상태 문구

그 아래의 로딩, 오류, 빈 상태, 검색 빈 상태, 활동 목록은 기존 데이터와 사용자 동작을 유지한다.

### Detail and Analysis Layout

- 선택 전에는 목록 섹션이 현재 최대 폭을 유지한다.
- 활동 선택 후에는 페이지 헤더는 위에 그대로 남고, 목록과 상세만 아래 workspace에서 좌우로 나뉜다.
- AI 분석을 열면 기존처럼 목록을 숨기고 활동 상세와 분석 결과를 1:1로 표시한다.
- 닫기, Escape, 모바일 상세 이동, 검색, 삭제, 분석, repository 계약은 변경하지 않는다.

## Transient Internal Scrollbars

적용 대상:

- `.dashboard-experience-detail`
- `.dashboard-analysis-split-panel`

동작:

- 평소에는 track과 thumb를 모두 투명하게 표시한다.
- wheel, trackpad, 키보드, 터치 등으로 패널의 `scroll` 이벤트가 발생하면 `data-scrolling="true"`를 설정한다.
- 마지막 스크롤 이벤트 후 `700ms`가 지나면 속성을 제거한다.
- Firefox는 `scrollbar-color`, WebKit 계열은 `::-webkit-scrollbar-thumb`을 사용한다.
- `scrollbar-gutter: stable`은 콘텐츠 폭이 스크롤 상태마다 흔들리지 않도록 유지한다.
- 브라우저 전체 페이지 스크롤바와 좌측 활동 목록 스크롤바는 변경하지 않는다.
- forced colors에서는 시스템 스크롤바를 숨기지 않는다.
- 컴포넌트가 unmount될 때 대기 중인 timer를 정리한다.

공통 동작은 `useTransientScrollbar` hook으로 분리해 상세와 분석 패널이 같은 계약을 공유한다.

## Responsive Design

- 861px 이상: 페이지 헤더는 workspace 전체 폭을 기준으로 정렬하고, 목록·상세 또는 상세·분석 grid는 그 아래에 배치한다.
- 860px 이하: 페이지 헤더 다음에 목록 섹션을 세로로 표시한다.
- 640px 이하: `전체 활동`과 개수는 첫 줄, 검색은 가용 폭 안에서 다음 줄 또는 우측 44px trigger로 표시한다.
- 기존 가로 overflow 0과 44px 조작 영역을 유지한다.

## Accessibility

- 페이지 H1은 하나만 유지하고 목록 섹션은 H2 `전체 활동`으로 명명한다.
- 목록의 `aria-labelledby`는 새 H2를 가리킨다.
- 스크롤바 표시 여부와 관계없이 wheel, trackpad, 키보드, touch 스크롤을 막지 않는다.
- forced colors에서 시스템 스크롤바 가시성을 보존한다.
- reduced motion 설정과 무관하게 스크롤바 표시 자체는 즉시 전환하며 반복 애니메이션을 추가하지 않는다.

## Data and Logic Impact

- API, schema, repository, 인증, 사용자 데이터, AI 요청 계약 변경 없음
- 경험 선택, 검색, 상세 닫기, 분석 열기, 삭제 동작 변경 없음
- DOM 위계, heading level, 스크롤 표시 상태만 변경

## Verification

- 구조 테스트: H1 헤더가 목록 `liquid-workspace` 밖에 있고, 목록 안에 H2 `전체 활동`이 있는지 확인
- hook 테스트: scroll 이벤트 시 속성이 나타나고 700ms 이후 제거되며 cleanup되는 계약 확인
- CSS 테스트: 기본 투명 scrollbar, scrolling 상태, forced colors fallback 확인
- 전체 Node 테스트, ESLint, TypeScript, Next.js production build, `git diff --check`
- 브라우저: 1400×900, 1024×800, 861×800, 860×800, 390×844에서 헤더 분리·목록/상세 배치·가로 overflow 확인
- 상세와 분석 패널에서 스크롤 중 thumb 표시, 정지 700ms 후 숨김, 콘텐츠 폭 변화 없음 확인
