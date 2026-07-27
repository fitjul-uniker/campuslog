# Design QA — AI 분석 부족 정보 Warning Alert

- source visual truth: 현재 작업의 `browser: textarea` 주석 스크린샷(1084×789)과 ReUI Warning Alert (`https://reui.io/components/alert`)
- implementation screenshot: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/campuslog-analysis-gap-warning-alert-final-1084.png`
- responsive screenshot: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/campuslog-analysis-gap-warning-alert-390.png`
- viewport / pixels: source 1084×789, implementation 1084×789 CSS px, device density 기본값; 추가 390×844 CSS px 검증
- state: 로그인 test1, 네스트넷 완료 경험, AI 분석 스플릿뷰, 역할 범위 부족 정보 토글 열림

## Full-view comparison evidence

- 기존 질문·textarea·저장 흐름과 MorphSurface 프레임은 유지됐다.
- 일반 문단이던 분석 사유는 textarea 아래 웜 앰버 Warning Alert로 이동했다.
- 사용자의 최종 요청대로 Alert 제목과 textarea placeholder는 표시되지 않는다.

## Focused region comparison evidence

- 변경 범위가 열린 질문의 단일 입력 영역이고 1084px 캡처에서 질문·textarea·Alert가 함께 읽히므로 별도 확대 비교는 필요하지 않았다.
- DOM 측정에서 textarea top 515.38px, Alert top 664.98px, action top 766.86px로 승인 순서를 확인했다.
- Alert는 12px radius, 옅은 앰버 경계·배경, 18px Lucide 경고 아이콘을 사용한다.

## Findings

- P0: 없음
- P1: 없음
- P2: 없음
- P3: 긴 분석 사유는 현재 스플릿 패널 하단에서 일부가 viewport 아래로 이어지지만 패널 스크롤로 읽을 수 있으며 기존 입력 흐름을 막지 않는다.

## Required fidelity surfaces

- fonts / typography: 기존 CampusLog UI 서체·본문 크기·행간 유지
- spacing / layout: textarea → 14px gap → Alert → 14px gap → action 순서, 가로 overflow 0
- colors / tokens: 웜 앰버 warning 표면을 사용하고 과한 채도·그림자·그라디언트 없음
- image / icon quality: 별도 raster asset 없음, lucide-react `AlertTriangleIcon` 사용
- copy / content: 기존 분석 사유 원문 유지, `보완이 필요한 이유` 제목과 textarea placeholder 제거

## Comparison history

- 초기 화면: 분석 사유가 질문 아래 일반 문단, textarea에 반복 안내 placeholder가 표시됨.
- 1차 구현: textarea 아래 제목·설명 Warning Alert로 이동.
- 사용자 수정: `보완이 필요한 이유` 제목 제거.
- 최종 구현: textarea 아래 경고 아이콘·사유 문장만 표시, 1084px·390px overflow 0, error log·runtime overlay 0.

final result: passed

---

# Design QA — AI 추천 페이지 시각 밀도 개선

- 결과: **Passed**
- 확인 화면: `http://localhost:3000/recommend`
- 구현 캡처: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/campuslog-recommend-final-history-restored.png` (1280×720 viewport)
- 사용자 확인 사항: `추천 기록`은 이전 History 아이콘·ghost 링크·반응형 배치로 유지하고, Gallery 위의 중복 `이미지 첨부` 제목은 제거

## 확인 결과

- `추천 기록`은 기존 History 아이콘·ghost 링크로 표시되며 44px 조작 영역을 유지한다.
- 업로드 영역 위의 `이미지 첨부`는 화면에 보이지 않고 1×1px clipped fieldset legend로 유지된다.
- 페이지 설명은 지원 문항·JD에 사용할 경험을 고르는 사용자 상황부터 안내한다.
- 추천 입력 큰 표면은 16px 모서리와 `box-shadow: none`을 사용한다.
- 1280px에서 페이지 `scrollWidth`와 `clientWidth` 차이는 0이고 런타임 오류 overlay는 없다.
- 빈 상태 문구·행동은 `trackedActivityCount` 0과 1의 실제 presentation 반환값을 검사하는 테스트 3개로 확인했다.
- 현재 로그인 계정에는 완료 경험이 있어 새 빈 상태 자체의 브라우저 캡처는 수행하지 않았다.
- 추천 API·schema·repository·사용자 데이터와 기존 이미지 Gallery 내부 경계는 변경하지 않았다.

## 이슈

- P0: 없음
- P1: 없음
- P2: 없음
- 추가 확인 가능 항목: 저장 경험이 없는 계정에서 왼쪽 정렬 빈 상태 캡처

---

# Previous Design QA — AI 추천 적응형 Gallery 이미지 첨부

- 결과: **Passed**
- 기준 화면: ReUI `Gallery file upload` (`https://reui.io/components/file-upload`)
- 사용자 선택: `빈 상태만 크게, 이후 Gallery로 전환`
- 기준 캡처: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/reui-gallery-file-upload-reference-1440.png` (1440×900)
- 구현 캡처:
  - 빈 상태: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/campuslog-recommend-adaptive-empty-1440.png` (1440×900)
  - Gallery 2장: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/campuslog-recommend-adaptive-gallery-1440.png` (1440×900)
  - 확대 dialog: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/campuslog-recommend-adaptive-gallery-dialog-1440.png` (1440×900)
