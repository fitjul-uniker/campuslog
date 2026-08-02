# CampusLog Work Status

## 현재 단계

- [x] 1차 MVP 핵심 흐름 구현
- [x] v1.1 진행형 경험 기록·캘린더·AI 완료 경험 합성 고도화
- [x] v1.1 정적 검사, production build, 데스크톱·모바일 브라우저 검증
- [x] 2차 MVP 단계와 두 작업 Track 문서화
- [x] v1.1 commit / push / Draft PR #27
- [x] 팀 리뷰와 main merge
- [x] 2차 MVP 기능 브랜치 시작
- [x] Supabase Auth foundation 구현
- [x] 사용자별 Supabase DB schema / RLS foundation 작성
- [x] localStorage 모델과 DB 이전 정책 문서화
- [x] 주요 화면 데이터 read/write를 Supabase 사용자별 repository로 전환
- [x] Supabase project migration 적용과 Google 계정 A/B 데이터 분리 수동 smoke test
- [x] 비로그인 순환 기록 문구 → 중앙 인증 카드 → 인증 후 3D 책 표지 진입 흐름 구현
- [x] 회원가입 방식 선택 → 이메일 조건부 자격 증명 → 이름·닉네임 Stepper와 Google 온보딩 복귀 구현
- [x] 오늘의 기록 빠른 작성 폼을 반응형 플로팅 패널로 고도화
- [x] CampusLog AI 추천 화면 설명과 추천·기록 간 교차 이동 위계 정리
- [x] 활동 추가 Expandable Screen, 공용 Checkbox·CopyButton과 좌측 하단 프로필 드롭다운 통합
- [x] 활동 추가의 날짜 입력 상단선을 맞추고 예상 종료일 `미정` 체크박스를 24px로 확대해 라벨 옆에 정렬 (`ISSUE-074`)
- [x] 프로필 드롭다운 로그아웃 제출 안정화와 세션 제거·보호 경로 재차단 브라우저 확인
- [x] `fix/concurrent-account-session`에서 공유 테스트 계정용 현재 세션 로그아웃, 만료 감지, 분석 전 최신 경험 재조회, 분석 결과 atomic upsert와 경험 동시 수정 충돌 감지 구현 (`ISSUE-134`)
- [x] 동일 테스트 계정 동시 작업과 세션 독립 유지 직접 로직 테스트 (`ISSUE-134`)
- [x] 긴 경험 원문 AI 분석 저장의 Supabase URL 초과 400 오류를 `updated_at` 기반 동시성 조건으로 수정하고, 화면·AI API 입력 상한을 공용화해 내용 8,000자·성과 4,000자의 90%부터만 조건부 글자 수 안내와 초과 수정 안내 제공 (`ISSUE-139`)
- [x] AI API 보호 foundation: 세 AI API Route의 서버 세션 확인, 401 JSON 오류, 입력 상한, timeout, runtime-local rate guard 적용
- [x] AI 경험 분석 v2.1: STAR, 주요 성과, 부족 정보 답변, 키워드 중심 schema / 저장 / 표시 간소화
- [x] 상세 역할 220자 경험의 AI API 입력 상한 불일치와 분석 저장 JSON 오류를 수정하고 로그인 브라우저에서 `/api/analyze` 200·Supabase 저장·결과 표시 확인 (`ISSUE-135`)
- [x] 추천 v2: 문항 / JD 요구사항 추출, 경험 Top 3 매칭, 부족 근거와 과장 위험 schema / 저장 / 표시 구현
- [x] AI 추천 목적별 흐름 재정리: 신규 목적을 면접 / 자기소개서 / JD 분석 / 기타로 제한하고, 목적별 입력 안내·예시·생성 옵션·CTA를 단일 설정 객체로 관리 (`ISSUE-079`)
- [x] AI 추천 목적별 예시 문항을 다양한 전공의 대학생이 활용할 대표 문항 6개씩으로 정리하고, JD 분석에 플랫폼·결제 서버와 커머스 백엔드 실제형 샘플 2개 및 전 직무 공통 분석 질문 4개를 제공. 사용자가 목적별 선택과 전체 입력 반영을 직접 로직 테스트로 확인 (`ISSUE-079`)
- [x] 답변 생성 목적별 제한: 추천 v2 선택 경험 기반 자기소개서 300자 / 500자 / 1000자, 면접 30초 / 1분 이상 / 예상 꼬리 질문, JD 지원 전략, 기타 맞춤 결과 단일 초안 schema / 저장 / 표시 구현 (`ISSUE-079`)
- [x] AI 구조화 호출 1차 대기 UX 개선: 경험 분석 / 재분석, AI 추천 / JD 분석, 활동 완료 경험 합성, 추천 기반 답변 초안 생성에 단계형 안내, skeleton, 장기 대기 안내, 처리 대상 메타 정보와 중복 실행 방지 보강 (`ISSUE-080`)
- [x] 공용 AI 대기 화면을 React Bits Strands와 Kokonut UI AI Text Loading 기반 전체 화면 blur overlay로 전환하고 2.4초 문구 전환·`...` 끝맺음·아이콘/글자형 취소 액션·조용한 추천 취소와 기존 상태 이벤트·저장 계약 유지 (`ISSUE-093`)
- [x] 답변 초안 생성 2차 스트리밍 UX 구현: `/api/answer-drafts`의 기존 JSON 계약을 유지하면서 `stream: true` NDJSON 이벤트 계약, 본문 delta 미리보기, 분량 교정 replace, 완료 후 최종 저장 적용 (`ISSUE-081`)
- [x] AI 요청 측정 / 취소 3차 구현: 민감 원문 없이 기능·분량·모델·TTFT·전체 시간·성공 / 실패 / 취소·재시도 여부를 서버 로그로 기록하고, 경험 분석 / 추천 / 활동 합성 / 답변 초안 스트리밍에 AbortController 기반 취소 UI 적용 (`ISSUE-082`)
- [x] 구조화 호출 4차 이벤트 스트리밍 구현: 경험 분석 / AI 추천 / 활동 완료 경험 합성에 `status` SSE 이벤트와 최종 JSON `completed` / `error` 이벤트를 적용하고 raw JSON 토큰과 부분 구조화 결과 노출은 제외 (`ISSUE-083`)
- [x] AI 추천 입력 선별·압축 구현: 저장된 전체 경험 원문 전송 대신 목적 / 문항 기반 후보 context를 72KB 요청 예산 안에서 전송해 경험 수 증가 시 `/api/recommend` 본문 상한 초과 방지 (`ISSUE-084`)
- [x] AI 추천에 텍스트·질문/JD 캡쳐 이미지 최대 3장 단독·혼합 입력과 추천 폼 안 클립보드 이미지 붙여넣기를 추가하고, 기존 `gpt-4.1-mini` 단일 vision 호출·SSE 대기·추천 저장 흐름과 원본 이미지 비저장 정책 유지 (`ISSUE-096`)
- [x] AI 추천의 JD 분석 표시값이 기본 Combobox 필터로 재사용되어 선택지가 사라지는 문제를 수정하고, JD 선택 후에도 네 활용 목적을 다시 열어 변경 가능하게 함 (`ISSUE-085`)
- [x] 예상 종료일이 지난 진행 활동을 저장 상태 변경 없이 `종료 확인 필요`로 계산하고, 실제 종료 뒤의 `경험 정리 필요` 단계와 구분해 오늘의 기록·나의 활동·활동 상세에 적용 (`ISSUE-086`)
- [x] 경험 정리 필요 활동 수정 완료 안내를 특정 활동 카드 아래가 아닌 활동 영역 공통 알림으로 이동하고 실제 로그인 저장 흐름에서 위치 확인 (`ISSUE-087`)
- [x] 나의 활동 완료 경험 인라인 상세에 아이콘과 텍스트를 갖는 삭제 액션을 추가하고 삭제 성공·실패 상태 정리 연결 (`ISSUE-088`)
- [x] AI 분석·분석 요청·재분석 실행 CTA를 기존 상세 액션과 같은 크기·모서리·여백으로 통일하고 gradient 테두리·text·기존 아이콘 stroke와 reduced motion 상태 적용 (`ISSUE-089`)
- [x] 현재 추천과 추천 기록의 공용 결과 화면에서 보조 분석·1순위 요약·참고 문장 블록을 제거하고 핵심 Top 3 비교·JD 분석·답변 생성 흐름 유지 (`ISSUE-090`)
- [x] 독립 AI 분석 화면의 복귀 탐색은 상단에 모으고 하단에는 재분석 실행만 유지해 액션 위계 정리 (`ISSUE-091`)
- [x] AI 분석 스플릿뷰 하단에 활동 상세와 같은 위계의 독립 분석 상세 이동 버튼 추가 (`ISSUE-092`)
- [x] AI 분석 부족 정보 답변을 질문별 단일 열림 흰색 MorphSurface로 전환하고 command bar 위계·겹침 없는 anchored reveal·기본 상태/단축키 안내 제거·초점·닫기·저장 성공/실패 상태·모바일 유동 폭 적용 (`ISSUE-094`)
- [x] Supabase project에 `jd` purpose 허용, `recommendations.jd_analysis`, 새 answer draft type constraint migration 적용 완료. 실제 로그인 세션 smoke test는 남음 (`ISSUE-060`, `ISSUE-079`)
- [x] 기록 보완 루프: 부족 정보 카드 안 직접 답변 저장, 추천 / 답변 초안 즉시 반영, 명시적 재분석 흐름 구현
- [x] QA 버그 안정화: 보완 질문 draft 보존·복원, 답변 초안 분량 보정, 활동 복원·삭제·날짜 상태, 추천 점수 등급, 오늘 한 일 팝업 스크롤 수정
- [x] 오늘의 기록 캘린더 옆 빠른 기록 카드를 제목 우선 날짜별 이벤트 목록과 `+` 작성·진행 활동 필요 안내 팝업으로 재구성
- [x] 오늘의 기록의 현재 진행 활동을 ReUI `Item` 참고 제목·Chevron 행과 trailing 삭제 메뉴로 정리하고 데스크톱 2열·모바일 1열 적용 (`ISSUE-097`)
- [ ] 오늘의 기록 진행 활동을 최근 기록과 `오늘 기록` 즉시 행동 중심의 단일 열 작업 큐로 재설계하고, `경험 정리 필요`를 별도 라이프사이클 표면으로 분리 (`ISSUE-133`: 서비스 흐름 검토·UX 제안 완료, 사용자 승인·구현 대기)
- [x] AI 추천 이미지 첨부를 ReUI Gallery 참고 적응형 empty→Gallery 구조, 전체 삭제·확대 dialog·추가 타일로 정리하고 CampusLog 토큰·3장/5MB·붙여넣기·API 계약 유지 (`ISSUE-098`)
- [x] AI 추천 이미지 제한을 `JPG, PNG, WebP · 최대 3장 · 장당 5MB 이하` 한 줄로 간소화하고 별도 도움말 반복 제거 (`ISSUE-099`)
- [x] AI 추천에 사용자 행동 중심 빈 상태·16px 무그림자 큰 표면을 `/recommend`에만 적용하고 `추천 기록`은 사용자 요청에 따라 기존 아이콘·배치 유지 (`ISSUE-100`)
- [x] AI 추천 이미지 업로드 위 중복 `이미지 첨부` 제목을 화면에서 숨기고 접근성 legend 유지 (`ISSUE-101`)
- [x] AI 분석 부족 정보의 분석 사유를 placeholder 없는 답변 입력창 아래 제목 없는 ReUI 참고 Warning Alert로 재배치 (`ISSUE-102`)
- [x] 인증 제품 화면에 쿨뉴트럴 Liquid Glass foundation을 적용하고 inset 사이드바·모바일 앱 바, 공용 popover·overlay, 불투명 콘텐츠 표면과 접근성 fallback을 통합 (`ISSUE-103`)
- [x] Liquid Glass 데스크톱 사이드바를 224px·compact desktop을 200px로 확장하고 워드마크를 표면 중심에 고정 (`ISSUE-104`)
- [x] 하위 화면 Basic Breadcrumb과 날짜별 기록의 검색 없는 활동 선택 목록을 적용하고, 신규 기록의 `활동을 선택하세요` 초기 상태·390px 키보드·overflow 검증 완료 (`ISSUE-068`)
- [x] 인증 제품 화면 전체에 Basic Breadcrumb을 적용하고 오늘의 기록·나의 활동·AI 추천과 하위 화면 7곳의 페이지 프레임·제목 규격을 통일해 1440px·1024px·532px 좌표 및 overflow 검증 완료 (`ISSUE-069`)
- [x] 나의 활동 완료 경험 인라인 상세에 `/experiences/[id]`로 이동하는 `활동 상세 보기` 주요 액션을 복원하고 상세 슬롯 560px 이하에서 액션 한 줄 배치 적용 (`ISSUE-071`)
- [x] 나의 활동 H1·설명을 목록 Glass 밖으로 분리하고 목록 H2 `전체 활동`과 우측 상세·분석 transient scrollbar를 390~1400px에서 검증 (`ISSUE-105`)
- [x] 나의 활동 선택 행의 흰 카드·그림자를 제거하고 차콜 틴트·2px 인디케이터, 유휴 18%·활성 52%·900ms 복귀 scrollbar를 반응형 검증 (`ISSUE-106`)
- [x] 나의 활동 우측 완료 경험 상세의 메타·본문·액션 중첩 재료를 제거하고 단일 near-white 표면으로 반응형 검증 (`ISSUE-107`)
- [x] 나의 활동 페이지·목록·상세·분석 scrollbar를 유휴·모든 hover에서 숨기고 실제 스크롤 중에만 나타나는 4px 캡슐로 통일해 반응형 검증 (`ISSUE-108`)
- [x] 나의 활동 좌측 목록과 우측 완료 경험 상세의 외곽 색·blur·border·shadow를 동일하게 통일 (`ISSUE-109`)
- [x] 추천 기록 H1·설명을 목록 Glass 밖으로 분리하고 목록을 H2 `전체 기록`·개수·검색으로 시작 (`ISSUE-110`)
- [x] 추천 기록 H1을 다른 주요 화면과 같은 1200px 프레임·gutter·공통 글자 크기로 정렬 (`ISSUE-111`)
- [x] 나의 활동 좌우 패널을 다른 주요 작업 탭과 같은 54% frosted Glass·28px blur로 통일 (`ISSUE-112`)
- [x] 추천 AI 실행 CTA를 공통 흰 gradient 프레임으로 복원하고 빈 이미지 첨부 외곽 점선·Gallery 전체 삭제 clear Glass 위계를 정리 (`ISSUE-115`)
- [x] 인증 상위·하위 화면의 Breadcrumb·H1 시작점을 공통 1200px/3.2vw 내비게이션 레일로 통일 (`ISSUE-116`)
- [x] 인증 제품 라우트의 루트 스크롤바 예약 폭을 공통화해 화면 전환 시 Breadcrumb·H1의 서브픽셀 흔들림 제거 (`ISSUE-117`)
- [x] 오늘의 기록 이동의 이중 활성 capsule·상시 scrollbar·smooth scroll 전환을 제거하고 공통 transient root scrollbar 적용 (`ISSUE-118`)
- [x] 오늘의 기록 `활동 추가`를 fine pointer의 아이콘→라벨 확장 CTA와 터치용 상시 라벨 CTA로 반응형 정리 (`ISSUE-119`)
- [x] 나의 활동 완료 경험·진행 활동과 추천 기록에 실제 위치 이동형 `즐겨찾기` 구획, 테두리 없는 독립 44px 노란 별, 사용자별 브라우저 저장과 reduced-motion 대응 적용 (`ISSUE-120`, `ISSUE-121`, `ISSUE-122`)
- [x] 첫 화면·인증·제품 화면 전체의 웜화이트·크림 상태를 공통 쿨 뉴트럴 Liquid Glass semantic/state 토큰으로 통일 (`ISSUE-123`)
- [x] 나의 활동·추천 기록 즐겨찾기 selected·hover를 제목과 별 영역 전체가 공유하는 행 표면으로 통일 (`ISSUE-124`)
- [x] 나의 활동·추천 기록 목록 상하단의 뿌연 gradient fade 제거 (`ISSUE-125`)
- [x] 전체 주요 제품 화면의 중첩 투톤·웜톤 포털 입력·구형 아이콘 plate를 단일 콘텐츠층과 쿨 뉴트럴 Liquid control로 정리 (`ISSUE-126`)
- [x] 공개 첫 화면 스크롤 안내를 무표면 텍스트 링크로 단순화하고 로그인·회원가입 영역을 단일 frosted Liquid Glass 카드로 정리 (`ISSUE-127`)
- [x] AI 분석 부족 정보의 중복 질문·경고 카드 인상을 줄이고 스플릿 헤더를 콘텐츠와 함께 스크롤하도록 정리 (`ISSUE-128`)
- [x] 독립 완료 경험 상세를 중앙 단일 frosted Glass 읽기 표면과 쿨 뉴트럴 내부 control로 재구성하고 데스크톱·390px 가로 잘림 제거 (`ISSUE-129`)
- [x] 추천 기록 선택 행의 본문 전용 inset·drop shadow를 제거해 별 영역과 한 표면으로 연결 (`ISSUE-130`)
- [x] 인증 주요·표준 작성 화면의 첫 작업 표면을 공통 workspace anchor로 통일하고 1218px·390px에서 좌측 상단 좌표 일치 확인 (`ISSUE-131`)
- [x] AI 추천 입력 패널의 near-solid 예외를 제거하고 주요 탭 표면색을 달력과 같은 반투명 흰색 64% Glass로 통일해 내부 입력 가독성 유지 (`ISSUE-132`)
- [x] 나의 활동 초기 로딩에서 실제 `전체 활동`·검색 헤더를 숨기고 공통 Liquid skeleton 헤더·목록 행으로 오늘의 기록·CampusLog AI 전환 위계와 통일 (`ISSUE-136`)
- [x] 나의 활동 AI 분석 스플릿뷰와 독립 분석 화면을 추천 기록 상세와 같은 frosted 결과 재료·kicker/생성일/대표 제목 위계로 통일하고 정상 상태의 반복 안내 제거 (`ISSUE-137`)
- [x] 현재 추천 결과를 추천 기록 상세와 같은 질문·문항 대표 제목 구조로 통일하고 활동 기간·역할·하단 질문 중복 제거 (`ISSUE-138`)
- [x] 확장 화면의 추천 입력·결과 패널에 있던 920px 제한을 제거해 공통 페이지 콘텐츠 폭과 좌우선 정렬 (`ISSUE-073`)
- [x] 추천 활용 목적을 날짜별 기록과 같은 검색 없는 선택 목록으로 교체하고 선택 체크·키보드 접근성 통일 (`ISSUE-075`)
- [x] 오늘의 기록 캘린더에 1980년부터 현재까지 연도·월 직접 선택을 추가하고 미래 월 선택 차단 (`ISSUE-076`)
- [x] 활동 추가 Expandable Screen 닫힘 마지막 구간을 페이드해 버튼 주변 사각 잔상 제거 (`ISSUE-077`)
- [ ] 나의 활동 제목 한 줄 고정·좁은 패널 검색 축약 구현과 UI preview 폭별 검증 완료, 실제 로그인 완료 경험의 목록·상세·분석 전환 확인 필요 (`ISSUE-066`)
- [ ] 나의 활동 AI 분석 스플릿뷰 구현·preview 반응형 검증 완료, 실제 로그인 분석 데이터의 상호작용 회귀 확인 필요 (`ISSUE-067`, `ISSUE-078`)
- [x] 최신 main 기준 미반영 UI 재적용: 랜딩·인증 입력, 중앙 빠른 기록 패널, AI 실행 CTA, JD 목적, Checkbox, 추천 기록 복사, RippleButton
- [x] 팀 테스트용 Supabase Auth 이메일/비밀번호 계정 9개 생성
- [x] 진행 활동과 마무리 필요 활동 수정 경로, 미래 예정 종료일 활동의 즉시 종료 / AI 초안 생성 수정
- [x] 완료 경험 사진·PDF 첨부 UI, private Storage/RLS, AI 입력 분리 구현
- [ ] Supabase migration 적용과 실제 로그인 업로드·조회·삭제 smoke test (`ISSUE-095`)
- [ ] 추천 입력 출처 migration 적용과 실제 로그인 이미지 추천·저장·재조회 smoke test (`ISSUE-096`)

