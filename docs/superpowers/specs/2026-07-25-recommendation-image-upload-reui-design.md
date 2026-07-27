# AI 추천 적응형 Gallery 이미지 첨부 설계

## 목표

`/recommend`의 `이미지 첨부` 필드를 ReUI `Gallery file upload` 구조에 가깝게 재구성한다. 처음 사용하는 사람에게는 이미지 입력 방법을 분명하게 안내하고, 파일을 선택한 뒤에는 큰 업로드 영역을 갤러리로 전환해 추천 폼의 읽기 흐름과 세로 밀도를 지킨다.

기존 추천 이미지 계약인 JPG·PNG·WebP, 최대 3장, 원본 장당 5MB, 파일 선택과 폼 안 이미지 붙여넣기, 원본 비저장, 단일 vision 요청은 변경하지 않는다.

## 사용자 결정

2026-07-26 시각 비교에서 사용자가 `B. 빈 상태만 크게, 이후 갤러리로 전환`을 선택했다.

### 채택: Adaptive Gallery

1. 파일이 없을 때는 ReUI Gallery처럼 중앙 정렬된 큰 점선 업로드 영역을 표시한다.
2. 파일이 하나라도 들어오면 큰 업로드 영역을 제거하고 `첨부 이미지` 헤더, 정사각형 갤러리, 다음 이미지를 넣는 `이미지 추가` 타일로 전환한다.
3. 헤더에는 현재 개수와 전체 용량을 함께 표시하고, 우측에는 `전체 삭제`를 제공한다.
4. 각 이미지 타일은 파일명·용량, 확대 보기, 개별 삭제를 제공한다.
5. CampusLog의 따뜻한 흰색·차콜·중립 border·절제된 라운드와 focus 표현을 유지한다.

이 구조는 ReUI의 Gallery 경험을 충분히 전달하면서도 첨부 후 불필요한 대형 업로드 박스가 남지 않아, 사용자 입장에서 폼이 갑자기 길어지거나 같은 기능이 중복되어 보이는 어색함을 줄인다.

### 검토 후 제외

- 업로드 영역을 항상 유지하는 Gallery: 기능은 가장 명확하지만 파일 선택 후에도 큰 면적을 차지해 자기소개서 입력 폼이 과도하게 길어진다.
- 항상 compact인 업로드 행: 공간은 적게 쓰지만 처음 사용하는 사람이 드래그앤드롭 영역과 이미지 제한을 한눈에 인지하기 어렵다.

## 화면과 카피

### 빈 상태

```text
이미지 첨부
┌ - - - - - - - - - - - - - - - - - - - - ┐
│                  [Images]                    │
│       질문 또는 JD 이미지를 추가하세요       │
│  여기에 끌어다 놓거나 이미지 선택을 눌러 주세요 │
│     JPG, PNG, WebP · 최대 3장 · 장당 5MB     │
│                [이미지 선택]                 │
└ - - - - - - - - - - - - - - - - - - - - ┘
```

- `선명한 캡쳐일수록 정확해요` 같은 품질 지시 문구는 사용하지 않는다.
- 별도 도움말 문단을 업로드 영역 아래에 반복하지 않는다.
- 제한 정보는 `JPG, PNG, WebP · 최대 3장 · 장당 5MB 이하`로 한 번만 표시한다.

### 첨부 상태

```text
첨부 이미지
2/3 · 총 2.4MB                            전체 삭제

┌────────────┐ ┌────────────┐ ┌────────────┐
│ preview    │ │ preview    │ │            │
│ 확대  삭제 │ │ 확대  삭제 │ │ 이미지 추가 │
│ 파일명·용량 │ │ 파일명·용량 │ │            │
└────────────┘ └────────────┘ └ - - - - - ┘
```

- `이미지 추가` 타일은 최대 개수에 도달하기 전까지만 표시한다.
- 파일명과 용량은 이미지 하단의 어두운 정보 표면에 표시해 타일 밖의 추가 세로 공간을 쓰지 않는다.
- 실제 사용자가 선택한 파일만 렌더링하며 ReUI 예제의 `defaultImages`는 가져오지 않는다.

## 컴포넌트 구조

### `RecommendationImagePicker`

- controlled `File[]`, `onFilesChange`, `disabled` 계약을 유지한다.
- 숨김 파일 input 한 개를 빈 상태의 `이미지 선택` 버튼과 첨부 상태의 `이미지 추가` 타일이 공유한다.
- 빈 상태 dropzone과 첨부 상태 gallery surface가 같은 drag 이벤트 처리기를 사용한다.
- `validateRecommendationImageSelection`만 파일 개수·형식·용량을 판정한다.
- `전체 삭제`는 `onFilesChange([])`를 호출하고 현재 검증 오류를 함께 정리한다.
- 선택된 미리보기 파일을 로컬 상태로 보관해 확대 dialog를 연다.

### `RecommendationImagePreview`