- 나란히 비교: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/reui-vs-campuslog-adaptive-gallery-1440.png`
- 검수 상태: 로그인된 `test1` 추천 화면에서 저장되지 않는 로컬 이미지 2개를 선택해 UI와 확대 상호작용을 검수. 새로고침 뒤 계정의 저장 경험이 비어 추천 입력 대신 empty state가 표시되어 모바일 selected·3장·삭제·전체 삭제 브라우저 재검증은 자동·구조 테스트 범위로 남김

## 비교 결과

- 빈 상태는 ReUI Gallery의 중앙 정렬 아이콘·제목·설명·제한·CTA 계층을 CampusLog 웜 화이트·차콜 토큰으로 재현했다.
- 첫 파일이 들어오면 큰 업로드 영역이 사라지고 `첨부 이미지`, `2/3 · 총 170KB`, `전체 삭제`, 3열 정사각형 타일과 `이미지 추가` 타일로 전환되어 같은 기능이 중복되어 보이지 않는다.
- 이미지 타일은 하단 어두운 정보 표면 안에서 긴 파일명을 말줄임하고 개별 용량을 유지한다. 확대·삭제는 44px 원형 동작으로 분리하고 hover·focus-within·hover 없는 장치 상태를 제공한다.
- 확대 dialog는 1440×900에서 `920×576` 안에 원본 비율을 유지해 표시했고 닫기 버튼으로 첫 초점이 이동했다.
- QA 중 자동화 키보드의 `Esc`가 dialog를 닫지 않는 상황을 확인해 native `cancel` 이벤트를 명시적으로 처리하고 재현 구조 테스트를 RED→GREEN으로 고정했다.
- 1440×900 empty·selected 상태 모두 `scrollWidth === innerWidth === 1440`, 깨진 이미지 0건이었다. 390×844에서는 페이지 `scrollWidth === innerWidth === 390`을 재확인했고 selected 2열 계약은 구조 테스트와 CSS로 검증했다.
- 브라우저 console warning/error는 0건이었다.
- 기존 JPG·PNG·WebP 최대 3장·파일당 5MB, 폼 붙여넣기, 추천 API·저장·원본 이미지 비저장 계약은 변경하지 않았다.
- 레퍼런스의 검정 테마와 CampusLog의 웜 화이트 테마 차이는 기존 제품 디자인을 유지하기 위한 의도된 차이다.
- 레퍼런스는 선택 뒤에도 큰 upload hero를 유지하지만, 사용자가 선택한 적응형 안은 첫 파일 뒤 hero를 Gallery로 교체해 긴 추천 폼의 세로 밀도를 줄이는 의도된 차이다.

## 이슈

- P0: 없음
- P1: 없음
- P2: 없음
- 남은 smoke check: 저장 경험이 있는 로그인 계정에서 390px selected 2열, 3장 추가 타일 제거, 개별 삭제·전체 삭제, 실제 `Esc` 닫기를 한 번 더 확인

---

# Previous Design QA — 오늘의 기록 진행 활동 Item

- 결과: **Passed**
- 기준 화면: ReUI `Item` (`https://reui.io/components/item`)
- 기준 캡처: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/reui-item-reference.png` (1280×720)
- 구현 캡처:
  - 데스크톱: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/active-activity-items-desktop.png` (1440×900)
  - 메뉴: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/active-activity-items-menu.png` (1440×900)
  - 모바일: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/active-activity-items-mobile.png` (390×844)
- 나란히 비교: `/Users/kwban1/.codex/visualizations/2026/07/25/019f9922-b082-7213-ae74-a0a77c458bd8/reui-vs-campuslog-active-items.png`
- 검수 상태: 로그인된 `test1` 대시보드에서 저장소를 변경하지 않는 임시 진행 활동 2건으로 시각 검수한 뒤 임시 데이터 제거

## 비교 결과

- ReUI `Outline Item`과 `Muted Item`의 얇은 경계, 낮은 대비 배경, 제목 중심 밀도를 CampusLog 토큰과 기존 카드 문맥에 맞게 적용했다.
- 활동 제목과 상세 Chevron을 하나의 링크로 묶고, 파괴적 삭제는 44px `···` 메뉴로 분리해 주요 탐색과 보조 동작의 우선순위를 명확히 했다.
- 데스크톱 2열과 390px 모바일 1열에서 잘림 없이 표시되며 모바일 `scrollWidth`와 `innerWidth`가 모두 390px였다.
- 메뉴를 열어 활동명을 포함한 삭제 `menuitem` 노출을 확인했다.
- 브라우저 console warning/error는 0건이었다.
- 레퍼런스의 검정 테마와 CampusLog의 웜 화이트 테마 차이는 제품 디자인 토큰을 유지하기 위한 의도된 차이다.

## 이슈

- P0: 없음
- P1: 없음
- P2: 없음

---

# Previous Design QA — AI 분석 부족 정보 MorphSurface

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