2026-07-26 `/recommend`의 범용 AI SaaS 인상을 줄이기 위해 페이지 설명과 두 완료 경험 없음 상태를 지원 문항·JD에 어떤 경험을 쓸지 고민하는 상황과 활동 추가·진행 활동 확인·과거 활동 기록의 다음 행동 중심으로 바꿨습니다. 추천 빈 상태에서는 책 아이콘을 제거하고 왼쪽 정렬 16px 무그림자 표면을 사용하며, 입력·결과·로딩 큰 표면도 `/recommend` 안에서만 16px·무그림자로 줄였습니다. 처음 시도한 아이콘 없는 우측 `추천 기록` 보조 버튼은 사용자 재확인에 따라 기존 History 아이콘·ghost 링크·반응형 배치로 원복했습니다. 이미지 Gallery 위에 반복되던 `이미지 첨부` legend는 화면에서만 숨기고 접근성 이름으로 유지했습니다. presentation 테스트를 module 부재 RED에서 3개 GREEN으로 전환했고 legend 구조 테스트도 RED→GREEN으로 확인했습니다. 전체 테스트 70개, lint, typecheck, production build, diff check를 통과했고 서버 재시작 뒤 1280×720 로그인 추천 화면에서 44px 기존 History 링크, 1×1px clipped legend, 가로 overflow 0과 런타임 오류 overlay 없음을 확인했습니다. 추천 API·schema·repository·사용자 데이터는 변경하지 않았습니다.

