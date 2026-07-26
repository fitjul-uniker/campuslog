# CampusLog Liquid Glass Foundation Design

## 문서 상태

- 날짜: 2026-07-26
- 담당 Track: Track B — 디자인·사용자 경험 고도화
- 대상: 인증 후 CampusLog 웹 앱의 공통 앱 셸, 내비게이션, 메뉴, 팝오버, 패널, 모달과 핵심 제어
- 기준 브랜치: `design/liquid-glass-foundation`
- 상태: 사용자 승인 시각 방향을 구현 명세로 정리

## 1. 목적

CampusLog의 기존 정보 구조와 기능을 유지하면서 Apple Liquid Glass의 재료 원칙을 웹에서 가능한 범위까지 재현한다. 목표는 장식적인 glassmorphism이 아니라 콘텐츠와 조작 레이어를 분리하는 네이티브 앱 수준의 기능적 재료 체계다.

사용자는 변화된 시각 효과를 해석할 필요 없이 기존과 같은 위치에서 다음 작업을 완료할 수 있어야 한다.

```text
오늘의 기록 확인
→ 진행 활동과 날짜별 기록 관리
→ 완료 경험 확인과 AI 분석
→ 지원 상황에 맞는 경험 추천
```

## 2. 최우선 보존 원칙

이번 작업은 기존 페이지를 재설계하거나 기능을 축소하는 작업이 아니다. 현재 CampusLog 화면을 제품 기준선으로 보고 그 위에 Liquid Glass 재료 체계를 적용한다.

사용자가 승인한 예외는 좌측 사이드바다. 데스크톱 사이드바는 새 시안의 inset Liquid Glass 구조, 밝은 선택 capsule, 둥근 프로필 표면과 깊이감을 그대로 적용한다. 워드마크, 메뉴 순서, 활성 경로와 프로필 메뉴 기능은 기존 계약을 유지한다.

다음 요소를 우선 보존한다.

- 현재 라우트와 `오늘의 기록 → 나의 활동 → CampusLog AI` 내비게이션 구조
- CampusLog 워드마크, Pretendard 본문, 검정·차콜 중심 브랜드
- Breadcrumb, H1, 설명, 콘텐츠 시작선과 최대 1120px 프레임
- 대시보드의 진행 활동, 경험 정리 필요 활동, 캘린더, 날짜별 기록
- 나의 활동 목록·상세·AI 분석 스플릿뷰
- AI 추천 폼, 목적 선택, 이미지 Gallery, 추천 결과와 추천 기록
- MorphSurface, FloatingPanel, ExpandableScreen, DropdownMenu의 기존 기능과 초점 계약
- 현재 API, schema, repository, 저장, 인증과 데이터 접근 계약
- 기존 로딩·빈 상태·오류·성공 문구와 접근성 이름

Liquid Glass를 적용하기 위해 콘텐츠를 삭제하거나 순서를 바꾸지 않는다. 반응형 수용이나 안전 영역 때문에 위치 변경이 필요한 경우에도 같은 정보 위계와 동작을 유지한다.

## 3. Apple 공식 원칙의 웹 해석

참고 기준:

