# Design QA — AI 분석 부족 정보 MorphSurface

final result: passed

## Source of truth

- 선택 시안: `/Users/kwban1/.codex/generated_images/019f7a72-a24f-7773-b732-f252d65635b4/call_3FU1oNyB1e7VPdcKMGe17z0J.png`
- 구현 캡처: `/Users/kwban1/Desktop/UNIKER/Developer/campuslog/design-qa-implementation.png`
- 나란히 비교: `/Users/kwban1/Desktop/UNIKER/Developer/campuslog/design-qa-comparison.png`
- 확인 화면: `http://localhost:3000/experiences`

## Comparison

| 항목 | 결과 | 확인 내용 |
| --- | --- | --- |
| 시각 계층 | PASS | 섹션 제목 → 닫힌 질문 행 → 열린 질문 본문 → 저장 액션 순서가 유지된다. |
| 색상 | PASS | 표면은 흰색, 텍스트와 CTA는 차콜, 보조 정보는 중립 회색만 사용한다. |
| 닫힌 상태 | PASS | 원형 상태 아이콘, 작은 카테고리, 한 줄 질문, 상태, Chevron 구조가 시안과 일치한다. |
| 열린 상태 | PASS | 같은 표면 안에서 질문·이유·입력·메타·저장 액션이 드러난다. |
| 모션 방향 | PASS | 데스크톱은 `-12px`, 모바일은 순수 이동량 `-8px`로 위쪽에 부상하며 본문도 음의 y축에서 진입한다. |
| 밀도와 여백 | PASS | 실제 1:1 스플릿 패널 폭에 맞춰 시안보다 폭과 패딩을 축소했지만 정보 순서와 호흡은 유지한다. |
| 반응형 | PASS | 390×844에서 가로 넘침 없이 한 열로 표시되고 저장 버튼은 전체 폭을 사용한다. |
| 접근성 | PASS | `aria-expanded`/`aria-controls`, Escape 닫기, 트리거 포커스 복원, reduced motion 분기를 유지한다. |

## Findings

- P0: 없음
- P1: 없음
- P2: 없음
- 의도적 차이: 선택 시안은 단독 데모 폭이고 실제 구현은 나의 활동 1:1 스플릿 패널 안에 들어가므로 글자 크기와 내부 여백을 반응형으로 축소했다.
- 저장 성공 경로는 사용자 데이터를 변경하므로 브라우저에서는 실행하지 않았고, 기존 저장 함수 호출과 성공 후 닫기 계약은 구조 테스트로 확인했다.