2026-07-26 AI 분석의 부족 정보 `MorphSurface`에서 분석 사유를 일반 문단으로 질문 아래에 두던 구조를 정리했습니다. 답변 입력창의 `실제로 기억하거나 기록에서 확인할 수 있는 내용만 적어주세요.` placeholder를 제거하고, 기존 분석 사유를 입력창 아래 ReUI `Warning alert` 참고 Alert로 표시합니다. Alert는 별도 제목 없이 경고 아이콘과 사유 문장만 사용하고 정적인 설명이므로 `role="note"`를 적용합니다. 기존 질문·초점·저장·repository·추천 반영 흐름은 변경하지 않았습니다. 새 배치 테스트를 RED→GREEN으로 확인한 뒤 전체 테스트 71개, lint, typecheck, production build, diff check를 통과했습니다. 로그인 test1 네스트넷 경험의 역할 범위 토글에서 정확한 사유 문장, textarea→Alert→action 순서, 1084×789·390×844 가로 overflow 0, runtime overlay·console error 0을 확인했습니다.

2026-07-26 사용자 선택에 따라 AI 추천 이미지 첨부를 ReUI `Gallery file upload` 참고 적응형 구조로 전환했습니다. 파일이 없을 때는 큰 점선 영역에서 제목·drag 안내·`JPG, PNG, WebP · 최대 3장 · 장당 5MB 이하`·차콜 `이미지 선택`을 한 번만 표시하고, 첫 파일이 들어오면 제목·개수·총 용량·전체 삭제, 3열 정사각형 Gallery와 추가 타일로 교체합니다. 타일 안에는 파일명·용량, 확대·삭제를 배치하고 native dialog의 닫기·배경·명시적 cancel 처리를 제공합니다. 실제 샘플 기본 이미지는 넣지 않았고 파일 선택·drag and drop·폼 붙여넣기와 기존 검증·API·저장·원본 비저장 계약은 변경하지 않았습니다. 관련 테스트 13개, lint, typecheck를 통과했고 로그인된 1440×900 화면에서 빈 상태·2장 Gallery·총 용량·추가 타일·확대 dialog·닫기 초점과 깨진 이미지·가로 overflow 없음, ReUI와 구현의 나란히 비교, console warning/error 0건을 확인했습니다. 새로고침 뒤 테스트 계정의 저장 경험이 비어 390×844에서는 페이지 가로 overflow 없음만 재확인했으며 3장·개별 삭제·전체 삭제·모바일 selected 상태의 새 브라우저 smoke test와 실제 OpenAI 요청은 실행하지 않았습니다.

2026-07-25 AI 추천 이미지 첨부 표현을 ReUI File Upload의 Basic drag and drop과 Gallery 구조로 다시 정리했습니다. 빈 상태는 점선 테두리 안에 `이미지 추가`, 드래그 안내, `0/3`을 한 줄로 배치하고 drag-over·focus-visible 상태를 제공합니다. 선택 뒤에는 제목·총 용량과 최대 660px 3열 정사각형 썸네일을 표시하며 640px 이하에서는 2열로 전환합니다. 타일에는 파일명·개별 크기와 44px 삭제 버튼을 제공하고 오류는 같은 영역 아래 작은 Alert로 표시합니다. 기존 CampusLog 웜 화이트·차콜 토큰과 JPG·PNG·WebP 최대 3장·파일당 5MB, `Cmd/Ctrl+V`, API·저장·원본 이미지 비저장 계약은 변경하지 않았습니다. 전체 테스트 67개, lint, typecheck, production build, diff check를 통과했고 1440px·390px UI에서 선택·삭제·오류·반응형·가로 overflow와 console warning/error 0건을 확인했습니다. 실제 OpenAI 요청은 실행하지 않았습니다.

2026-07-24 AI 추천 이미지 입력은 기존 추천 폼에 JPG·PNG·WebP 최대 3장 선택, 개수, 미리보기, 파일명·크기, 개별 삭제를 추가했습니다. 파일 선택뿐 아니라 추천 폼 안에서 `Cmd/Ctrl+V`로 클립보드 이미지를 같은 목록에 추가하며, 이미지가 없는 일반 텍스트 붙여넣기는 기존 textarea 동작을 유지합니다. 텍스트와 이미지는 각각 단독 또는 함께 제출할 수 있고, 원본 파일당 5MB를 검증한 뒤 큰 이미지는 브라우저에서 장당 약 750KB 이하 WebP로 준비합니다. `/api/recommend`는 이미지 형식·MIME·base64·개수·준비 크기를 다시 검증하고 기존 경험 context와 이미지를 현재 `gpt-4.1-mini` Responses API structured output 한 번에 전달합니다. 별도 OCR 확인·수정 화면과 추가 AI 호출은 없으며 기존 SSE 상태·취소 UX를 유지합니다. 핵심 문구를 읽지 못하면 재첨부 또는 직접 입력을 안내하고, 성공 결과에는 `이미지에서 추출된 내용 기반` 배지를 표시합니다. 원본 이미지와 data URL은 저장하지 않고 요청 뒤 폐기하며, 추천 기록에는 후속 답변 초안을 위한 추출 문장과 `text` / `image` / `text_and_image` 출처만 저장합니다. 관련 자동 테스트 65개, lint, typecheck, production build를 통과했고 1440px·390px UI preview에서 선택·붙여넣기·삭제·가로 overflow 0·콘솔 오류 0건을 확인했습니다. 실제 Supabase migration과 로그인 OpenAI 호출·저장·재조회는 남았습니다.

2026-07-24 완료 경험 첨부 기능은 새 경험·수정 폼에 `사진 첨부`, `자료 첨부`를 추가하고 선택 사진 썸네일, 파일명·크기, 삭제를 현재 폼 위계 안에 배치했습니다. 사진은 JPG·PNG·WebP, 자료는 PDF만 허용하며 경험당 3개, 파일당 5MB와 빈 파일 차단을 UI·Storage bucket·DB constraint에서 적용합니다. 원본 object는 사용자 ID 경로의 private `experience-attachments` bucket, metadata는 RLS가 적용된 `experience_attachments` table에 저장합니다. 인라인·독립 상세에서 1시간 signed URL로 열고 독립 상세에서 개별 삭제할 수 있습니다. 첨부 타입과 repository를 `Experience`와 분리해 AI 분석·추천 입력에는 포함하지 않으며, 첨부만 추가한 수정은 경험 원문과 분석 상태를 갱신하지 않습니다. 전체 테스트 49개, lint, typecheck, production build와 1440px·390px UI preview를 통과했으며 실제 Supabase project migration과 로그인 세션 Storage smoke test는 남았습니다.

2026-07-24 AI 분석의 부족 정보 답변을 항상 펼쳐진 카드 목록에서 질문별 흰색 `MorphSurface`로 전환했습니다. 닫힌 상태는 원형 상태 아이콘·작은 분류·한 줄 질문·답변 여부·Chevron만 남긴 command bar로 정리하고, 한 번에 하나만 펼치며 열림 시 같은 표면 안에서 전체 질문·필요 이유·답변 입력·메타·차콜 저장 액션을 표시합니다. 선택 시안에 맞춰 베이지 채움과 입력 줄무늬를 제거했습니다. 후속 시각 점검에서 표면 상향 이동량이 질문 간격과 같아 이전 질문과 맞닿고 root layout spring이 질문 전환 중 scale 변형을 만드는 원인을 확인해, 표면 상단을 고정한 anchored reveal로 교체했습니다. 질문 사이는 16px을 유지하고 reveal 높이가 0에서 자연 높이로 열리며 본문은 아래 12px에서 원위치로 올라옵니다. 새 열림에는 짧은 지연을 두고 모바일 추가 translate를 제거했습니다. 기본 `답변 없음`과 화면의 Command/Ctrl+Enter 안내는 제거해 빈 답변 상태에 글자 수와 저장 버튼만 남겼으며, 저장 중·실패·작성 중·완료·마지막 저장처럼 실제 상태 변화는 계속 표시합니다. textarea 자동 초점에는 `preventScroll`을 사용하고 바깥 클릭과 Escape 닫기·trigger 초점 복귀, 화면 안내 없는 Command/Ctrl+Enter 저장, 성공 뒤에만 닫기, 오류 시 입력 유지 계약을 보존했습니다. 기존 `evidenceGaps`, `experience_followups`, repository와 API 계약은 변경하지 않았고 새 dependency도 추가하지 않았습니다. 관련 구조 테스트 12개, lint, typecheck, production build를 통과했고 실제 로그인 독립 분석 화면에서 인접 질문 16px 간격·표면 transform 없음·열린 질문 1개와 전환 중 겹침 제거를 확인했습니다. 새 모션의 390px 실제 캡처와 reduced motion 강제 에뮬레이션은 후속 시각 확인 대상입니다.

2026-07-24 공용 AI 대기 UX를 카드형 progress·skeleton에서 전체 화면 near-white blur overlay로 전환했습니다. 사용자 제공 React Bits shader와 색상 설정을 OGL `Strands`로 이식하고 Kokonut UI AI Text Loading의 상태 문구 전환을 연결해 경험 분석·재분석, 추천·JD 분석, 활동 완료 경험 합성, 답변 초안 첫 결과 대기에 공통 적용했습니다. 기존 SSE / NDJSON 상태, AbortSignal 취소, 저장과 오류 계약은 바꾸지 않았고 reduced motion 정지 frame, WebGL cleanup·fallback, 중첩 body scroll 복구를 추가했습니다. 실제 로그인 분석 스플릿뷰에서 overlay·portal·canvas 각 1개, 중앙 정렬, blur, 즉시 취소 후 화면·스크롤 복구와 알림 1개를 확인했으며 관련 테스트 23개, lint, typecheck, production build, diff check를 통과했습니다. `npm audit --omit=dev`에서 기존 Next.js·PostCSS·sharp production high 3건을 재확인해 `ISSUE-036`을 갱신했고 이번 `ogl` 추가로 발생한 advisory는 없습니다.

