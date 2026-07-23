# AI 실행 버튼 Animated Gradient 디자인

## 목적

CampusLog에서 AI 요청을 실제로 실행하는 버튼을 Magic UI의 Animated Gradient Text 데모와 최대한 유사한 시각 언어로 통일합니다. AI 결과 조회나 다른 화면으로 이동하는 버튼은 기존 위계를 유지해 실행 액션과 구분합니다.

## 적용 범위

다음 문구와 역할을 가진 AI 실행 버튼에 적용합니다.

- `AI 분석`
- `AI 분석 요청`
- `다시 분석하기`
- 요청 진행 중 표시인 `AI 분석 중...`, `분석 중...`

주요 적용 화면은 다음과 같습니다.

- CampusLog AI 추천 입력
- 나의 활동 인라인·독립 완료 경험 상세
- AI 분석 결과 독립 화면
- 나의 활동 AI 분석 스플릿 패널

다음 액션은 적용하지 않습니다.

- `AI 분석 결과`처럼 저장된 결과를 여는 버튼
- `AI 기반 활동 추천`, `새 추천 받기`처럼 다른 화면으로 이동하는 링크
- 활동 종료나 완료 경험 저장처럼 분석 요청 버튼이 아닌 일반 작업 버튼

## 시각 구조

공통 AI 실행 버튼은 아래 순서를 사용합니다.

1. 기존 의미 아이콘
2. Animated Gradient Text
3. 오른쪽 Chevron

Magic UI 데모의 세로 구분선은 사용하지 않습니다.

- 최초 분석과 분석 요청: 기존 `Sparkles` 아이콘의 외곽선 형태 유지
- 다시 분석: 기존 `RefreshCcw` 아이콘의 외곽선 형태 유지
- 아이콘 stroke: 텍스트와 같은 주황색·보라색 gradient가 흐르도록 표시
- 텍스트와 아이콘 사이 간격: 8px
- 형태: `AI 분석 결과`, `수정`, `삭제`와 같은 44px 높이·12px 모서리의 상세 액션 프레임
- 여백: 수평 14px, 수직 10px
- 글자: 기존 상세 액션과 같은 약 13.4px, 650 굵기
- 배경: 흰색
- 그림자: 사용하지 않음
- 테두리: 주황색에서 보라색으로 흐르는 1px animated gradient
- 텍스트: 동일한 주황색·보라색 animated gradient
- Chevron: 아이콘·텍스트와 같은 주황색·보라색 gradient stroke이며 hover에서 오른쪽으로 약 2px 이동

## 상호작용과 상태

- Hover: 기존 상세 액션과 같은 밝은 중립 배경으로 바뀌고 Chevron만 짧게 이동합니다.
- Focus visible: 기존 CampusLog 키보드 focus ring을 명확하게 표시합니다.
- Loading: 버튼의 크기와 위치를 유지한 채 기존 로딩 문구를 표시하고 중복 요청을 차단합니다.
- Disabled: 클릭을 막고 전체 채도와 불투명도를 낮추되 텍스트를 읽을 수 있어야 합니다.
- Reduced motion: 테두리·텍스트·아이콘 gradient와 Chevron 이동을 멈추고 정적인 gradient 상태를 유지합니다.
- 버튼의 기존 submit, click handler, `disabled`, `aria-busy` 계약은 변경하지 않습니다.

## 컴포넌트 구조

`AnimatedGradientActionButton` 공통 컴포넌트를 추가합니다.

- native button 속성과 ref를 전달합니다.
- `icon` 또는 children 앞의 기존 아이콘을 받을 수 있습니다.
- 테두리·텍스트·아이콘 gradient를 한 곳에서 관리합니다.
- 화면별 크기 보정은 기존 className을 통해 최소한으로 허용합니다.
- 새로운 UI 패키지나 Magic UI dependency는 설치하지 않고 제공된 구조를 프로젝트 코드로 구현합니다.

현재 `BorderBeamButton`을 사용하는 AI 실행 액션은 새 컴포넌트로 교체합니다. AI 실행에 사용 중인 일반 `RippleButton`도 같은 공통 컴포넌트로 교체해 화면마다 스타일과 상태가 달라지지 않게 합니다.

## 테스트와 검증

- 구조 테스트로 대상 AI 실행 버튼이 공통 컴포넌트를 사용하는지 확인합니다.
- 결과 조회·화면 이동 버튼은 공통 컴포넌트로 바뀌지 않았는지 확인합니다.
- lint, typecheck, build를 실행합니다.
- 로그인된 로컬 화면에서 추천 입력, 나의 활동 상세, 분석 화면의 기본·hover·focus·disabled 상태를 확인합니다.
- 모바일과 좁은 상세 패널에서 가로 잘림과 두 줄 배치가 없는지 확인합니다.
- `prefers-reduced-motion`에서 gradient 애니메이션과 Chevron 이동이 멈추는지 확인합니다.

## 영향 범위

- UI 컴포넌트와 스타일만 변경합니다.
- AI 요청 로직, API, schema, repository, 저장 데이터에는 변경이 없습니다.
- 기존 사용자 입력과 요청 실패·재시도 상태를 그대로 유지합니다.
