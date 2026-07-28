# Design QA — 나의 활동·추천 기록 즐겨찾기

- 결과: **Passed**
- 상태: 로그인 `test1`, 기본 데스크톱·390×844 브라우저

## Reference and behavior evidence

- unlumen UI `Pinned List`의 controlled pinned state, 첫 고정 시 heading 출현, layout 기반 실제 위치 이동을 확인하고 같은 항목을 복제하지 않는 구조로 적용했다.
- `/experiences`는 완료 경험에만 Pin을 제공해 진행 활동의 현재 상태 탐색을 유지한다. `/recommend/history`는 각 저장 기록에 Pin을 제공한다.
- 두 화면 모두 첫 고정 뒤 `즐겨찾기`와 `모든 활동` 또는 `모든 기록`이 나타나고, 해제 시 기존 순서로 돌아온다.
- 고정 행은 near-white Liquid Glass, 활성 Pin은 차콜을 사용해 강한 색상·그라디언트 없이 기존 화면 재료와 구분된다.
- 본문 선택과 Pin은 별도 버튼이며 Pin은 44×44px, `aria-pressed`, 대상명을 포함한 추가·제거 이름, 저장 중 비활성·실패 rollback을 제공한다.
- 새로고침 후 고정 상태가 유지되고 사용자별 저장소에는 entity id·고정 시각만 남는다. 경험·추천 원문과 API·DB schema·repository는 변경하지 않았다.
- 390×844에서 heading·행·Pin이 겹치지 않고 가로 overflow가 없으며 브라우저 warning/error는 0건이다.
- 구조 테스트를 RED에서 확인한 뒤 GREEN으로 전환했고 전체 테스트 116개, lint, typecheck, production build, diff check를 통과했다.

# Design QA — 오늘의 기록 활동 추가 확장 CTA

## 확인 기준

- ReUI `Expanding button from icon to label`의 아이콘→라벨 발견성을 CampusLog 차콜 Primary와 Liquid Glass 위계에 맞게 적용한다.
- fine pointer에서는 44×44px 원형으로 시작하고 hover·키보드 `focus-visible`·작성 화면 열림에서 118×44px로 확장한다.
- 버튼의 우측 끝을 고정해 옆의 활동 개수와 섹션 헤더가 불필요하게 움직이지 않게 한다.
- touch·coarse pointer에서는 hover에 의존하지 않고 44px 이상 전체 `활동 추가` 라벨을 상시 표시한다.
- 접근 가능한 이름, 기존 RippleButton, Expandable Screen 열기·초점 복귀, reduced motion을 유지한다.

## 확인 결과

- 1280×720 fine pointer 로그인 화면의 기본 상태는 44×44px, `border-radius: 999px`, 라벨 opacity 0이며 접근성 트리에는 `활동 추가` 이름이 유지된다.
- 클릭·열림 상태는 118×44px, 라벨 opacity 1이고 접힘과 열림 모두 우측 여백 82.953125px로 일치한다.
- 클릭 후 `새 활동 추가` dialog가 열리고 `aria-expanded=true`가 연결되며 기존 입력·닫기·초점 구조를 유지한다.
- 문서 가로 overflow가 없고 차콜 표면·Liquid Glass edge highlight·ripple을 그대로 사용한다.
- 구조 테스트 113개, lint, typecheck, production build, diff check를 통과했다.

# Design QA — 오늘의 기록 화면 전환 안정화

- 결과: **Passed**
- 상태: 로그인 `test1`, 1280×720 브라우저

## Transition evidence