2026-07-17 `codex/reapply-unpr-ui-polish`에서는 최신 `origin/main`의 QA 안정화 변경을 보존한 채 PR에 포함되지 않았던 UI/UX 변경을 다시 구현했습니다. 랜딩 수동 재생 컨트롤을 제거하고 명사·조사 사이 2~5px 여유와 평면 인증 입력을 적용했습니다. 빠른 기록 패널은 화면 정중앙에 배치하고, AI 실행 CTA는 colorful Border Beam과 `AI 분석` 문구를 사용합니다. 실제 checkbox는 경로 모션을 갖는 공용 Radix Checkbox로 정리했으며 추천 기록의 중복 eyebrow와 복사 텍스트를 제거했습니다. 결과가 발생하는 핵심 CTA에는 공용 RippleButton을 적용하되 인증·탐색·삭제 컨트롤은 제외했습니다. 추천 목적 `JD`는 코드와 additive migration까지 작성했고, 2026-07-23 사용자가 실제 Supabase SQL Editor에서 `jd` purpose와 `jd_analysis` 관련 migration을 적용했습니다. 로그인 세션 OpenAI·DB 저장 smoke test는 아직 남아 있습니다.

2026-07-17 팀 테스트 계정 준비를 위해 Supabase Auth 관리자 API를 사용하는 `npm run seed:test-users` 스크립트를 추가했습니다. 기본 계정은 `test1@campuslog.test`부터 `test9@campuslog.test`까지이며 비밀번호는 `test1111`부터 `test9999`까지입니다. 스크립트는 `campuslog_profile` metadata를 함께 설정해 온보딩 완료 계정처럼 사용할 수 있게 하며, 기존 계정이 있으면 비밀번호와 metadata를 갱신합니다. 사용자가 실제 Supabase project에서 9개 계정이 모두 `created`로 생성된 것을 확인했습니다. `SUPABASE_SERVICE_ROLE_KEY`는 계정 생성/초기화 담당자만 사용하는 서버 전용 관리자 키이며 앱 코드, 브라우저, 일반 팀원 env에는 공유하지 않습니다. 더미 경험·활동·기록 데이터 주입은 아직 수행하지 않았습니다.

## 구현 이력

2026-07-27 Liquid Glass 전 화면 안정화에서는 대시보드 외 활동·추천·추천 기록·분석 화면이 페이지별 웜화이트 배경으로 공통 canvas를 가리던 문제를 제거하고, 큰 콘텐츠는 near-solid 작업 공간으로 유지해 재료 계층을 연결했습니다. 나의 활동과 추천 기록 검색은 공통 clear Glass capsule, 어두운 아이콘·텍스트, filter 없는 렌더링으로 통일했고 추천 목적별 예시는 실제 입력 문장을 보존한 채 화면 chip만 짧게 정리했습니다. 360×800에서 `/dashboard`, `/experiences`, `/recommend`, `/recommend/history` 직접 진입과 가로 overflow 0을 확인했고, 390×844·1487×1058에서 활동 추가, 진행·완료 상세, AI 분석·부족 정보 답변, 추천·추천 기록·검색을 재검증했습니다. 오래된 hot-reload 상태에서 라우트 화면이 섞이는 개발 서버 현상은 완전 종료→production build→재시작으로 해소했고 재시작 뒤 브라우저 warning/error는 0건이었습니다. 전체 구조·동작 테스트 98개, lint, typecheck, production build와 diff check를 통과했습니다. API·schema·repository·사용자 데이터는 변경하지 않았습니다.

2026-07-26 사용자가 승인한 Apple Liquid Glass 방향을 인증된 제품 화면의 공통 기능 계층에 적용했습니다. `GlassSurface`는 regular / prominent / clear / solid fallback, rounded / capsule / circle, bar / popover / modal 계약을 제공하고, 데스크톱 inset 사이드바와 860px 이하 모바일 앱 바, 프로필·DropdownMenu·Select·Combobox popover, FloatingPanel·ExpandableScreen 외곽 재료가 같은 쿨뉴트럴 표현을 공유합니다. 폼·캘린더·목록·AI 결과 같은 콘텐츠 표면은 불투명 흰색으로 유지하고 웜화이트·배경 blob·Glass 중첩은 추가하지 않았습니다. 861px에서 달력 조작부가 좁아지는 브라우저 회귀를 발견해 861~1179px 대시보드 그리드를 한 열로 전환했습니다. 360·390·860·861·1024·1440px에서 `/dashboard`, `/experiences`, `/recommend` 가로 overflow 0을 확인했고, 계정 메뉴·연도 Select·활동 추가 Expandable Screen·진행 활동 필요 FloatingPanel의 열림, `Escape`, 포커스 복귀와 브라우저 warning/error 0건을 확인했습니다. reduced transparency·increased contrast·forced colors·reduced motion은 CSS fallback과 구조 테스트로 검증했으며 실제 OS 설정 강제 시각 검증은 남아 있습니다. API·schema·repository·인증·사용자 데이터 계약과 기존 랜딩·인증 화면은 변경하지 않았습니다.

2026-07-27 사이드바 반응형 안정화에서는 1180px 이상 Liquid Glass 사이드바를 224px, 861~1179px를 200px로 확장하고 `CampusLog` 워드마크 링크가 사이드바의 실제 inset과 width를 공유하도록 변경했습니다. 1400px에서 두 중심은 132px, 1024px·861px에서는 114px로 일치했고 860px에서는 기존 모바일 앱 바로 전환됐으며 네 viewport 모두 가로 overflow가 없었습니다. 전체 테스트 99개, lint, typecheck, production build를 통과했고 API·schema·repository·인증·사용자 데이터와 모바일 앱 바는 변경하지 않았습니다.

2026-07-27 나의 활동 위계 안정화에서는 `/experiences`의 H1 `나의 활동`과 설명을 목록 Liquid Glass 밖의 공통 페이지 헤더로 이동하고, 목록 표면은 H2 `전체 활동`, 전체·진행 중 개수와 검색으로 시작하도록 정리했습니다. 우측 완료 경험 상세와 AI 분석 패널은 스크롤 중에만 thumb를 표시하고 마지막 이벤트 700ms 뒤 숨기는 공용 controller/hook을 사용하며 stable gutter와 forced-colors fallback을 유지합니다. 390×844·860×800·861×800·1024×800·1400×900에서 헤더·목록 위계와 가로 overflow 0, 상세·분석의 투명→활성→투명 상태와 clientWidth 유지, 전후 동일 viewport 비교를 확인했습니다. 전체 테스트 103개, lint, typecheck, production build, diff check를 통과했고 API·schema·repository·인증·사용자 데이터는 변경하지 않았습니다.

2026-07-28 나의 활동 선택·스크롤 연속성 보정에서는 선택 행을 거의 불투명한 흰색 표면과 그림자로 띄우던 Liquid Glass override를 제거하고, 목록 안의 `5.5%` 차콜 틴트·2px 왼쪽 인디케이터·기존 focus-visible로 상태를 구분했습니다. 상세·분석 공용 transient scrollbar는 완전히 사라지지 않고 유휴 `18%`, 스크롤 중 `52%`, 마지막 이벤트 900ms 뒤 유휴 강도로 돌아가며 200ms 색 전환과 reduced-motion 80ms, stable gutter, forced-colors fallback을 유지합니다. 390×844·860×800·861×800·1024×800·1400×900에서 가로 overflow 0, 모바일 인디케이터·제목·배지 간격, 데스크톱 선택 표현을 확인했고 실제 상세 패널에서 clientWidth 379px, 분석 패널에서 475px를 유지한 idle→active→idle 상태를 각각 확인했습니다. 전체 테스트 103개, lint, typecheck, production build, diff check를 통과했고 API·schema·repository·인증·사용자 데이터는 변경하지 않았습니다.

2026-07-28 나의 활동 상세 단일 표면 보정에서는 우측 완료 경험 상세 외곽을 `rgba(255,255,255,.92)` near-white 한 면으로 통일하고 메타·본문 섹션·하단 액션을 투명 배경·no-shadow·no-blur로 평탄화했습니다. 기존 hairline 구분선, 외곽 border·radius·shadow, 버튼과 transient scrollbar는 유지했으며 AI 분석 패널의 64% 외곽·92% 내부 재료도 그대로 보존했습니다. 실제 브라우저 계산값과 전후 동일 크기 비교, 상세 닫기·재선택·분석 열기·닫기·scrollbar 18%→52%→18%, 390×844·860×800·861×800·1024×800·1400×900 가로 overflow 0을 확인했습니다. 전체 테스트 103개, lint, typecheck, production build, diff check를 통과했습니다. API·schema·repository·인증·사용자 데이터는 변경하지 않았습니다.

2026-07-28 나의 활동 scrollbar 마감에서는 페이지·활동 목록·상세·분석의 서로 다른 막대 표현을 투명 트랙과 필요할 때만 나타나는 가운데 4px 차콜 캡슐로 통일했습니다. 페이지는 10px 채널에 3px 투명 border, 목록·상세·분석은 8px 채널에 2px 투명 border를 사용해 조작 여유와 레이아웃 폭은 보존합니다. 사용자 재피드백에 따라 유휴 상태뿐 아니라 목록·상세·분석 영역·thumb hover에서도 thumb를 완전히 숨기고 실제 스크롤 중에만 `44%`로 표시합니다. 페이지 window와 활동 목록에도 기존 controller를 연결해 마지막 스크롤 이벤트 900ms 뒤 투명 상태로 돌아가며 280ms 자연 감속, reduced motion 80ms, stable gutter, forced-colors fallback을 유지합니다. 브라우저 계산값과 실제 상세 transparent→44%→transparent 전환, 390×844·860×800·861×800·1400×900 가로 overflow 0을 확인했습니다. 전체 테스트 105개, lint, typecheck, production build, diff check를 통과했고 API·schema·repository·인증·사용자 데이터는 변경하지 않았습니다.

2026-07-28 나의 활동 좌우 외곽 표면 통일에서는 54% frosted Glass였던 좌측 목록을 우측 완료 경험 상세와 같은 `--liquid-content-fill` near-white와 24px blur로 변경했습니다. 양쪽 hairline과 외곽 그림자는 기존부터 같아 유지했고, 선택 행의 차콜 틴트·2px 인디케이터, 각 패널 radius, 목록·상세·분석 전환과 모바일 세로 배치는 변경하지 않았습니다. 로그인 `/experiences`에서 완료 경험을 선택해 양쪽 배경 `rgba(255,255,255,.92)`, blur `24px`, border와 shadow가 일치하는 것을 확인했습니다. 전체 테스트 107개, lint, typecheck, production build, diff check를 통과했고 API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