- [Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)
- [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)
- [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views)
- [Human Interface Guidelines — Materials](https://developer.apple.com/design/human-interface-guidelines/materials)

CampusLog에 적용할 핵심 원칙:

1. **기능적 최상위 레이어**  
   Liquid Glass는 콘텐츠 카드가 아니라 내비게이션, 메뉴, 도구, 시트와 핵심 제어에 우선 적용한다.

2. **콘텐츠 우선**  
   기록, 캘린더, 긴 AI 결과와 입력은 선명한 고체 표면을 유지한다. Glass는 콘텐츠를 가리지 않고 그 위에 떠 있는 조작 레이어로 보인다.

3. **제한적 사용**  
   같은 화면에 blur가 적용된 대형 표면을 중첩하지 않는다. 여러 제어가 한 그룹에 속하면 하나의 Glass 컨테이너로 묶는다.

4. **상황 적응**  
   배경 겹침, 스크롤, 초점, 화면 폭, 대비·투명도·모션 선호에 따라 불투명도와 모션을 조정한다.

5. **유동적인 제어**  
   버튼에서 메뉴나 패널이 열릴 때 원래 제어와 새 표면의 관계가 보이도록 짧은 크기·모서리·위치 전환을 사용한다.

6. **동심원형 곡률**  
   컨테이너와 내부 제어의 모서리 반지름은 일정한 차이를 유지한다. 큰 표면 24~30px, 내부 그룹 16~20px, 버튼 12~999px 범위에서 계층적으로 구성한다.

7. **성능 제한**  
   동시에 렌더링하는 backdrop blur 표면 수를 제한하고 모바일에서는 blur 반경과 shadow 단계를 줄인다.

## 4. 시각 방향

### 4.1 색상

웜화이트, 베이지, 장식용 컬러 블롭과 오로라를 사용하지 않는다.

- 앱 배경: cool system gray 계열 `#F5F5F7`
- 콘텐츠 표면: `#FFFFFF`
- 약한 콘텐츠 표면: `#FAFAFA`
- 주 텍스트: `#1D1D1F`
- 보조 텍스트: `#6E6E73`
- 경계: `rgba(29, 29, 31, 0.10)`
- 강한 경계: `rgba(29, 29, 31, 0.16)`
- Primary CTA: CampusLog 차콜
- Glass tint: 기본적으로 무채색. 상태 의미가 없는 색 tint는 추가하지 않는다.

### 4.2 Glass 재료

웹의 `backdrop-filter`와 다층 표면을 사용해 regular glass를 재현한다.

- 반투명 흰색 base fill
- 배경 blur와 제한적인 saturation
- 상단·좌측 중심의 1px specular highlight
- 얇은 외곽 border
- 짧고 낮은 shadow
- 배경과 분리되지 않을 때만 약한 contrast 보정

Glass 자체에 장식용 그라디언트를 넣지 않는다. 허용되는 gradient는 광학적 가장자리 하이라이트와 재료의 명암을 표현하는 무채색 레이어로 한정한다.

### 4.3 콘텐츠 표면

다음 요소는 기본적으로 불투명한 흰색 또는 약한 회색 표면을 유지한다.

- 기록과 활동 Item
- 캘린더 본문
- 날짜별 기록
- 경험 상세와 AI 결과
- textarea, input과 긴 폼
- 파일 Gallery의 이미지 타일
- 오류·경고·성공 내용

콘텐츠 표면은 1px 중립 경계와 매우 낮은 shadow를 사용한다. Glass와 경쟁하는 강한 반사, blur, 다층 shadow를 사용하지 않는다.

## 5. 공통 컴포넌트

### 5.1 `GlassSurface`

공유 Glass 표현을 담당하는 프리미티브를 추가한다.

지원 variant:

- `regular`: 사이드바, 앱 바, 메뉴, 팝오버
- `prominent`: 주요 Glass CTA 또는 선택된 제어
- `clear`: 시각적으로 풍부한 실제 콘텐츠 위에서만 선택적으로 사용
- `solidFallback`: 투명도 감소, 고대비, 미지원 브라우저

공통 속성:

- `interactive`: hover, pointer, focus 반응 사용 여부
- `shape`: capsule, rounded rectangle, circle
- `elevation`: bar, popover, modal
- `className`과 기존 semantic element 전달

이 컴포넌트는 시각 표현만 담당하고 라우팅, 저장, 메뉴 상태와 같은 제품 로직을 소유하지 않는다.

### 5.2 `GlassGroup`

인접한 Glass 제어를 하나의 렌더링·모션 그룹으로 묶는다.

- 중첩 backdrop blur 방지
- 같은 그룹의 버튼이 하나의 재료처럼 보이게 처리
- 제어 간격이 좁아질 때 모서리와 highlight가 충돌하지 않게 조정
- reduced motion에서는 형태 병합·분리 animation 제거

### 5.3 앱 셸

데스크톱:

- 현재 좌측 내비게이션과 하단 프로필을 유지한다.
- 861px 이상에서 사용자 승인 시안의 inset regular Glass sidebar를 사용한다.
- sidebar는 화면 왼쪽·상하에 안전 여백을 둔 독립 표면이며 약 30px 곡률, 무채색 regular Glass, specular edge와 낮은 shadow를 사용한다.
- 워드마크와 메뉴 순서는 유지한다.
- 선택 메뉴는 sidebar 안의 단일 밝은 capsule 표면으로 표시한다.
- 하단 프로필은 같은 Glass 재료 안에서 한 단계 밝은 rounded surface로 구분한다.
- 콘텐츠는 sidebar 오른쪽의 기존 1120px 프레임을 유지한다.

모바일:

- 860px 이하에서 sidebar를 제거하고 기존 상단 앱 바를 유지한다.
- 앱 바 전체를 하나의 regular Glass 그룹으로 표시한다.
- `CampusLog`, `오늘 / 활동 / AI`, 44px 프로필 진입점은 현재 순서와 접근성 이름을 유지한다.
- 앱 바가 콘텐츠 위에 있을 때 scroll-edge 대비 보정을 적용한다.

### 5.4 메뉴와 팝오버

- DropdownMenu, Select, Combobox, ProfileMenu를 regular Glass popover로 통일한다.
- 메뉴는 trigger 가까이에서 열리고 viewport와 safe area를 회피한다.
- 메뉴 항목 배경을 각각 Glass로 만들지 않는다.
- 선택·hover·focus 상태만 낮은 명도 차이로 표시한다.
- 표준 동작에는 기존 Lucide 아이콘과 접근성 레이블을 유지한다.

### 5.5 패널, 모달과 시트

- FloatingPanel과 ExpandableScreen의 기존 trigger-origin 전환을 유지한다.
- 데스크톱 modal은 regular Glass 외곽 shell과 불투명 콘텐츠 내부를 조합한다.
- 모바일 sheet는 화면 가장자리와 safe area 사이에 inset 간격을 유지한다.
- sheet가 큰 높이로 확장되면 불투명도를 높여 작업 집중과 텍스트 대비를 유지한다.
- 배경 dimming은 무채색이며 blur와 중첩해 과도하게 흐려지지 않게 한다.

### 5.6 버튼과 제어

- 모든 버튼을 Glass로 바꾸지 않는다.
- 내비게이션·툴바·오버레이에 속한 제어만 Glass 적용 후보로 삼는다.
- 콘텐츠 내부 Primary CTA는 기존 차콜 버튼을 유지하되 specular edge와 press 반응만 재료 체계에 맞춘다.
- destructive, warning, success는 색상만으로 상태를 전달하지 않는다.

## 6. 반응형 설계

### 6.1 데스크톱 — 1180px 이상

- 196~208px inset sidebar
- 콘텐츠 최대 1120px
- 진행 활동 2열과 기존 분할뷰 유지
- 메뉴·팝오버는 trigger 옆에 표시
- 여러 Glass 제어가 인접하면 한 그룹으로 통합

### 6.2 중간 폭 — 861~1179px

- sidebar 폭과 좌우 padding을 단계적으로 축소
- 콘텐츠 2열은 기존 breakpoint와 최소 폭을 우선
- Glass의 blur와 shadow를 한 단계 줄임
- 메뉴가 콘텐츠를 가리지 않도록 viewport collision 처리

### 6.3 모바일 — 360~860px

- top inset Glass app bar
- sidebar 제거
- 기존 세로 콘텐츠 흐름 유지
- 큰 패널은 한 열, 이미지 Gallery는 기존 2열
- modal과 sheet는 좌우 12~16px 안전 간격
- 앱 바 아래 콘텐츠에 충분한 top offset 제공
- 가로 overflow를 만들지 않음

### 6.4 확대와 작은 높이

- 200% 확대에서도 내비게이션, 프로필 메뉴, 주요 CTA에 접근 가능
- viewport 높이 667px 이하에서는 Glass 패널의 고정 높이를 제거하고 내부 스크롤 사용
- safe-area inset과 가상 키보드가 입력·CTA를 가리지 않게 처리

## 7. 상태와 모션

### 7.1 상호작용

- hover: highlight 위치와 표면 명도만 약하게 변경
- press: 0.98 이하의 짧은 scale 또는 명도 변화
- focus-visible: 기존 3px focus ring 유지
- menu open: trigger와 popover의 관계가 보이는 160~220ms 전환
- sheet open: trigger origin이 있는 경우 기존 morph 방향 유지

포인터 위치를 따라가는 highlight는 desktop fine pointer에서만 사용하고, 화면 전체에 지속 animation을 만들지 않는다.

### 7.2 reduced motion

`prefers-reduced-motion: reduce`에서는:

- 형태 병합·분리와 위치 morph 제거
- opacity 전환을 80ms 이하로 제한하거나 즉시 처리
- pointer-follow highlight 정지
- 기존 기능적 focus 이동과 상태 변경은 유지

### 7.3 reduced transparency와 고대비

다음 조건에서 `solidFallback`을 사용한다.

- `prefers-reduced-transparency: reduce`
- `prefers-contrast: more`
- `forced-colors: active`
- `backdrop-filter` 미지원

Fallback:

- 불투명 `#F5F5F7` 또는 `#FFFFFF`
- 명확한 1px 경계
- blur와 specular highlight 제거
- 텍스트·아이콘 WCAG 대비 유지

## 8. 성능

- 대형 backdrop blur는 앱 셸, 활성 overlay 등 필요한 표면으로 제한한다.
- blur 표면 안에 추가 blur 표면을 중첩하지 않는다.
- 콘텐츠 카드에는 backdrop blur를 사용하지 않는다.
- 모바일 blur 반경과 shadow layer를 데스크톱보다 낮게 설정한다.
- pointer 반응은 `requestAnimationFrame`으로 묶고 CSS custom property만 갱신한다.
- offscreen surface에 불필요한 `will-change`를 유지하지 않는다.
- 기존 AI WebGL 로딩과 Glass overlay가 함께 표시될 때 효과 수를 줄인다.

## 9. 오류와 호환성

- Glass 스타일이 로드되지 않거나 지원되지 않아도 기능과 텍스트를 사용할 수 있어야 한다.
- 스타일 지원 여부가 버튼 활성화, 저장, 라우팅과 같은 기능 조건에 영향을 주지 않는다.
- blur가 없을 때도 메뉴와 모달의 경계가 배경과 구분돼야 한다.
- 브라우저별 색 차이는 허용하되 텍스트 대비와 레이아웃은 동일하게 유지한다.

## 10. 구현 범위

### 이번 foundation에 포함

- Liquid Glass 디자인 토큰
- `GlassSurface`, `GlassGroup` 프리미티브
- 데스크톱 sidebar와 모바일 header
- ProfileMenu와 공용 DropdownMenu
- 공용 Select·Combobox popover
- FloatingPanel·ExpandableScreen의 Glass shell
- 공용 dialog·popover 표현
- 접근성·성능 fallback
- 디자인 문서와 구조 테스트

### 기존 표현을 유지하며 필요한 부분만 연결

- 대시보드 활동·캘린더·날짜별 기록
- 나의 활동 목록·상세·분석
- 추천 폼·이미지 Gallery·결과·기록
- 인증된 하위 페이지

### 이번 foundation에서 제외

- 공개 랜딩의 순환 문구와 3D 책
- 인증·온보딩 화면의 전면 재설계
- 앱 아이콘 제작
- API, schema, repository, Supabase와 AI prompt 변경
- 다크 모드 신규 도입
- WebGL 기반 굴절 shader
- 기존 페이지의 정보 구조 변경

## 11. 검증

자동 검증:

- Glass 프리미티브 variant와 fallback 구조 테스트
- AppShell desktop/mobile 구조 테스트
- lint
- TypeScript
- production build
- `git diff --check`

브라우저 검증:

- `/dashboard`, `/experiences`, `/recommend`
- 데스크톱 1440px
- 중간 폭 1024px와 861px 경계
- 모바일 390×844
- 200% 확대
- 키보드 Tab, Enter, Escape
- ProfileMenu, DropdownMenu, Select, Combobox
- FloatingPanel과 ExpandableScreen
- reduced motion, 고대비와 blur 미지원 fallback
- 가로 overflow와 콘솔 warning/error

시각 검증:

- Apple 공식 문서 캡처와 구현 화면을 같은 viewport에서 비교
- 현재 CampusLog 기준 화면과 구현 화면을 나란히 비교
- 기존 요소의 위치·위계·문구·동작 보존 확인

## 12. 완료 조건

- 기존 핵심 화면과 기능이 회귀하지 않는다.
- Liquid Glass가 콘텐츠가 아닌 조작 레이어로 명확히 인식된다.
- 웜화이트·베이지·장식용 컬러 배경이 남지 않는다.
- 데스크톱과 모바일에서 동일한 재료 체계가 자연스럽게 적응한다.
- 투명도·모션·대비 설정과 미지원 환경에서도 기능과 가독성이 유지된다.
- API, schema, repository와 저장 데이터에 변경이 없다.
