# Analysis Gap Warning Alert Design

## 목적

`/experiences`의 AI 분석 스플릿뷰에서 부족 정보 질문의 보완 이유를 답변 입력 흐름과 더 자연스럽게 연결한다.

## 승인된 구조

열린 `MorphSurface`의 내용 순서는 다음과 같다.

1. 전체 보완 질문
2. placeholder가 없는 답변 textarea
3. ReUI `Warning alert`를 참고한 제목 없는 분석 사유 Alert
4. 글자 수·저장 상태와 `답변 저장` 버튼

## 컴포넌트

- `Alert`, `AlertTitle`, `AlertDescription`을 `web/src/components/reui/alert.tsx`에 추가한다.
- Alert primitive는 아이콘·제목·설명을 조합할 수 있고 `warning` variant를 지원한다.
- 부족 정보 화면은 별도 제목 없이 `AlertTriangleIcon`과 `AlertDescription`의 `item.reason`만 사용한다.
- 정적인 설명이므로 강제 알림을 발생시키지 않고 `role="note"`로 렌더링한다.

## 시각 기준

- ReUI Warning Alert의 아이콘·설명 계층을 따르되 별도 제목은 표시하지 않는다.
- CampusLog의 흰색 MorphSurface 안에서 과도하게 튀지 않도록 옅은 웜 앰버 배경, 얇은 앰버 경계, 차콜 본문을 사용한다.
- 모서리는 12px, 내부 간격은 조밀하게 유지하고 그림자·그라디언트·반복 모션은 추가하지 않는다.
- 작은 화면에서도 Alert와 textarea가 가용 폭을 채우고 가로 overflow를 만들지 않는다.

## 유지하는 동작

- MorphSurface 한 개 열림, 바깥 클릭·Escape 닫기, textarea 자동 초점
- Command/Ctrl+Enter 저장
- 저장 중·오류·작성·완료 상태, 글자 수, 저장 버튼
- 보완 답변 repository와 추천·재분석 데이터 흐름

## 검증

- 기존 source structure test를 RED→GREEN으로 전환해 Alert 합성, reason 위치, 빈 placeholder를 확인한다.
- 전체 Node 테스트, lint, typecheck, production build를 실행한다.
- 로그인된 `/experiences`에서 열린 부족 정보 질문을 확인하고 Alert가 textarea 아래에 있으며 가로 overflow와 런타임 오류가 없는지 검사한다.