2026-07-28 추천 기록 페이지/목록 위계 분리에서는 H1 `추천 기록`과 설명을 목록 Glass 밖의 공통 페이지 헤더로 이동하고, 목록은 H2 `전체 기록`, 저장 개수와 검색부터 시작하도록 변경했습니다. Breadcrumb과 `새 추천 받기`의 상단 보조 탐색 위치, 추천 선택·상세·검색·저장 데이터 계약은 유지했습니다. 로그인 `/recommend/history`에서 H1/H2 접근성 구조, 페이지 헤더와 목록의 왼쪽 좌표, 1280px 가로 overflow 0을 확인했습니다. 전체 테스트 107개, lint, typecheck, production build, diff check를 통과했고 API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

2026-07-28 추천 기록 제목 규격과 나의 활동 탭 재질 통일에서는 추천 기록 sub-page를 다른 주요 화면과 같은 최대 1200px 프레임·`clamp(24px,3.2vw,48px)` gutter로 맞췄습니다. 1280px 브라우저에서 `추천 기록`, `AI 기반 활동 추천`, `오늘의 기록` H1이 left 304.4765625px, top 76px, font-size 37.95px로 일치합니다. 나의 활동은 좌측 목록과 우측 상세를 함께 54% frosted Glass·28px blur로 바꿔 대시보드·추천 기록 탭과 같은 재질을 사용하면서 이전의 좌우 동일 색 요구를 유지했습니다. 양쪽 border·shadow와 가로 overflow 0을 실제 브라우저에서 확인했습니다. 전체 테스트 108개, lint, typecheck, production build, diff check를 통과했고 API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

2026-07-28 추천 기록 상세 Liquid Glass·가독성 정리에서는 `/recommend/history` 우측 상세의 외곽과 내부 결과가 모두 Glass를 소유하던 이중 표면을 제거했습니다. 외곽만 목록과 같은 `rgba(255,255,255,.54)` frosted Glass·28px blur를 사용하고 내부 임베디드 결과는 transparent·no-border·no-shadow·no-blur로 평탄화했습니다. 상단은 kicker/도구 행과 전체 폭 제목으로 분리해 1280px에서 제목이 4줄에서 2줄로 줄었고, 메타는 기간·생성일 2열과 역할 전체 폭, 860px 이하 1열을 사용합니다. 활용 목적·질문·분석 구획은 투명+hairline, 추천 카드·근거·답변 초안은 `rgba(255,255,255,.92)` content plate로 유지하며 근거 3열은 1열로 바꿨습니다. 로그인 화면에서 계산 재질, H1/H2·닫기·활동 링크 접근성 구조, body 가로 overflow 0을 확인했습니다. 전체 테스트 109개, lint, typecheck, production build, diff check를 통과했고 API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

2026-07-28 나의 활동 검색 복원에서는 `/experiences`의 `GooeyInput`에서 Liquid Glass clear capsule override를 제거해 원래 차콜 검색 표현을 되살렸습니다. 상세가 열린 360px 목록에서 닫힌 검색은 44×42px 검은 원형·흰 20px 아이콘, 열림은 218×42px 검은 필드와 44px 원형으로 전환되며 SVG Gooey filter, 입력 자동 초점, Escape·검색어 지우기·닫기 계약을 유지합니다. 추천 기록 검색은 기존 clear Glass capsule을 그대로 사용합니다. 실제 로그인 화면에서 닫힘·열림 계산값, body 가로 overflow 없음과 전체 테스트 110개, lint, typecheck, production build, diff check를 확인했습니다. API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

2026-07-28 추천 입력 액션·이미지 첨부 마감에서는 `/recommend`의 `AI 분석`에서 검은 prominent override를 제거해 활동 상세 `다시 분석하기`와 같은 44px 흰 프레임·12px 모서리·animated gradient 테두리/텍스트/아이콘을 사용하도록 복원했습니다. 빈 이미지 첨부는 fieldset이 바깥 1px 점선을 직접 소유하고 내부 dropzone의 실선·배경을 제거해 이중 경계를 없앴으며, 파일이 있는 Gallery는 기존 표면을 유지하면서 `전체 삭제`를 clear Glass capsule로 정리했습니다. 로그인 브라우저에서 빈 상태 계산값, CTA 계산값, 가로 overflow 0을 확인했고 파일 제한·추가/삭제·추천 요청·API·schema·repository·사용자 데이터에는 영향이 없습니다.

2026-07-28 Breadcrumb 내비게이션 레일 통일에서는 데스크톱 상위 화면·추천 기록이 1200px/3.2vw를 쓰는 동안 일반 하위 화면이 1120px/5vw를 사용해 화면 전환 시 경로와 H1이 약 23px 움직이던 문제를 수정했습니다. 861px 이상 Liquid Glass 제품 화면에서 `.primary-page`와 `.sub-page`가 같은 최대 1200px 프레임과 `clamp(24px,3.2vw,48px)` gutter를 공유하도록 통합했고, 읽기용 920px 본문 폭과 860px 이하 공통 gutter·top은 유지했습니다. 1280px 로그인 화면에서 오늘의 기록·나의 활동·AI 추천·추천 기록·활동 추가·경험 추가의 Breadcrumb x를 약 304.5px, y를 42px, H1 y를 76px로 맞추고 가로 overflow가 없음을 확인했습니다. API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

2026-07-28 Breadcrumb 전환 안정화에서는 `/experiences`에만 10px/`thin` 루트 스크롤바 폭이 적용되어 `/recommend` 등과 이동할 때 내비게이션 레일이 약 0.48px 움직이던 잔여 문제를 수정했습니다. 모든 인증 Liquid Glass 제품 라우트가 같은 루트 스크롤바 채널을 예약하도록 폭 소유권을 공통 selector로 옮기고, `/experiences`에는 스크롤 중 thumb 표시 상태만 남겼습니다. 1280px 로그인 화면에서 `/dashboard`, `/experiences`, `/recommend` 모두 `clientWidth=1269px`, 예약 폭 11px, Breadcrumb `x=304.953125px`, `y=42px`, H1 `y=76px`, 가로 overflow 0으로 일치했습니다. API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

2026-07-28 오늘의 기록 화면 전환 안정화에서는 URL 전환 전 기존 메뉴와 클릭한 목적지의 capsule이 동시에 보이던 상태를 제거했습니다. 목적지 메뉴를 즉시 단일 활성 capsule로 표시하되 `aria-current`는 실제 경로가 바뀔 때까지 현재 URL 의미를 유지합니다. 페이지 transient scrollbar hook은 나의 활동 화면에서 인증 ProductShell로 이동해 오늘의 기록·나의 활동·CampusLog AI 모두 같은 루트 thumb 표시를 사용하며, 전역 `scroll-behavior: smooth`를 제거해 이전 스크롤 위치에서 새 화면 상단으로 미끄러지는 전환과 Next.js 경고를 없앴습니다. 스크롤된 `/experiences`에서 `/dashboard`로 이동해 클릭 직후 단일 활성 메뉴, 완료 후 `scrollY=0`, `scroll-behavior=auto`, 유휴 thumb transparent, 가로 overflow 0, 브라우저 warning/error 0을 확인했습니다. API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

2026-07-28 오늘의 기록 활동 추가 CTA 마감에서는 ReUI `Expanding button from icon to label`을 현재 CampusLog Liquid Glass에 맞게 적용했습니다. hover 가능한 fine pointer에서는 접근 가능한 `활동 추가` 문구를 DOM에 유지한 채 44×44px 원형 `+`에서 hover·`focus-visible`·작성 화면 열림 시 우측 끝이 고정된 118×44px capsule로 확장하고, 터치·coarse pointer에서는 문구가 처음부터 보이는 기존 라벨 버튼을 유지합니다. 기존 RippleButton, Expandable Screen 열기·초점 복귀와 차콜 Primary 재질은 변경하지 않았고 reduced motion은 80ms로 줄였습니다. 1280×720 로그인 화면에서 접힘 44×44px·라벨 opacity 0, 열림 118×44px·라벨 opacity 1·동일한 우측 여백, dialog 연결과 가로 overflow 없음을 확인했습니다. 전체 테스트 113개, lint, typecheck, production build, diff check를 통과했으며 API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

2026-07-28 나의 활동·추천 기록 즐겨찾기에서는 unlumen UI `Pinned List`의 controlled 목록·상단 고정 구획·layout 이동을 CampusLog Liquid Glass에 맞게 적용했습니다. `/experiences`는 완료 경험만, `/recommend/history`는 모든 추천 기록을 44px Pin으로 고정하며 첫 항목이 생기면 `즐겨찾기`와 `모든 활동` 또는 `모든 기록` 구획이 나타납니다. 항목은 복제 없이 실제 위치를 옮기고 본문 선택과 Pin을 분리했으며, `aria-pressed`, 짧은 접근성 이름, 저장 중 상태, 키보드 focus와 reduced motion을 제공합니다. 사용자별 localStorage에는 entity id와 고정 시각만 저장하고 경험·추천 원문과 API·DB schema·repository는 변경하지 않았습니다. 로그인 `test1`의 데스크톱과 390×844 브라우저에서 두 목록의 고정·해제·새로고침 유지·가로 overflow 없음과 warning/error 0건을 확인했습니다. 전체 테스트 116개, lint, typecheck, production build, diff check를 통과했습니다.

2026-07-29 즐겨찾기 시각 언어는 기존 Pin에서 노란 별로 변경했습니다. 상단 재배치·사용자별 브라우저 저장·실패 rollback과 접근성 계약은 그대로 유지하고, 비선택 상태는 중립 외곽선 별, 선택 상태는 옅은 노란 Glass 안의 `#FFD84D` 채움 별로 표시합니다. 나의 활동과 추천 기록 모두 같은 44px 토글을 사용하며 API·DB schema·repository·원문 데이터는 변경하지 않았습니다.

2026-07-29 후속 즐겨찾기 조정에서는 나의 활동의 진행 중 항목도 완료 경험과 같은 즐겨찾기 대상으로 확장했습니다. 기존 경험 id 형식은 유지하고 진행 활동만 `tracked:{id}` 키로 분리해 충돌 없이 같은 사용자별 브라우저 환경설정에 저장합니다. 별 버튼의 원형 border·Glass 배경·shadow와 아이콘 stroke를 제거해 연한 회색 또는 노란색 채움 별만 보이도록 단순화했으며, 44px hit area와 `focus-visible`, `aria-pressed`, 저장 중·실패 rollback은 유지했습니다.