- 스크롤된 `/experiences`에서 `오늘의 기록`을 누른 직후 URL이 바뀌기 전에도 목적지 메뉴만 활성 capsule을 사용하고 이전 `나의 활동` capsule은 즉시 해제된다.
- 실제 경로 변경 전에는 `aria-current`가 현재 경로에 남아 접근성 탐색 의미를 보존하고, 경로 완료 뒤 `/dashboard`로 갱신된다.
- `/dashboard`는 `scrollY=0`, root `scroll-behavior=auto`로 즉시 정착하며 전역 smooth scroll로 화면이 미끄러지지 않는다.
- 모든 인증 제품 화면의 root scrollbar는 같은 10px/`thin` 채널과 transient thumb를 사용한다. 유휴 상태는 transparent, 실제 스크롤 중 44%, 마지막 이벤트 900ms 뒤 transparent로 복귀한다.
- 전환 완료 화면의 가로 overflow는 0이고 새 브라우저 탭의 warning/error 로그는 0건이다.
- 전체 테스트 112개, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`를 통과했다.

# Design QA — Breadcrumb 화면 전환 안정화

- 결과: **Passed**
- 상태: 로그인 `test1`, 1280×720 브라우저

## Geometry evidence

- `/dashboard`, `/experiences`, `/recommend`는 모두 루트 `clientWidth=1269px`, 예약 스크롤바 폭 11px, 계산 `scrollbar-width: thin`을 사용한다.
- 세 화면의 Breadcrumb은 `x=304.953125px`, `y=42px`, H1은 `x=304.953125px`, `y=76px`로 정확히 일치한다.
- 기존 `/experiences` 전용 폭 selector는 제거하고 모든 인증 Liquid Glass 제품 라우트가 동일한 채널을 예약한다. `/experiences`의 transient 동작은 thumb 색·표시 시간만 제어한다.
- 세 화면 모두 body 가로 overflow가 0이며, 화면 전환 뒤 Breadcrumb·H1 시작점의 서브픽셀 이동이 없다.
- 구조 테스트를 RED에서 확인한 뒤 GREEN으로 전환했으며 전체 테스트 112개, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`를 통과했다.

# Design QA — 공통 Breadcrumb 내비게이션 레일

- 결과: **Passed**
- 상태: 로그인 `test1`, 1280px 브라우저

## Geometry evidence

- 변경 전 상위 화면과 추천 기록 Breadcrumb은 약 x 304.5px, 활동 추가·경험 추가는 x 327.25px로 약 23px 차이가 났다.
- 변경 후 `/dashboard`, `/experiences`, `/recommend`, `/recommend/history`, `/activities/new`, `/experiences/new`의 Breadcrumb은 모두 약 x 304.5px, y 42px에 정렬된다.
- 같은 화면들의 H1은 동일한 x축 레일과 y 76px을 사용하며 Breadcrumb과 H1 사이의 기존 16px 시각 여백을 유지한다.
- 861px 이상은 최대 1200px 프레임·`clamp(24px,3.2vw,48px)` gutter, 860px 이하는 기존 공통 20px/16px gutter를 사용한다.
- 읽기용 920px 폼·상세 본문 폭과 페이지별 정보 구조는 유지하며 확인 화면 모두 가로 overflow가 없다.
- 구조 테스트를 RED에서 확인한 뒤 GREEN으로 전환했으며 전체 테스트 111개, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`를 통과했다.

# Design QA — 추천 실행 CTA·이미지 첨부 마감

- 결과: **Passed**
- 상태: 로그인 `test1`, 1280px `/recommend`

## Visual and interaction evidence

- `AI 분석`은 활동 상세 `다시 분석하기`와 같은 공통 `AnimatedGradientActionButton` 기본 표현을 사용한다.
- 계산값은 44px 높이, 12px radius, 흰 배경, no-shadow이며 gradient border layer가 표시되고 gradient 텍스트·Sparkles·Chevron 계약을 유지한다.
- 빈 이미지 첨부는 fieldset의 1px dashed 경계가 가장 바깥선이며 내부 dropzone은 border 0·transparent 배경이다.
- 파일이 있는 Gallery 구조와 파일 제한·삭제 동작은 유지하고 `전체 삭제`만 clear Glass capsule·hairline·blur·edge highlight로 정리했다.
- 1280px에서 body 가로 overflow가 없고 스크린리더용 `이미지 첨부` legend와 44px 액션 영역을 유지한다.
- 구조 테스트를 RED에서 확인한 뒤 GREEN으로 전환했으며 전체 테스트 110개, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`를 통과했다.

# Design QA — 나의 활동 차콜 Gooey 검색 복원

- 결과: **Passed**
- 상태: 로그인 `test1`, 1280px 브라우저, 완료 경험 상세 선택

## Visual and interaction evidence