- 파일별 object URL을 만들고 unmount 또는 파일 교체 시 해제한다.
- 정사각형 이미지와 파일명·용량을 렌더링한다.
- 확대와 삭제 버튼은 파일명을 포함한 접근성 이름을 가진다.
- 확대 dialog는 원본 비율을 유지한 `object-fit: contain` 이미지와 닫기 버튼을 제공한다.

### 프레젠테이션 유틸리티

- 기존 `getRecommendationImageSelectionSummary`가 개수와 전체 용량 계산을 담당한다.
- API, repository, 이미지 준비·압축, AI 요청 payload 계산은 이 컴포넌트에서 수행하지 않는다.

## 상태와 상호작용

- **empty:** 큰 점선 업로드 영역을 표시한다.
- **hover / focus-within:** 점선 경계와 배경 대비만 한 단계 높인다.
- **dragging:** 차콜 경계와 옅은 차콜 배경으로 바꾸며 이동·bounce·반복 애니메이션을 사용하지 않는다.
- **selected:** 큰 업로드 영역을 갤러리 헤더와 grid로 교체한다.
- **at limit:** `이미지 추가` 타일을 렌더링하지 않고 추가 drop을 무시한다.
- **disabled:** 추천 처리 중 선택·drop·확대·삭제·전체 삭제를 막고 상태 대비는 유지한다.
- **error:** Gallery 아래에 아이콘, `이미지를 추가하지 못했어요`, 구체적인 검증 메시지가 있는 작은 destructive alert를 표시한다.
- **remove one:** 해당 파일만 제거하고 오류를 정리한다. 마지막 파일이면 empty 상태로 돌아간다.
- **clear all:** 모든 파일을 제거하고 empty 상태로 돌아간다.
- **preview:** 확대 버튼으로 modal dialog를 열고 닫기 버튼, 배경 클릭 또는 `Esc`로 닫는다.

## 데이터 흐름

```text
파일 선택 / drop / 폼 안 붙여넣기
→ validateRecommendationImageSelection
→ RecommendationForm의 File[] 갱신
→ 로컬 object URL Gallery 렌더링
→ 추천 제출 시 기존 prepareRecommendationImages
→ 기존 단일 vision 추천 요청
```

- 붙여넣기는 `RecommendationForm`의 현재 분기를 그대로 사용하므로 일반 텍스트 붙여넣기를 방해하지 않는다.
- object URL과 원본 `File`은 브라우저 세션의 컴포넌트 상태에만 존재한다.
- API, schema, repository, migration, Storage, 추천 결과 저장 형식은 변경하지 않는다.

## 반응형과 접근성

- 데스크톱은 3열, 640px 이하에서는 2열 Gallery를 사용한다.
- 빈 상태의 최소 높이와 padding은 모바일에서 줄이되 제목·제한·CTA 순서는 유지한다.
- 모든 동작 버튼은 최소 44×44px hit area와 `focus-visible` 표시를 가진다.
- 이미지 `alt`에는 파일명을 사용한다.
- 확대·삭제 버튼에는 각각 `<파일명> 이미지 크게 보기`, `<파일명> 이미지 삭제`를 사용한다.
- hover가 없는 장치에서는 핵심 버튼과 파일 정보를 항상 볼 수 있게 한다.
- modal dialog는 `aria-modal`, 접근 가능한 제목, `Esc` 닫기를 제공하고 열릴 때 닫기 컨트롤로 초점을 이동한다.
- motion은 160ms 이하의 색상·opacity 전환만 사용하고 `prefers-reduced-motion`에서 제거한다.

## 오류 처리

- 허용되지 않는 형식, 장당 5MB 초과, 최대 3장 초과 메시지는 기존 validator 결과를 그대로 표시한다.
- 오류가 발생해도 이미 선택한 유효 파일은 유지한다.
- 파일 선택, 개별 삭제, 전체 삭제가 성공하면 이전 오류를 지운다.
- preview object URL 생성 중 이미지가 아직 준비되지 않은 경우 중립 skeleton surface를 유지하며 깨진 링크 텍스트를 노출하지 않는다.

## 검증

- 순수 프레젠테이션 테스트로 개수와 전체 용량 계산을 검증한다.
- 구조 테스트로 empty hero, selected gallery, add tile, 전체 삭제, 확대 dialog, drag 상태, 3열·2열 반응형 계약을 검증한다.
- 기존 이미지 validator, 붙여넣기, 추천 제출 관련 테스트를 회귀 실행한다.
- 1440×900과 390×844에서 empty, selected, max count, remove, clear all, preview, validation error, keyboard focus를 확인한다.
- 모바일에서 `scrollWidth === innerWidth`, 콘솔 warning/error 0건을 확인한다.
- ReUI Gallery 레퍼런스와 실제 구현 캡처를 같은 viewport의 비교 이미지로 만들어 P0/P1/P2가 없을 때만 Design QA를 통과시킨다.

## 범위 밖

- 실제 업로드 진행률
- 이미지 순서 변경
- 이미지 편집·자르기
- 파일 형식·개수·용량 변경
- 기본 또는 샘플 이미지
- API·DB·Storage 변경