2026-07-29 전체 서비스 쿨 뉴트럴 Liquid Glass 통일에서는 ProductShell의 색·경계와 hover·active·selected·disabled 상태를 공통 토큰으로 재정의하고 오늘의 기록, 나의 활동 목록·상세, 추천 입력·기록, 작성·상세·분석·첨부의 과거 크림색 표면을 같은 중성 재질로 보정했습니다. 사용자 추가 승인에 따라 `/`, 로그인·회원가입·온보딩에도 `data-liquid-glass` scope를 연결해 `#eef1f6` 쿨 실버 canvas를 공유하고 공개 인증 패널은 frosted 외곽과 near-solid 입력을 사용합니다. 로그인된 1280×720 브라우저에서 핵심 제품 화면과 `/`의 색 연결·가로 overflow 없음, 계산 토큰을 확인했고 전체 테스트 117개·lint·typecheck·production build·diff check를 통과했습니다. API·DB schema·repository·인증 동작·사용자 데이터는 변경하지 않았습니다.

2026-07-29 즐겨찾기 행 selected·hover 보정에서는 제목 버튼만 배경이 바뀌어 별 영역이 분리돼 보이던 문제를 공통 `.pinned-list-item` 상태로 옮겼습니다. 나의 활동과 추천 기록 모두 선택 상태와 제목·별 hover에서 전체 행이 같은 쿨 뉴트럴 표면으로 반응하며, 내부 제목 배경은 투명하게 유지합니다. 목록 상하단의 흰색 gradient fade와 관련 상태·ResizeObserver도 제거해 실제 패널 여백과 스크롤 중 transient scrollbar만 남겼습니다. 브라우저에서 선택된 외곽 행의 275px 전체 배경, 제목 투명 배경, 별의 동일 행 포함, fade 요소 0개와 가로 overflow 0을 확인했고 전체 테스트 119개·lint·typecheck·production build·diff check를 통과했습니다. 기존 44px 별 조작·접근성 이름·`aria-pressed`, 즐겨찾기 저장 로직과 API·DB 계약은 변경하지 않았습니다.

2026-07-29 서비스 전체 Liquid Glass 레거시 마감에서는 Apple의 기능층/콘텐츠층 원칙에 맞춰 오늘의 기록 진행 활동, 한 일 남기기, 활동 추가·상세·완료 경험 초안, 경험 작성·수정, 나의 활동 AI 분석, 추천 입력과 추천 기록 상세를 다시 순회했습니다. 긴 폼·결과는 near-solid 외곽 한 장이 표면을 소유하고 내부 메타·본문·근거·답변은 투명 구획과 hairline으로 평탄화했으며, 포털 화면에는 자체 쿨 뉴트럴 토큰을 적용해 웜톤 입력과 흰 footer 띠를 제거했습니다. 활동 요약·이미지 업로드·보완 질문의 장식용 원형/사각 아이콘 plate도 제거했습니다. 로그인 브라우저의 주요 6개 경로와 AI 분석 스플릿·두 오버레이에서 알려진 과거 웜톤 계산값 0건, 가로 overflow 0을 확인했고 전체 구조 테스트 123개·lint·typecheck·production build를 통과했습니다. API·schema·repository·인증·사용자 데이터 로직은 변경하지 않았습니다.

2026-07-29 공개 인증 화면 Liquid Glass 마감에서는 첫 viewport 하단의 `스크롤하여 로그인 또는 회원가입`에서 capsule border·배경·그림자·backdrop blur를 제거해 텍스트와 화살표만 남겼습니다. 다음 인증 viewport는 쿨 실버 canvas의 약한 단일 광원층과 32px blur frosted 패널 하나로 구성하고 입력·Google·가입 방식 버튼은 near-solid white로 유지했습니다. blur 미지원·투명도 감소·대비 증가 fallback과 reduced-motion 화살표 계약을 보존했으며, 새 구조 테스트를 포함한 전체 테스트 125개·lint·typecheck·production build·diff check를 통과했습니다. 자동 브라우저 실화면 캡처는 이전 탭 연결만 남아 미검증으로 기록하며 API·schema·repository·인증 동작·사용자 데이터에는 영향이 없습니다.

2026-07-29 AI 분석 보완 편집 위계 정리에서는 부족 정보 닫힌 행에서 긴 질문을 제거하고 분류명과 답변 상태만 표시하며, 행을 열었을 때 실제 질문을 textarea 위에 한 번 표시하도록 변경했습니다. 열린 MorphSurface의 과한 그림자를 낮추고 textarea를 쿨 뉴트럴 inset control로, 기존 Warning Alert는 border·색면 없는 짧은 중립 안내로, 저장은 capsule 액션으로 정리했습니다. 스플릿 패널의 `AI 분석 결과` 헤더는 sticky·blur를 제거해 긴 결과와 함께 스크롤됩니다. 저장·포커스·Escape·단축키·접근성 이름과 repository 계약은 유지했으며 전체 테스트 126개·lint·typecheck·production build·diff check를 통과했습니다. 변경 후 자동 브라우저 캡처는 미검증이며 API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

2026-07-30 독립 완료 경험 상세 Liquid Glass 재구성에서는 `/experiences/[id]`에만 남아 있던 `border: 0`, 무곡률·무그림자·무여백 예외를 제거하고 Breadcrumb 아래 최대 900px 단일 frosted Glass 읽기 표면을 복원했습니다. 상태를 제목 위로 이동하고 기간·역할과 긴 본문은 투명 구획·hairline으로 연결했으며 링크·첨부·태그·하단 액션의 웜화이트 고정색을 공통 쿨 뉴트럴 control과 capsule로 교체했습니다. 로그인 브라우저에서 1219×1033 카드가 main 안에 들어오고 문서 가로 overflow가 없음을 확인했으며, 390×844에서도 카드 `x=16`, 폭 347px, 24px 곡률·20px 좌우 padding과 가로 overflow 없음을 확인했습니다. 전체 Node 테스트 127개·lint·typecheck·production build를 통과했고 경험 조회·수정·삭제·분석과 API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

2026-07-30 추천 기록 선택 행 연결 보정에서는 바깥 `.pinned-list-item`이 선택 배경을 소유한 뒤에도 내부 `.recommendation-history-row`에 과거 inset·drop shadow가 남아 본문과 별 사이에 세로 경계처럼 보이던 문제를 제거했습니다. 선택된 나의 활동·추천 기록 행의 내부 버튼은 background·border·box-shadow를 모두 투명/없음으로 유지하고 외곽 행만 상태 표면과 그림자를 소유합니다. 브라우저 CSS rule 적용과 전체 Node 테스트 127개·lint·typecheck·diff check를 확인했으며 즐겨찾기 저장·선택·상세·API·DB 계약은 변경하지 않았습니다.

2026-07-30 제품 workspace anchor 통일에서는 오늘의 기록·나의 활동·AI 추천·추천 기록과 활동 추가·과거 경험 기록이 공통 페이지 헤더 최소 높이와 30px 간격을 사용하도록 정리했습니다. AI 추천만 `page-stack` 28px을 사용해 데스크톱 첫 표면이 2px 위에 있던 문제를 제거하고, 860px 이하 추천 기록 이동 액션은 헤더 높이를 늘리지 않는 우측 액션으로 분리했습니다. 추천 기록 모바일의 24px 고정 gutter도 다른 화면과 같은 20px/16px로 교정했습니다. 로그인 브라우저 1218px에서 여섯 화면의 첫 표면이 `x=302.96875`, `y=200.96875`, 390×844에서 네 주요 화면이 `x=16`, `y=259`로 일치하고 가로 잘림이 없음을 확인했습니다. 전체 Node 테스트 128개·lint·typecheck·production build·diff check를 통과했으며 라우트·API·schema·repository·인증·사용자 데이터에는 영향이 없습니다.

현재 `main`에는 PR #29의 Supabase Auth foundation과 PR #30의 사용자별 데이터 schema, RLS 정책, repository 경계, 주요 화면의 Supabase repository 연결이 반영되어 있습니다. 사용자가 일반 이메일 인증 메일 흐름, Google OAuth, Supabase SQL Editor migration 적용, Table Editor 테이블 생성, 서로 다른 Google 계정의 계정별 데이터 분리 smoke test를 확인했습니다. `ux/auth-first-entry-flow`에서는 비로그인 `/` 좌측 상단에 `CampusLog` 워드마크를 고정하고, 중앙 순환 기록 문구와 GSAP 스크롤 아웃을 적용한 뒤 작은 휠 입력으로 다음 viewport의 중앙 인증 카드까지 자동 이동하도록 진입 순서를 재구성했습니다. `대학생활`은 강하게, 나머지 순환 명사는 옅고 가볍게 표시하며 조사 `을/를`은 항상 검정·강한 굵기로 고정합니다. 실제 글자 폭은 연속 보간하고 조사는 값이 실제로 바뀔 때만 전환하며, 44px 일시정지·재생 컨트롤과 reduced motion 정지 상태를 제공합니다. 구분선과 로그인 mode의 `Welcome back`·소개 문구는 제거했습니다. Tailwind CSS v4와 shadcn/ui 설정 및 Input·Label primitive도 추가했습니다. 회원가입은 이메일·Google 방식 선택으로 시작하며, 이메일은 자격 증명 뒤 이름·닉네임 Stepper를 완료하고 Google 신규·미완료 계정은 OAuth 시작 위치와 무관하게 callback 뒤 `/onboarding`에서 같은 단계를 진행합니다. 미완료 세션은 제품 화면에 진입할 수 없고 기존 계정도 완료 metadata가 없으면 최초 1회 입력합니다. 이름·닉네임은 비공개 Supabase user metadata로 저장하고 권한 판단에는 사용하지 않습니다. `/dashboard`의 빠른 기록은 설명 문단 없는 CTA 카드에서 활동·내용을 입력하는 플로팅 패널로 확장되고, 자세한 기록이 AI 분석 정확도에 도움이 된다고 안내하며 빈 상태는 `진행 활동 추가`와 `오늘로 돌아가기`로 원인을 구분합니다. 활동 추가는 누른 버튼에서 가장자리 여백을 둔 near-white 대형 둥근 패널로 확장되고 닫을 때 같은 버튼으로 축소되며, `/activities/new` 직접 진입도 같은 validation을 사용합니다. 좌측 하단은 원형 아바타·닉네임의 구분된 프로필 영역으로 바꾸고 로그아웃을 드롭다운에 통합했으며, 메뉴 제출을 안정화하고 실제 세션을 삭제한 뒤 완료 알림 없이 로그인 영역으로 복귀합니다. Checkbox·CopyButton 상태도 공용 접근성 primitive로 통일했습니다. CampusLog AI 추천 화면은 현재 경로를 반복하는 분할 탭과 제목 위 `CampusLog AI` eyebrow를 제거하고 헤더의 `추천 기록`, 기록 화면의 `새 추천 받기` 액션으로 교차 이동하도록 정리했습니다. 정식 사용자는 계정별 DB부터 새로 시작하므로 localStorage → 계정 DB 이전 UI / upsert 구현은 Deferred / Optional로 전환했습니다. `feature/ai-analysis-v2`에서는 기존 분석 네 필드의 하위 호환을 유지하면서 STAR, 원본 근거, 부족 정보, 자소서 소재 각도, 역량별 근거를 `/api/analyze` structured output, repository 저장, Supabase migration, 결과 화면에 추가했습니다. `feature/ai-analysis-gap-answers`에서는 신규 분석 출력과 화면을 요약, STAR, 주요 성과, 부족 정보 답변, 키워드 중심으로 줄이고 별도 보완 질문 생성 단계를 제거했습니다. 보완 답변은 원본 경험을 자동 수정하지 않고 추천 / 답변 초안 입력에 즉시 반영하며, 원본 경험이 분석 이후 수정된 경우에만 업데이트 필요를 표시합니다. `feature/ai-recommendation-v2`에서는 `/api/recommend`가 문항 / JD 요구사항을 구조화하고 분석 결과와 보완 답변을 활용해 경험 Top 3, 매칭 근거, 부족 근거, 과장 위험, 활용 각도를 반환·저장·표시하도록 확장했습니다. 기존 추천 v1 필드는 유지하고 v1 저장 결과는 1개 match와 빈 요구사항으로 보정해 읽습니다. `feature/ai-answer-drafts`에서는 추천 v2의 선택 match와 경험 원본, 분석 결과, 보완 답변을 바탕으로 사용자가 선택한 500자 / 800자 / 1000자 자기소개서, 면접 답변, 포트폴리오 설명 중 1개 초안을 생성하고, 별도 `answer_drafts` 저장소에 type별로 누적 연결해 기존 추천 v1/v2 기록을 보존합니다. 다음 AI 개발 초점은 `OCR / JD 이미지 입력`입니다.

