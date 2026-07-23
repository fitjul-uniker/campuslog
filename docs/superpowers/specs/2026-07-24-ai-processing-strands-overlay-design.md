# AI 처리 Strands 전체 화면 오버레이 디자인

## 목표

분석·추천·완료 경험 합성·답변 생성의 AI 대기 화면을 카드형 진행 패널에서 몰입도 높은 전체 화면 로딩 경험으로 통일한다.

## 레퍼런스

- React Bits `Strands` JavaScript + CSS 구현과 사용 예시
- Kokonut UI `AI Text Loading`의 Motion 기반 텍스트 전환
- 사용자가 제공한 Strands 첫 번째 프롬프트의 색상과 수치

## 화면 구조

1. AI 요청이 시작되면 viewport 전체를 덮는 fixed 오버레이를 `document.body` 포털로 렌더링한다.
2. 기존 화면은 반투명 near-white 레이어와 `backdrop-filter`로 블러 처리한다.
3. 화면 중앙에 Strands를 배치한다.
4. Strands 아래에 AI Text Loading을 배치해 현재 처리 상태와 확인 단계를 순환 표시한다.
5. 요청 취소가 가능한 흐름은 텍스트 아래에 `요청 취소` 버튼을 유지한다.

## Strands 설정

사용자가 제공한 첫 번째 설정을 그대로 시작점으로 사용한다.

- colors: `#F97316`, `#7C3AED`, `#06B6D4`
- count: `3`
- speed: `0.5`
- amplitude: `1`
- waviness: `1`
- thickness: `0.7`
- glow: `2.6`
- taper: `3`
- spread: `1`
- intensity: `0.6`
- saturation: `1.5`
- opacity: `1`
- scale: `1.5`
- glass: `false`

## AI Text Loading

- Kokonut UI의 `AnimatePresence mode="wait"`, 세로 진입·이탈, neutral gradient text와 반복 background position 구조를 유지한다.
- 기존 `title`, 서버 `statusMessage`, 시간 기반 message, `steps`를 중복 제거한 배열로 전달한다.
- 1.8초 간격으로 한 문장씩 표시한다.
- 장기 대기 기준을 넘으면 기존 장기 대기 안내도 순환 문구에 포함한다.
- context item은 화면을 복잡하게 만들지 않도록 별도 카드로 표시하지 않는다.

## 적용 범위

- 경험 분석과 재분석
- CampusLog AI 추천과 JD 분석
- 진행 활동의 완료 경험 합성
- 추천 기반 답변 초안 생성의 첫 본문 수신 전

기존 API 호출, SSE/NDJSON 상태 이벤트, AbortSignal, 저장과 오류 처리는 변경하지 않는다.

## 반응형과 접근성

- 데스크톱 Strands 영역은 최대 560px × 280px, 모바일은 viewport 폭에서 좌우 24px을 뺀 값과 220px 높이를 사용한다.
- overlay는 충분히 높은 z-index로 전역 내비게이션과 패널 위에 표시한다.
- 로딩 상태는 `aria-live="polite"`, `aria-busy="true"`로 알린다.
- 장식용 Strands canvas는 접근성 트리에서 제외한다.
- 취소 버튼은 최소 44px 높이와 `focus-visible`을 제공한다.
- reduced motion에서는 Strands 시간 진행을 멈추고 AI Text Loading의 이동·gradient 반복을 제거하며 단순 텍스트 전환만 유지한다.
- 컴포넌트 제거 시 animation frame, resize listener, WebGL context와 body scroll lock을 정리한다.

## 실패와 fallback

- WebGL context 생성에 실패하면 Strands 영역은 비어 있는 중앙 stage로 남고 AI Text Loading과 취소 기능은 계속 제공한다.
- 긴 문장은 모바일에서 최대 폭 안에서 줄바꿈하며 가로 스크롤을 만들지 않는다.

## 검증

- Strands의 OGL 생성·정리와 reduced motion 계약을 구조 테스트로 확인한다.
- AI Text Loading의 순환·Motion·gradient 구조를 확인한다.
- 공용 AIProcessingPanel이 portal overlay, Strands 설정, AI Text Loading과 취소 계약을 사용하는지 확인한다.
- lint, typecheck, build, 관련 회귀 테스트와 `git diff --check`를 실행한다.
- 로그인 브라우저에서 실제 AI 요청을 시작한 뒤 overlay·blur·중앙 정렬·상태 전환·취소·overflow를 확인한다.
