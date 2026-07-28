# CampusLog Layered Liquid Glass Design

## 문서 상태

- 날짜: 2026-07-26
- 담당 Track: Track B — 디자인·사용자 경험 고도화
- 대상: 인증 후 CampusLog 전체 제품 UI
- 선택 시안: `/Users/kwban1/.codex/generated_images/019f9922-b082-7213-ae74-a0a77c458bd8/call_eQuO1fcCdHzt7pZDPUdEFpjn.png`
- 기준 브랜치: `design/liquid-glass-foundation-implementation`
- 상태: 사용자가 2026-07-26 옵션 1 구현을 승인함

## 1. 목적

기존 Liquid Glass foundation이 공통 앱 셸에만 보이던 문제를 해결하고,
사용자가 실제로 작업하는 주요 화면까지 동일한 재료 체계를 확장한다.

이번 디자인은 Apple의 Liquid Glass 원칙을 웹에 맞게 해석한 밝고 차분한
네이티브형이다. 시각 효과 자체를 목표로 하지 않고 다음 관계를 더 명확하게
만든다.

```text
환경 배경
→ 떠 있는 탐색·페이지 도구
→ 반투명 작업 공간
→ 선명한 입력·기록 콘텐츠
→ 강조된 핵심 액션
```

## 2. 보존 범위

다음 계약은 변경하지 않는다.

- `/dashboard`, `/activities/**`, `/experiences/**`, `/recommend/**` 경로
- 인증, Supabase, repository, API, AI 요청과 저장 로직
- 활동 추가·기록·종료·완료 경험·AI 분석·추천 흐름
- 현재 Korean copy와 접근성 이름
- Gallery의 JPG·PNG·WebP 최대 3장·장당 5MB 제한
- 기존 키보드 초점, Escape 닫기, focus restore 계약
- 기존 CampusLog 워드마크와 Pretendard 본문

비로그인 랜딩과 인증 화면은 이번 실험 범위에서 제외한다.

## 3. 참고 원칙

기준 자료:

- [Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)
- [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)
- [GlassCN](https://glasscn-components.vercel.app/)

적용 원칙:

1. 탐색과 조작은 콘텐츠 위의 독립적인 기능 레이어로 보인다.
2. 페이지 전체를 한 가지 투명도로 덮지 않고 역할에 따라 재료를 나눈다.
3. 긴 텍스트와 입력 값은 투명도보다 가독성을 우선한다.
4. 관련된 제어는 하나의 Glass group으로 묶고 blur 중첩을 피한다.
5. 색보다 곡률, 명도, 경계와 깊이로 계층을 표현한다.
6. 창 크기, 입력 방식, 대비·투명도·모션 설정에 맞춰 효과를 줄인다.

## 4. 선택 시안 해석

선택 시안의 핵심 특징:

- 웜화이트가 아닌 밝은 cool silver-gray 환경
- 20px inset의 둥근 floating sidebar
- 페이지 제목과 도구는 배경 위에 직접 배치
- 주요 작업 공간은 하나의 넓은 frosted surface
- select, textarea, gallery는 선명한 content plate
- 제안 문구와 작은 도구는 glass capsule
- 핵심 CTA는 dark prominent glass
- 반사와 굴절은 모서리와 상단 edge에만 제한

시안은 `/recommend`의 시각 기준이다. 같은 재료 위계를 다른 화면의 기존
정보 구조에 맞춰 적용한다.

## 5. 재료 토큰

### 5.1 환경

- `--liquid-canvas`: `#eef1f6`
- `--liquid-canvas-deep`: `#e8ecf2`
- `--liquid-text-primary`: `#17181a`
- `--liquid-text-secondary`: `#656970`
- `--liquid-hairline`: `rgba(43, 48, 56, 0.10)`
- `--liquid-hairline-strong`: `rgba(43, 48, 56, 0.16)`

환경 배경은 두 개 이하의 넓고 낮은 대비의 무채색 tonal field만 사용한다.
오로라, 컬러 blob, 베이지, 크림과 반복 animation은 사용하지 않는다.

### 5.2 재료 단계

| 단계 | 역할 | 기본 표현 |
| --- | --- | --- |
| `clear` | 페이지 도구·capsule | 흰색 38~48%, blur 18px |
| `regular` | sidebar·작은 그룹 | 흰색 58~68%, blur 24px |
| `frosted` | 페이지 작업 공간 | 흰색 48~60%, blur 28px |
| `content` | 입력·긴 결과·기록 | 흰색 88~96%, blur 없음 |
| `prominent` | 핵심 CTA | 차콜 92%, 안쪽 highlight |

### 5.3 곡률

- 앱 셸·큰 workspace: 30px
- 주요 section: 24px
- 내부 content plate: 16px
- 버튼·필터·상태: 999px 또는 12px

내부 곡률은 부모 곡률과 padding 차이를 고려한 동심 구조를 유지한다.

## 6. 공통 컴포넌트

### 6.1 `GlassSurface`

기존 primitive를 확장해 다음 variant를 지원한다.

- `clear`
- `regular`
- `frosted`
- `prominent`
- `content`
- `solidFallback`

제품 로직은 소유하지 않는다. `as`, `shape`, `elevation`, `interactive` 계약은
유지한다.

### 6.2 스타일 hook

React 구조를 불필요하게 바꾸지 않도록 다음 공통 class를 제공한다.

- `.liquid-workspace`: 큰 페이지 작업 공간
- `.liquid-section`: 독립 section
- `.liquid-content-plate`: 입력·긴 콘텐츠
- `.liquid-control-group`: 관련 제어 묶음
- `.liquid-capsule`: 작은 도구·필터
- `.liquid-prominent-action`: 핵심 액션

기존 class와 함께 사용하며 저장·라우팅·폼 로직은 변경하지 않는다.

## 7. 화면별 적용

### 7.1 오늘의 기록

- 활동 overview 전체를 frosted workspace로 변경
- 진행 활동 행은 content plate 목록으로 유지
- 캘린더와 날짜별 기록은 각각 regular section
- 캘린더 이동·연월 선택은 control group
- 기록 추가와 활동 추가는 prominent/clear 역할을 구분
- 빈 상태·오류는 같은 surface 안에서 낮은 대비 content plate로 표시

### 7.2 나의 활동

- 목록 화면 전체는 넓은 glass workspace로 묶지 않고 제목·검색 도구와 목록
  surface를 분리해 긴 목록의 스크롤 가독성을 유지
- 검색 버튼·확장 검색은 clear capsule
- 목록 pane은 frosted surface, 각 행은 divider 중심의 content row
- 선택 상세는 regular surface
- AI 분석 스플릿뷰는 왼쪽 상세와 오른쪽 분석을 같은 높이의 sibling glass
  surface로 표시
- 부족 정보 MorphSurface 내부 textarea와 Warning Alert는 content material 유지

### 7.3 CampusLog AI

- 선택 시안을 가장 직접적으로 재현
- 추천 입력 form panel을 frosted workspace로 변경
- select, textarea는 content plate
- Gallery empty/selected 상태는 regular tray
- 예시 문구는 clear capsule group
- 추천 기록은 page tool capsule
- AI 분석은 dark prominent glass
- 결과와 추천 기록 detail은 regular outer surface와 content 내부 section 조합

### 7.4 활동·경험 상세와 작성 화면

- hero action group은 clear capsule group
- detail meta, timeline, attachment, synthesis draft, edit form은 역할에 따라
  regular section과 content plate로 나눔
- destructive action은 Glass 여부와 무관하게 명확한 텍스트·아이콘을 유지
- FloatingPanel과 ExpandableScreen의 기존 origin transition을 유지

## 8. 반응형

### 데스크톱 1180px 이상

- 204px sidebar
- 최대 1120px content frame
- 28~30px workspace radius
- 기존 2열과 스플릿뷰 유지

### 중간 폭 861~1179px

- 188px sidebar
- 대시보드 한 열
- 큰 blur 반경을 22~24px로 축소
- 검색·필터 group은 wrapping 허용

### 모바일 360~860px

- 상단 inset app bar
- 큰 workspace는 좌우 14~16px 여백
- section radius 20~24px
- 긴 콘텐츠 plate는 높은 불투명도
- toolbar는 한 줄이 불가능하면 의미 단위로 wrap
- 가로 overflow 금지

## 9. 상호작용과 접근성

- hover는 fill과 edge highlight만 4~6% 변경
- press scale은 최대 `0.985`
- focus-visible은 3px ring 유지
- 포인터 추적 반사와 지속 ambient animation은 사용하지 않는다
- `prefers-reduced-motion: reduce`에서 morph와 scale 제거
- `prefers-reduced-transparency: reduce`에서 content 수준 불투명도로 전환
- `prefers-contrast: more`와 `forced-colors`에서 blur와 highlight 제거
- backdrop-filter 미지원 환경에 solid fallback 제공

## 10. 성능

- 한 화면에서 큰 backdrop blur surface는 최대 4개를 목표로 한다.
- blur surface 안의 content plate에는 backdrop-filter를 사용하지 않는다.
- 반복 행과 긴 목록에는 개별 blur를 적용하지 않는다.
- 모바일에서 blur·shadow layer를 한 단계 줄인다.
- 기존 WebGL AI loading과 overlay가 활성화되면 배경 workspace 효과를 낮춘다.

## 11. 성공 기준

- `/dashboard`, `/experiences`, `/recommend`에서 shell 외 페이지 고유 Glass가
  최소 2개 이상 시각적으로 확인된다.
- 주요 입력과 긴 텍스트의 대비가 유지된다.
- 1440, 1024, 861, 860, 390, 360px에서 가로 overflow가 없다.
- 메뉴, Select, 검색, Gallery, modal, split view의 기존 동작이 유지된다.
- reduced motion/transparency/contrast/forced-colors fallback이 유지된다.
- lint, typecheck, build와 전체 구조 테스트가 통과한다.
- reference와 implementation을 같은 viewport로 비교한 `design-qa.md`가
  `final result: passed`로 끝난다.