2026-07-23 AI 추천 목적별 재정리에서는 신규 생성 목적을 면접 / 자기소개서 / JD 분석 / 기타로 제한하고, 포트폴리오와 대외활동 지원서는 기타 목적에 포함했습니다. 기존 저장된 `portfolio`, `activity_application` 기록은 `other`로 읽어 하위 호환을 유지합니다. 추천 단계는 질문 / JD를 역량, 기술, 행동, 역할, 성과로 분해하고 원본 경험과 보완 답변만 사실 근거로 사용하며 기존 AI 분석 결과는 참고 자료로만 사용합니다. 직접 근거가 부족하면 3개를 채우지 않고, 추천 이유와 직접 근거, 부족 정보, 과장 주의점을 분리합니다. 생성 단계는 사용자가 추천 경험과 목적별 생성 타입을 선택한 뒤에만 실행하며, 서버에서도 목적에 맞지 않는 타입 요청을 거절합니다. JD 분석은 담당 업무, 필수요건, 우대사항, 기술 스택, 요구 경험, 요구사항별 충족 상태, 강조점, 부족 역량, 과장 금지 부분, 최종 지원 판단을 표시합니다. 외부 OpenAI 호출은 이번 자동 검증에서 실행하지 않았고, 실제 품질 확인은 남아 있습니다.

2026-07-23 AI 추천 목적별 예시 문항 개선에서는 면접, 자기소개서, JD 분석, 기타의 예시를 실제 채용·지원 과정에서 사용자가 입력할 법한 문장으로 교체했습니다. JD 분석의 첫 예시는 버튼 문구와 입력값을 분리해, 선택 시 단순 안내가 아니라 백엔드 개발자 채용공고 샘플 전문이 입력되도록 했습니다. 목적 값과 기존 포트폴리오·대외활동 지원서 저장값의 기타 호환 로직은 유지했습니다. `npm run lint`, `npx tsc --noEmit`, `npm run build`를 통과했고 사용자가 예시 선택 입력 반영 등 직접 로직 테스트를 완료했습니다.

2026-07-23 AI 구조화 호출 1차 대기 UX 개선에서는 API 응답 계약과 모델 호출 방식은 유지한 채 공통 `AIProcessingPanel`을 추가했습니다. 경험 분석 / 재분석, AI 추천 / JD 분석, 활동 완료 경험 합성, 추천 기반 답변 초안 생성은 이제 처리 대상 메타 정보, 단계형 안내 문구, 결과 유형별 skeleton, 장기 대기 안내를 표시합니다. 기존 입력과 기존 분석 결과는 대기 중에도 유지하며, 추천 / 분석 / 활동 합성 / 답변 초안의 중복 실행 방지를 보강했습니다. 답변 초안 생성 대기에는 목표 분량과 선택 조건에 맞춰 초안을 교정할 수 있다는 안내를 추가했습니다. `npm run lint`, `npm run build`, `git diff --check`를 통과했고 Codex가 `/recommend`와 `/experiences` 기본 렌더링을 확인했으며 사용자가 직접 로직 테스트를 완료했습니다. 실제 로그인 세션의 장시간 OpenAI 응답 중 표시 상태와 저장 성공 경로 smoke test는 후속 확인 대상입니다.

2026-07-23 답변 초안 생성 2차 스트리밍 UX에서는 `/api/answer-drafts`의 기존 strict JSON 응답을 그대로 유지하고, `stream: true` 요청에서만 NDJSON 이벤트 계약을 추가했습니다. 서버는 OpenAI Responses structured output 스트림을 내부에서 누적해 raw JSON 토큰을 화면에 노출하지 않고 `draft.content` 문자열만 `delta` 이벤트로 전달합니다. 자기소개서 분량 교정이 발생하면 `replace` 이벤트로 최종 본문을 교체하며, 클라이언트는 `completed` 이벤트의 정규화된 `AnswerDraftResult`만 기존 answer drafts 저장소에 저장합니다. 추천 결과 화면은 첫 본문 전 1차 단계형 로딩 패널을 유지하고, 첫 본문 이후에는 텍스트 점진 렌더링, 커서, 목표 글자 수 표시, 실패 시 부분 텍스트 유지와 같은 조건 재시도를 제공합니다. `git diff --check`, `npm run lint`, `npm run build`를 통과했고 UI preview 개발 서버에서 `/recommend` 기본 렌더링과 브라우저 앱 콘솔 error 0건을 확인했으며 사용자가 직접 로직 테스트를 완료했습니다. 구조화 호출 이벤트 스트리밍은 아직 구현하지 않고 후속 단계로 남겼습니다.

2026-07-23 AI 요청 측정 / 취소 3차에서는 `/api/analyze`, `/api/recommend`, `/api/synthesize-activity`, `/api/evidence-followups`, `/api/answer-drafts`에 공통 메타데이터 측정을 추가했습니다. 기록하는 값은 기능 종류, 응답 유형, 입력 글자 수, 경험 수, 목표 글자 수, 모델, 스트리밍 TTFT, 전체 완료 시간, 성공 / 실패 / 취소, 재시도 여부뿐이며 원문 입력과 생성 본문은 로그에 남기지 않습니다. 각 route handler는 클라이언트 연결 종료를 OpenAI fetch AbortController에 연결하고 취소 응답을 `REQUEST_CANCELLED`로 반환합니다. 클라이언트 API helper와 경험 분석 / AI 추천 / 활동 완료 경험 합성 / 답변 초안 스트리밍 UI는 AbortSignal을 전달하며, 취소 시 기존 입력과 기존 결과를 유지합니다. 답변 초안 스트리밍은 취소 시 부분 텍스트를 저장하지 않고 화면에 남겨 같은 조건으로 재시도할 수 있게 했습니다. `npm run lint`, `npm run build`, UI preview의 `/experiences`와 `/recommend` 기본 렌더링을 확인했습니다. 실제 장시간 OpenAI 호출에서 외부 요청이 어느 시점에 중단되는지, 취소 후 비용이 얼마나 절감되는지, 배포 환경에서 로그를 어디에 수집할지는 후속 검증 대상입니다.

2026-07-23 구조화 호출 4차 이벤트 스트리밍에서는 `/api/analyze`, `/api/recommend`, `/api/synthesize-activity`의 기존 JSON 응답을 유지하면서 `stream: true` 요청에만 SSE 이벤트 계약을 추가했습니다. 서버는 `status` 이벤트로 자체 단계 문구를 전달하고, 기존 단일 OpenAI structured output 호출과 정규화 / 파싱이 끝난 뒤 최종 JSON만 `completed` 또는 `error` 이벤트로 보냅니다. 클라이언트 helper는 SSE를 읽어 기존 `AIProcessingPanel`의 안내 문구를 갱신하고, 완료 결과는 기존 저장 / 표시 흐름에 넘깁니다. raw JSON 토큰, 부분 추천 결과, 저장용 재호출, UI 상태를 위한 추가 AI 호출은 도입하지 않았습니다. `npm run lint`, `npm run build`를 통과했습니다. 실제 로그인 세션 장시간 호출과 배포 환경의 SSE 버퍼링 여부는 후속 확인 대상입니다.

2026-07-23 AI 추천 입력 선별·압축에서는 `/recommend` 화면이 저장된 모든 경험 원문과 분석 전체를 `/api/recommend`로 보내지 않도록 변경했습니다. 활용 목적과 입력 문항 / JD의 키워드, 실패·문제·협업·기술 등 의도 신호, 최신 수정일, 분석 / 보완 답변 보유 여부로 후보를 정렬하고, 상위 후보의 설명·성과·분석 요약·STAR·키워드·부족 정보 답변만 72KB 요청 예산 안에서 압축해 전송합니다. 원본 경험과 저장된 분석은 repository에 그대로 보존하며 추천 결과 저장과 답변 초안 생성은 선택된 경험 id로 원본 데이터를 다시 조회합니다. 100개 더미 경험 / 분석 기준 18개 후보, 약 52KB 요청으로 압축되는 것을 확인했고 `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`를 통과했습니다.

`feature/ai-api-protection`에서는 `/api/analyze`, `/api/recommend`, `/api/synthesize-activity`가 route handler 내부에서도 Supabase 세션을 확인합니다. 비로그인 요청은 공통 401 `SESSION_REQUIRED` JSON으로 반환하고, 요청 크기 / 필드 상한, OpenAI timeout, 사용자별 runtime-local rate guard와 429 `RATE_LIMITED` + `retryAfter` contract를 추가했습니다. `service_role` key는 사용하지 않으며 AI 세부 계약은 `docs/AI_API_CONTRACT.md`에 기록했습니다.

## v1.1 완료 기준선