- Liquid Glass 적용 전 소스와 비교해 나의 활동 검색에서만 `liquid-capsule` override를 제거했다.
- 닫힌 검색은 44×42px `rgb(29,29,31)` 차콜 원형, 흰 20px 검색 아이콘으로 복원됐다.
- 열린 검색은 218×42px 차콜 필드와 44px 원형이 SVG Gooey filter로 연결되고 흰 placeholder·입력값을 사용한다.
- 검색 열기 뒤 input 자동 초점, 검색어 지우기·닫기와 Escape 계약을 유지한다.
- 추천 기록 검색은 기존 clear Glass capsule을 유지하고 body 가로 overflow는 없다.
- 구조 테스트를 RED에서 확인한 뒤 GREEN으로 전환했으며 전체 테스트 110개, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`를 통과했다.

# Design QA — 추천 기록 상세 Liquid Glass·가독성

- 결과: **Passed**
- 상태: 로그인 `test1`, 1280px 브라우저, 첫 추천 기록 선택

## Material and hierarchy evidence

- 상세 외곽은 목록과 같은 `rgba(255,255,255,.54)`, `blur(28px) saturate(1.12)`, 공통 hairline·outer shadow를 사용한다.
- 내부 `RecommendationResult`는 transparent, border 0, shadow none, backdrop-filter none으로 외곽과 중첩되지 않는다.
- 기간·추천 생성일·역할과 추천 카드·근거·답변 초안은 `rgba(255,255,255,.92)` content plate를 사용하고 활용 목적·질문·분석의 큰 구획은 transparent+hairline으로 읽힌다.
- 헤더를 kicker/도구 행과 전체 폭 제목으로 분리해 제목 높이가 129.625px에서 64.8125px로 줄었고 4줄에서 2줄이 됐다.
- 추천 근거는 약 348px 상세 내부 폭에서 3열 대신 1열로 전환되어 각 문장의 읽기 폭을 확보했다.

## Responsive, accessibility and verification evidence

- 메타는 데스크톱에서 `기간 / 추천 생성일` 2열과 `역할` 전체 폭, 860px 이하에서 1열로 전환한다.
- H1 `추천 기록`, H2 `전체 기록`, 상세 닫기 버튼, 원본 활동 링크의 접근성 구조를 유지했다.
- 1280px에서 body 가로 overflow가 없고 8px scrollbar 채널 안 4px 차콜 thumb를 사용한다.
- 구조 테스트를 RED에서 확인한 뒤 GREEN으로 전환했으며 전체 테스트 109개, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`를 통과했다.

# Design QA — 추천 기록 제목·나의 활동 탭 재질 통일

- 결과: **Passed**
- 상태: 로그인 `test1`, 1280px 브라우저

## Geometry and material evidence

- 변경 전 추천 기록 H1 left는 327.25px, 주요 화면 H1은 304.4765625px이었다.
- 변경 후 `추천 기록`, `AI 기반 활동 추천`, `오늘의 기록` H1은 left 304.4765625px, top 76px, font-size 37.95px로 일치한다.
- 나의 활동 좌측 목록·우측 상세와 추천 기록·대시보드 작업 탭은 모두 `rgba(255,255,255,.54)`, `blur(28px) saturate(1.12)`를 사용한다.
- 나의 활동 좌우 패널의 border·shadow는 동일하고 가로 overflow가 없다.
- 전체 테스트 108개, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`를 통과했다.

# Design QA — 추천 기록 페이지/목록 위계 분리

- 결과: **Passed**
- 상태: 로그인 `test1`, 추천 기록 22개

## Visual and structure evidence

- H1 `추천 기록`과 설명이 목록 Glass 밖의 공통 페이지 헤더에 표시된다.
- 목록 Glass는 H2 `전체 기록`, 저장 개수와 검색으로 시작한다.
- 페이지 헤더와 목록의 왼쪽 좌표가 일치하고 `새 추천 받기`·Breadcrumb의 기존 위치가 유지된다.
- 현재 1280px 브라우저에서 가로 overflow가 없고 목록·상세 데이터 계약은 변경하지 않았다.
- 전체 테스트 107개, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`를 통과했다.

# Design QA — 나의 활동 좌우 외곽 표면 통일

- 결과: **Passed**
- 상태: 로그인 `test1`, `커널 아카데미 (테스트)` 완료 경험 상세 선택

## Material evidence

