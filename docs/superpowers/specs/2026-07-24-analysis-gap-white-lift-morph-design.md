# AI 부족 정보 White Lift Morph 디자인

## 목적

AI 분석 결과의 `부족한 정보` 질문을 기존 CampusLog 카드와 구분되는 현대적인
MorphSurface로 다듬는다. 질문은 작고 정제된 흰색 command surface로 보이고,
열릴 때 아래로 늘어나는 아코디언이 아니라 하나의 오브젝트가 위로 떠오르며
커지는 감각을 제공해야 한다.

## 승인된 시각 방향

- 사용자가 선택한 방향은 세 번째 `White Command Surface`다.
- 표면색은 흰색과 near-white만 사용한다.
- 텍스트와 주요 액션은 검정·차콜, 보조 정보는 중립 회색만 사용한다.
- 색상 강조, gradient, beige fill, 유리 질감과 무거운 그림자는 사용하지 않는다.
- 닫힌 질문은 56~60px 높이의 흰색 command bar로 표시한다.
- 왼쪽에는 얇은 원형 상태 아이콘, 가운데에는 작은 분류와 질문, 오른쪽에는
  답변 상태와 Chevron을 배치한다.

## 닫힌 상태

- 표면은 `18px` radius, 흰색 배경, neutral hairline과 매우 약한 ambient
  shadow를 사용한다.
- 분류는 작은 회색 텍스트, 질문은 한 줄 차콜 텍스트로 표시한다.
- 질문이 길면 한 줄 말줄임 처리하되 접근 가능한 이름에는 전체 질문을 유지한다.
- 답변 완료는 체크 아이콘과 `답변 완료`, 미답변은 도움말 아이콘과
  `답변 필요`로 구분한다.
- hover에서는 색을 바꾸지 않고 표면을 `1~2px` 들어 올리며 shadow만 조금
  선명하게 한다.

## 열린 상태

- 닫힌 command bar가 별도 카드로 교체되지 않고 같은 흰색 표면으로 확장된다.
- 표면 상단에는 기존 분류·질문·상태·Chevron 구조를 유지한다.
- 본문에는 전체 질문, 짧은 필요 이유, 답변 입력, 글자 수·키보드 안내와
  저장 상태를 표시한다.
- textarea는 notebook line 배경을 제거하고 흰색 바탕과 한 개의 얇은 경계만
  사용한다.
- 저장 버튼은 compact charcoal button으로 오른쪽 아래에 배치한다.
- 입력 영역과 액션을 별도 카드로 감싸지 않는다.

## 위로 떠오르는 모션

현재 구현처럼 표면 상단을 고정하고 아래로 높이만 늘리지 않는다.

- 열림 시작 시 전체 표면을 `translateY(-10px)`에서 `-14px` 범위로 부상시킨다.
- `transform-origin`은 `center bottom`에 가깝게 설정해 아래쪽 캡슐에서
  위쪽으로 크기가 자라는 인상을 만든다.
- 외곽 표면의 lift와 radius 변화는 spring으로 연결한다.
- 본문은 아래에서 위로 들어오는 `positive y → 0` 전환을 사용하지 않는다.
  대신 표면 내부 상단에서 `negative y → 0`과 opacity를 함께 사용해 내용도
  위에서 자리 잡는 느낌을 준다.
- 주변 질문은 열린 표면과 충돌하거나 겹치지 않고 layout animation으로
  자연스럽게 자리를 내준다.
- 닫힘에서는 내용이 먼저 짧게 사라지고 표면이 원래 command bar 위치로
  내려앉는다.
- 질문을 빠르게 전환해도 이전 표면이 아래로 튀거나 빈 사각형을 남기지 않는다.

## 반응형과 접근성

- 표면은 모든 폭에서 `width: 100%`, `min-width: 0`을 사용한다.
- 모바일에서는 lift 값을 조금 줄여 주변 콘텐츠가 화면 밖으로 밀리지 않게 한다.
- 44px 이상의 실제 button trigger, `aria-expanded`, `aria-controls`,
  `focus-visible`을 유지한다.
- 열림 시 textarea 초점, Escape 닫기와 trigger 초점 복귀, 바깥 클릭 닫기,
  Command/Ctrl+Enter 저장 계약을 유지한다.
- reduced motion에서는 lift, spring과 내부 이동을 제거하고 짧은 opacity
  전환만 사용한다.

## 데이터와 범위

- `evidenceGaps`, `experience_followups`, gap answer 저장 구조는 변경하지 않는다.
- API, schema, repository 호출 순서와 저장 성공·실패 계약은 변경하지 않는다.
- 변경 범위는 `MorphSurface`, `AnalysisGapAnswerList`의 표시 구조와 관련
  스타일·테스트로 제한한다.
- 다른 AI 결과 카드나 CampusLog 공통 카드 전체를 재설계하지 않는다.

## 검증 기준

- 닫힌 질문이 기존 beige 카드가 아닌 흰색 command surface로 보인다.
- 질문을 열면 표면 전체가 먼저 위로 부상한 뒤 크기가 확장되는 인상을 준다.
- 본문이 아래로 떨어지거나 열린 표면이 단순 아코디언처럼 보이지 않는다.
- 빠른 질문 전환과 닫힘에서 빈 사각형, 겹침, 스크롤 점프가 없다.
- 데스크톱과 390px 모바일에서 가로 overflow가 없다.
- 키보드·초점·저장 오류 유지와 reduced motion 동작이 기존 계약을 지킨다.