```text
활동 추가
→ 날짜별로 실제 한 일 기록
→ 월간 캘린더 확인
→ 활동 종료
→ AI 사실 기반 완료 경험 초안
→ 사용자 검토 후 나의 활동 저장
→ AI 분석
→ CampusLog AI 추천과 추천 기록
```

주요 완료 사항:

- `/dashboard`: 오늘의 기록, 진행 활동, 캘린더, 빠른 기록, 날짜별 기록
- `/activities/new`: 제목·활동 정보·시작일·예상 종료일 또는 미정으로 활동 추가
- `/activities/[id]`: 활동 상태, 타임라인, 종료, AI 합성, 완료 경험 저장
- `/experiences`: 완료 경험과 진행 활동을 함께 보는 나의 활동
- `CampusLog AI`: AI 기반 활동 추천과 추천 기록
- localStorage 데이터 호환, 활동 종료 AI 합성 멱등성, 추천 저장 실패 처리
- 검정·차콜·웜그레이 앱 셸, Petrona 워드마크, 모바일·데스크톱 반응형

검증:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- 주요 라우트 데스크톱·390×844 모바일 확인
- 가로 overflow와 콘솔 warning/error 확인

상세 기준선은 `docs/archive/MVP_V1_1_BASELINE.md`를 참고합니다.

## 활성 계획 단계 — 2차 MVP

### Track A. 인증·데이터·AI 고도화

담당: 다른 팀원

- 로그인 / 회원가입 / 로그아웃 / 세션
- 이메일 또는 이에 준하는 아이디 + 비밀번호 인증과 Google OAuth
- Supabase Auth / Postgres와 사용자별 데이터 격리
- localStorage 자동 이전·자동 삭제 금지 정책과 repository 구조
- AI 분석·추천 정확도, 근거, 결과 구조 고도화
- JD 원문·직무 요구사항·우대사항 기반 경험 추천과 부족 경험 비교
- 질문 이미지 OCR / vision 입력과 답변 초안 생성
- 인증된 API, rate limit, 비용 한도, 오류 관측성

### Track B. 디자인·사용자 경험 고도화

담당: 사용자

- 현재 검정·차콜 디자인 시스템 고도화
- 로그인·회원가입 UX
- 오늘의 기록, 나의 활동, CampusLog AI 사용성 개선
- loading / empty / error / success / offline 상태
- 모바일·데스크톱 반응형, 키보드 접근성, 대비, reduced motion

## 다음 작업 순서

1. 진행 활동 / 마무리 필요 활동 수정과 미래 예정 종료일 활동의 즉시 종료 / AI 초안 생성 브라우저 회귀 확인 (`ISSUE-070`)
2. 2026-07-17 QA 수정 범위의 실제 로그인 세션 브라우저 회귀 확인
3. 테스트 계정별 더미 경험·활동·기록 데이터 seed 필요 여부 결정
4. 목적별 AI 추천·생성 실제 로그인 세션 smoke test: 면접 / 자기소개서 / JD 분석 / 기타 추천 저장·재조회, 목적별 생성 옵션 노출, 생성 결과 확인 (`ISSUE-079`)
5. AI 구조화 호출 status 이벤트의 배포 환경 검증: 장시간 OpenAI 호출 중 status 표시와 SSE 버퍼링 확인 (`ISSUE-083`)
6. 답변 초안 스트리밍 배포 환경 버퍼링 여부와 장시간 응답 회귀 모니터링 (`ISSUE-081`)
7. AI 요청 측정 / 취소의 실제 로그인 세션 검증: 장시간 OpenAI 호출 중 취소 버튼, 서버 로그 메트릭 값, 스트리밍 TTFT / 완료 시간, 취소 후 저장 방지 확인 (`ISSUE-082`)
8. JD 분석 실제 OpenAI 응답 품질 확인과 prompt 튜닝 (`ISSUE-079`)
9. OCR / JD 이미지 입력: 텍스트 붙여넣기 흐름 안정화 후 Optional로 검토
10. 분석 부족 정보 답변 저장의 실제 로그인 세션 smoke test와 추천 반영 평가 기준 정리
11. AI API 보호 foundation 실제 세션 환경 smoke test와 durable rate limit / OpenAI spend alert 운영 결정
12. 추천 v2 / 목적별 답변 생성 저장 smoke test
13. 활동 종료 합성 초안 저장과 완료 Experience 생성 흐름을 Supabase DB 기준으로 추가 브라우저 검증
14. Vercel + Supabase preview 환경 통합 확인
15. 통합 회귀·보안·비용·접근성 검증

## 활성 기준 문서

1. `docs/CURRENT_PHASE.md`
2. `PRD.md`
3. `docs/USER_FLOW.md`
4. `docs/IA.md`
5. `docs/SCREEN_SPEC.md`
6. `docs/DESIGN.md`
7. `docs/IMPLEMENTATION_PLAN.md`
8. `docs/AUTH_CONTRACT.md`
9. `docs/AI_API_CONTRACT.md`
10. `docs/DATA_CONTRACT.md`
11. `docs/TODO.md`
12. `docs/ISSUE_LOG.md`
13. `docs/TASK_LOG.md`

`docs/archive/**`는 과거 기준선과 회귀 확인용이며 현재 2차 MVP 구현을 제한하지 않습니다.

## 남은 위험

- 이메일 확인·비밀번호 재설정, 동일 이메일 provider 연결 정책은 현재 AI 개발을 막지 않는 후속 인증 정책 항목
- 비밀번호 validation과 계정 열거 방지 오류 문구 contract는 현재 AI 개발을 막지 않는 후속 인증 정책 항목
- Supabase 기본 email provider signup rate limit 때문에 개발 테스트용 SMTP / confirm email 정책 결정 필요
- localStorage → DB 마이그레이션 UI와 upsert 구현은 Deferred / Optional. 원본 자동 삭제 금지와 로그인 세션의 계정 DB 우선 정책은 유지
- 활동 종료 합성 초안 RLS·보존·완료 Experience 멱등 저장은 Supabase repository로 연결됐지만 완료 저장 흐름의 실제 브라우저 검증은 추가 필요
- DailyLog write 뒤 합성 draft·activity 상태 무효화가 단일 DB transaction이 아니어서 부분 성공을 실패로 오인할 수 있음 (`ISSUE-039`)
- Google 계정 A/B 데이터 분리 수동 smoke test는 완료했지만 SQL-level 또는 자동화된 RLS 정책 검증은 아직 별도로 수행하지 않음
- AI API route-level 보호와 runtime-local rate guard는 추가됐지만 Vercel 다중 인스턴스용 durable rate limit, 중복 요청 멱등성, OpenAI spend limit / alert는 후속 hardening 필요
- AI 경험 분석 v2는 로그인 `test4` 계정의 상세 역할 220자 경험에서 OpenAI SSE 완료와 Supabase 저장·결과 표시를 확인. 다른 경험 형태와 배포 환경의 추가 회귀는 남음 (`ISSUE-135`)
- 목적별 추천 v2와 JD 분석은 Supabase migration 적용과 예시 선택 입력 반영 로직 테스트는 완료됐지만 실제 로그인 세션 OpenAI 성공 경로, 저장·재조회, 결과 품질 smoke test 필요 (`ISSUE-079`)
- AI 추천 입력 선별·압축은 100개 더미 데이터 기준 요청 크기 검증을 완료했지만 실제 로그인 세션의 장기 누적 경험 데이터에서 후보 품질과 OpenAI 추천 품질 smoke test 필요 (`ISSUE-084`)
- 목적별 답변 생성은 정적 검사와 build를 통과했지만 실제 OpenAI 성공 경로와 생성 결과 품질 smoke test 필요 (`ISSUE-079`)
- AI 구조화 호출 1차 대기 UX는 실제 로그인 경험 분석에서 단계 문구, `/api/analyze` 200, 저장 성공 경로를 확인. 추천·활동 합성·답변 초안과 배포 환경의 추가 회귀는 남음 (`ISSUE-080`)
- 답변 초안 스트리밍은 정적 검사, build, 기본 렌더링과 사용자 직접 로직 테스트를 완료했지만 배포 환경의 스트림 버퍼링 여부와 장시간 응답 회귀 모니터링 필요 (`ISSUE-081`)
- AI 요청 측정 / 취소 3차는 정적 검사, build, 기본 렌더링을 통과했지만 실제 로그인 세션의 장시간 OpenAI 취소, 서버 로그 메타데이터 확인, 외부 AI 요청 중단 시점과 비용 영향은 추가 검증 필요 (`ISSUE-082`)
- 구조화 호출 4차 이벤트 스트리밍은 실제 로그인 경험 분석에서 status 표시와 completed·저장 성공을 확인. error 처리와 추천·활동 합성, 배포 환경 SSE 버퍼링은 추가 검증 필요 (`ISSUE-083`)
- 기록 보완 루프의 실제 OpenAI 성공 경로, Supabase migration 적용 후 저장 smoke test, 평가 기준과 회귀 사례 필요
- 팀 테스트용 Supabase Auth 계정 9개는 생성됐지만, 각 계정에 넣을 더미 경험·활동·기록 데이터 seed는 아직 없음
- 2026-07-17 QA 수정은 `npm run lint`, `npm run build`를 통과했지만 실제 로그인 세션에서 보완 질문 복원, 활동 삭제 cascade, 완료 활동 복원, 날짜별 기록 제한, 답변 초안 실제 OpenAI 분량 보정, 작은 화면 팝업 스크롤 회귀 확인이 아직 필요
- 진행 활동 / 마무리 필요 활동 수정과 미래 예정 종료일 활동의 즉시 종료 / AI 초안 생성 수정은 `npm run lint`, `npm run build`를 통과했지만 실제 로그인 세션 브라우저에서 아직 수동 확인하지 않음
- OCR 이미지 원본 저장 여부와 Supabase Storage 도입 범위 미확정
- 새 활동 추가 패널과 프로필 메뉴의 실제 390px 기기 시각 smoke test 미완료
- 현재 기기 로그아웃의 `local` scope와 동일 계정 동시 작업은 직접 로직 테스트를 완료. 로그아웃 실패 안내·재시도와 미저장 입력 경고 정책은 별도로 남음 (`ISSUE-043`)
- Track 간 공통 파일 충돌과 merge 순서 관리 필요
- 기존 Next.js 15.5.20과 전이 PostCSS·sharp에 production high advisory 3건이 남아 있어 별도 framework dependency 업데이트와 인증·API·이미지 처리 회귀 검증 필요 (`ISSUE-036`)

## Git 상태 주의

v1.1 checkpoint는 main에 병합되었습니다. 2차 MVP 기능은 `main`에 직접 추가하지 않고, 최신 main에서 작은 기능 브랜치로 진행합니다.