- 좌측 목록과 우측 상세의 계산 배경은 모두 `rgba(255, 255, 255, 0.92)`이다.
- 양쪽 backdrop filter는 `blur(24px) saturate(1.1)`, border는 `rgba(43, 48, 56, 0.1)`, 외곽 shadow는 동일하다.
- 선택 활동은 기존 차콜 틴트·2px 왼쪽 인디케이터로 구분되어 같은 재료 안에서도 현재 위치가 명확하다.
- 좌우 radius는 기존 목록 30px·상세 24px을 유지해 표면 색과 정보 구조 변경을 분리했다.
- 전체 테스트 107개, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`를 통과했다.

# Design QA — 나의 활동 자연스러운 스크롤바

- 결과: **Passed**
- screenshots: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-natural-scrollbar-390x844.png`, `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-natural-scrollbar-1400x900.png`
- 상태: 로그인 검증 계정, 완료 경험 상세 선택

## Visual and behavior evidence

- 페이지·활동 목록·상세의 트랙과 유휴 thumb는 투명하고, 필요할 때 실제 보이는 thumb는 모두 가운데 4px 캡슐이다.
- 상세 thumb는 유휴 transparent에서 스크롤 중 `rgba(101,105,112,.44)`로 올라가고 980ms 뒤 다시 transparent로 복귀했다.
- 목록·상세·분석의 영역·thumb hover는 모두 표시하지 않고 실제 스크롤 중에만 44%를 사용한다.
- 페이지는 10px 채널/3px 투명 border, 목록·상세는 8px 채널/2px 투명 border와 `background-clip: padding-box`를 사용한다.
- 390×844·860×800·861×800·1400×900에서 가로 overflow가 없고 모바일 목록 scrollbar가 콘텐츠를 침범하지 않았다.
- 전체 테스트 105개, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과.

# Design QA — 나의 활동 상세 단일 표면

- 결과: **Passed**
- before: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-detail-single-surface-before.png`
- after: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-detail-single-surface-after.png`
- side-by-side: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-detail-single-surface-comparison.png`
- 상태: 로그인 `test1`, `소프트웨어 학술동아리 네스트넷 임원진 활동` 완료 경험 상세

## Material evidence

- 구현 전 계산값은 상세 `rgba(255,255,255,.64)`, 메타·본문 `rgba(255,255,255,.92)`와 inset shadow, 액션 `rgba(255,255,255,.44)`와 18px blur였다.
- 구현 뒤 상세 외곽은 `rgba(255,255,255,.92)`와 기존 outer shadow를 유지하고 메타·본문·액션은 모두 transparent, `box-shadow: none`, `backdrop-filter: none`이다.
- 메타와 본문 섹션의 1px `rgba(43,48,56,.1)` hairline은 유지되어 배경색 차이 없이 정보 구획을 전달한다.
- 동일한 1367×1016 캡처를 나란히 비교해 제목·정보·버튼 위치를 바꾸지 않고 우측 상세만 하나의 흰 표면으로 정리된 것을 확인했다.

## Responsive and interaction evidence

| viewport | 결과 |
| --- | --- |
| 390×844 | 메타 1열, 상세·내부 단일 표면, 가로 overflow 0 |
| 860×800 | 단일 열 상세, 가로 overflow 0 |
| 861×800 | 목록·상세 분할, 내부 단일 표면, 가로 overflow 0 |
| 1024×800 | 목록·상세 분할, 가로 overflow 0 |
| 1400×900 | 상세 near-white 외곽과 투명 내부 구획, 가로 overflow 0 |

- 상세 닫기 뒤 선택이 해제되고 같은 활동을 다시 선택하면 상세가 정상 복원된다.
- `AI 분석 결과`를 열고 닫아도 상세는 유지되며 분석 패널은 기존 외곽 64%·내부 92% 재료를 유지한다.
- 상세 scrollbar는 유휴 18% → 스크롤 중 52% → 980ms 뒤 유휴 18%로 돌아간다.
- 전체 테스트 103개, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과.

# Design QA — 나의 활동 선택 행과 scrollbar 연속성

- 결과: **Passed**
- previous-state screenshot: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-detail-scrolling-after.png`
- implementation screenshots: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-selection-scrollbar-polish-390x844.png`, `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-selection-scrollbar-polish-1400x900.png`
- side-by-side comparison: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-selection-scrollbar-polish-comparison.png`
- viewport / pixels: 390×844·860×800·861×800·1024×800·1400×900 CSS viewport, 비교 capture 1385×890
- state: 로그인 검증 계정, 진행 활동 `패널 인터랙션 확인` 선택, 완료 경험 상세 scrollbar 측정

## Visual comparison evidence

- 기존 선택 행은 목록의 회색빛 표면 위에서 `rgba(255,255,255,.92)` 배경과 두 겹 그림자를 사용해 독립된 흰 탭처럼 보였다.
- 구현 뒤 선택 행은 `rgba(29,29,31,.055)` 틴트, `box-shadow: none`, 2px 차콜 왼쪽 인디케이터를 사용해 목록 안의 현재 위치로 읽힌다.
- 1385×890 전후 화면을 나란히 비교해 목록·상세의 정보 구조는 유지하고 선택 재료만 평평해진 것을 확인했다.

## Scrollbar behavior evidence

- 구현 전 상세 panel은 idle transparent, scroll 중 56%, 마지막 이벤트 700ms 뒤 다시 transparent였다.
- 구현 뒤 같은 panel은 idle 18%, scroll 중 `data-scrolling="true"`와 52%, 930ms 뒤 `data-scrolling`이 제거된 idle 18%로 돌아갔다.
- 세 상태의 상세 panel `clientWidth`는 모두 379px로 같아 gutter 변화로 콘텐츠가 흔들리지 않았다.
- 저장된 `커널 아카데미 (테스트)`의 `AI 분석 결과`를 열어 분석 panel도 idle 18%→active 52%→930ms 뒤 idle 18%로 돌아가고 `clientWidth`가 세 상태 모두 475px인지 확인했다.

## Responsive evidence

| viewport | 결과 |
| --- | --- |
| 1400×900 | 선택 틴트·no-shadow·2×24px indicator, 제목 간격 12px, 가로 overflow 0 |
| 1024×800 | 300px 목록 + 392.44px 상세, 상세 내부 scroll, 가로 overflow 0 |
| 861×800 | 240px 목록 + 340px 상세, 긴 제목은 기존 ellipsis 사용, 배지는 행 안에 유지, 가로 overflow 0 |
| 860×800 | 640px 단일 열, 상세 `position: relative`, 가로 overflow 0 |
| 390×844 | 2×22px indicator, 제목 간격 11px, 진행 중 배지 행 안 유지, 가로 overflow 0 |

## Automated verification

- controller test: 900ms 기대값으로 RED(`700 !== 900`) 확인 뒤 GREEN
- 전체 구조·동작 테스트: 103개 통과
- `npm run lint`: 통과
- `npx tsc --noEmit`: 통과
- `npm run build`: 통과
- `git diff --check`: 통과

## Findings

- P0: 없음
- P1: 없음
- P2: 없음
- P3: 실제 OS forced-colors 강제 시각 smoke test는 기존 후속 범위로 유지한다.

final result: passed

---

# Design QA — 나의 활동 헤더와 transient scrollbar

- 결과: **Passed**
- source screenshot: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-header-inside-surface-before.png`
- implementation screenshot: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-header-separated-after.png`
- side-by-side comparison: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-header-before-after-comparison.png`
- scrolling screenshot: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/experiences-detail-scrolling-after.png`
- viewport / pixels: 전후 비교 1382×789 CSS viewport·1367×780 capture, 추가 390×844·860×800·861×800·1024×800·1400×900 검증
- state: 로그인 `test1`, 나의 활동 기본 목록과 `커널 아카데미 (테스트)` 완료 경험 상세·AI 분석 패널

## Full-view comparison evidence

- 기존에는 H1 `나의 활동`, 설명, 개수와 검색이 목록 Glass 안에서 한 섹션으로 읽혔다.
- 구현 뒤 H1·설명은 공통 쿨 canvas 위의 페이지 헤더로 분리되고 목록 Glass는 H2 `전체 활동`, 개수와 검색으로 시작한다.
- 동일한 1367×780 캡처를 나란히 비교해 기존 콘텐츠·사이드바·목록 항목과 검색 위치는 유지하면서 페이지/목록 위계만 분리된 것을 확인했다.

## Focused behavior evidence

- 완료 경험 상세는 기본 `scrollbar-color: transparent transparent`, 스크롤 중 `data-scrolling="true"`와 `rgba(101, 105, 112, 0.56)` thumb, 마지막 이벤트 700ms 뒤 다시 transparent 상태를 확인했다.
- 상세 패널 `clientWidth`는 기본·스크롤 중·숨김 뒤 모두 604px로 유지됐다.
- 분석 패널도 기본 transparent, 스크롤 중 `data-scrolling="true"`, 700ms 뒤 제거를 확인했고 `clientWidth`는 483px로 유지됐다.
- 브라우저 페이지와 왼쪽 `.dashboard-animated-list` 스크롤바는 기존 동작을 유지했다.

## Responsive evidence

| viewport | 결과 |
| --- | --- |
| 1400×900 | H1 header bottom 162.61px, 목록 top 192.61px, 가로 overflow 0 |
| 1024×800 | H1 header bottom 151.34px, 목록 top 181.34px, 가로 overflow 0 |
| 861×800 | 선택 전 520px 목록, 선택 뒤 240px 목록 + 340px 상세, 가로 overflow 0 |
| 860×800 | 640px 단일 열, 상세 `position: relative`, `max-height: none`, 가로 overflow 0 |
| 390×844 | 343px 목록·상세, H1 nowrap, 모바일 검색 아이콘과 가로 overflow 0 |

## Automated verification

- 전체 구조·동작 테스트: 103개 통과
- `npm run lint`: 통과
- `npx tsc --noEmit`: 통과
- `npm run build`: 통과
- `git diff --check`: 통과

## Findings

- P0: 없음
- P1: 없음
- P2: 없음
- P3: forced-colors fallback은 CSS와 구조 테스트로 확인했으며 실제 OS 설정 강제 시각 smoke test는 기존 후속 범위로 유지한다.

final result: passed

---

# Design QA — CampusLog layered Liquid Glass stabilization

- 결과: **Passed**
- 확인 화면: `/dashboard`, `/activities/new`, `/experiences`, 진행 활동·완료 경험 상세, AI 분석 스플릿뷰, `/recommend`, `/recommend/history`
- 기준: Apple Developer `Liquid Glass`, `Adopting Liquid Glass`, `Applying Liquid Glass to custom views`, Human Interface Guidelines `Materials`, WWDC25 `Meet Liquid Glass`, `Get to know the new design system`
- 적용 범위: 인증 제품 앱 셸, 내비게이션, 페이지 작업 공간, 검색, popover, FloatingPanel, ExpandableScreen
- 제외 범위: 비로그인 랜딩·인증 화면, API·schema·repository·사용자 데이터

## Source of truth

- source visual truth: `/Users/kwban1/.codex/generated_images/019f9922-b082-7213-ae74-a0a77c458bd8/call_eQuO1fcCdHzt7pZDPUdEFpjn.png`
- implementation screenshot: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/liquid-glass-recommend-1487x1058-pass-final.png`
- side-by-side comparison: `/private/tmp/campuslog-liquid-glass-foundation/docs/qa-artifacts/liquid-glass-recommend-comparison-pass-final.png`
- viewport / pixels / density: reference 1487×1058 px, implementation 1487×1058 CSS viewport, browser capture 1472×1047 px, 기본 device density
- state: 로그인 `test1`, 자기소개서 목적, 질문·이미지 미입력, Gallery 빈 상태

## Full-view comparison evidence

- 선택 시안과 구현을 같은 1487×1058 기준으로 나란히 비교했다.
- 제품 배경은 웜화이트와 장식 blob 없이 쿨 실버 canvas를 사용하고, 기존 CampusLog 콘텐츠·정보 구조·검정 CTA를 유지했다.
- 데스크톱은 inset Glass 사이드바, 현재 메뉴 capsule, 하단 계정 진입점을 유지하고 큰 콘텐츠 표면은 읽기 우선의 near-solid 재료를 사용한다.
- 1180px 이상 사이드바는 224px, 861~1179px는 200px로 확장하고 CampusLog 워드마크가 표면의 실제 가로 중심을 공유한다.
- `/dashboard`, `/activities/new`, `/experiences`, AI 분석, `/recommend`, `/recommend/history`의 페이지별 흰색 배경을 제거해 공통 canvas가 끊기지 않게 했다.
- 860px 이하에서는 좌우 safe area 안의 단일 Glass 앱 바로 전환되고 워드마크·`오늘 / 활동 / AI`·44px 계정 버튼이 한 줄에 유지된다.

## Focused region evidence

- `/experiences`와 `/recommend/history`의 검색 capsule은 SVG gooey filter를 제거하고 어두운 아이콘·텍스트·보조 placeholder 대비를 복구했다.
- `/recommend` 목적별 예시는 선택 후 입력되는 실제 문장은 유지하면서 화면에는 `직무 역량과 성과`, `기술 선택과 판단`처럼 짧은 선택 문구만 표시한다.
- `/experiences` 완료 경험의 부족 정보 토글은 질문 → 빈 답변 입력 → 제목 없는 Warning Alert → 저장 액션 순서를 유지한다.
- 추천 기록 상세, 진행 활동 상세, 완료 경험 상세와 AI 분석은 데스크톱 master-detail과 모바일 세로 흐름에서 각각 독립 스크롤을 유지한다.

## Responsive evidence

| viewport | 결과 |
| --- | --- |
| 1400×900 | 224px 사이드바와 워드마크 중심 132px 일치, 가로 overflow 0 |
| 1487×1058 | 핵심·상세·분석·추천 기록 화면 가로 overflow 0 |
| 1024×800 | 200px inset 사이드바와 워드마크 중심 114px 일치, 한 열 배치와 가로 overflow 0 |
| 861×800 | 200px 사이드바와 워드마크 중심 114px 일치, 대시보드 한 열 전환과 가로 overflow 0 |
| 860×800 | 모바일 앱 바로 전환, 가로 overflow 0 |
| 390×844 | 활동 추가, 진행·완료 상세, 분석, 추천, 추천 기록 가로 overflow 0 |
| 360×800 | `/dashboard`, `/experiences`, `/recommend`, `/recommend/history` 직접 진입·헤더·콘텐츠 가로 overflow 0 |

## Interaction and accessibility evidence

- 추천 목적 선택과 예시 입력, 추천 기록 검색 열기·입력·필터, 나의 활동 항목 선택, AI 분석 패널과 부족 정보 답변 토글을 실제 UI에서 확인했다.
- 진행 활동·완료 경험·추천 기록 상세는 모바일에서 선택 뒤 상세 구간으로 이어지고, 닫기·주요 CTA·보조 액션이 44px 조작 영역을 유지한다.
- `backdrop-filter` 미지원, reduced transparency, increased contrast, forced colors, reduced motion은 CSS와 구조 테스트로 확인했다.
- 개발 서버의 오래된 hot-reload 상태에서 `/experiences` 주소와 다른 화면이 섞이는 현상을 발견했다. 서버를 완전히 종료하고 production build 후 다시 시작했으며 네 핵심 경로 직접 진입이 모두 정상임을 재검증했다.
- 기존 전체 화면 안정화 검증에서는 재시작 뒤 브라우저 warning/error log가 0건이었다. 이번 사이드바 재검증 중 Next.js의 기존 `missing-data-scroll-behavior` 개발 경고 1건이 확인됐고, 사이드바 기하와 사용자 동작에는 영향을 주지 않으므로 별도 범위로 남겼다.

## Automated verification

- 전체 구조·동작 테스트: 99개 통과
- `npm run lint`: 통과
- `npx tsc --noEmit`: 통과
- `npm run build`: 통과
- `git diff --check`: 통과

## Comparison history

- 1차: 앱 셸과 일부 화면만 Glass로 보여 대시보드 외 페이지의 배경·검색 표현이 분리됨.
- 2차: 공통 쿨 canvas와 페이지별 near-solid 작업 공간을 연결하고 활동·추천·기록·분석 상세를 반응형으로 조정.
- 최종: 활동·추천 기록 검색 대비, 추천 예시 밀도, 개발 서버 라우트 상태를 보정하고 360·390·1487px에서 재검증.

## Findings

- P0: 없음
- P1: 없음
- P2: 없음
- P3: 실제 OS의 reduced transparency / increased contrast / forced colors 강제 시각 smoke test는 아직 수행하지 않았다.

final result: passed

---

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
