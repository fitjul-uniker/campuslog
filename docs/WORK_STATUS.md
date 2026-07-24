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
- [x] AI API 보호 foundation: 세 AI API Route의 서버 세션 확인, 401 JSON 오류, 입력 상한, timeout, runtime-local rate guard 적용
- [x] AI 경험 분석 v2.1: STAR, 주요 성과, 부족 정보 답변, 키워드 중심 schema / 저장 / 표시 간소화
- [x] 추천 v2: 문항 / JD 요구사항 추출, 경험 Top 3 매칭, 부족 근거와 과장 위험 schema / 저장 / 표시 구현
- [x] AI 추천 목적별 흐름 재정리: 신규 목적을 면접 / 자기소개서 / JD 분석 / 기타로 제한하고, 목적별 입력 안내·예시·생성 옵션·CTA를 단일 설정 객체로 관리 (`ISSUE-079`)
- [x] AI 추천 목적별 예시 문항을 실제 채용·지원 문항에 가깝게 교체하고, JD 분석 첫 예시 선택 시 백엔드 개발자 JD 샘플이 입력되도록 조정 (`ISSUE-079`)
- [x] 답변 생성 목적별 제한: 추천 v2 선택 경험 기반 자기소개서 300자 / 500자 / 1000자, 면접 30초 / 1분 이상 / 예상 꼬리 질문, JD 지원 전략, 기타 맞춤 결과 단일 초안 schema / 저장 / 표시 구현 (`ISSUE-079`)
- [x] AI 구조화 호출 1차 대기 UX 개선: 경험 분석 / 재분석, AI 추천 / JD 분석, 활동 완료 경험 합성, 추천 기반 답변 초안 생성에 단계형 안내, skeleton, 장기 대기 안내, 처리 대상 메타 정보와 중복 실행 방지 보강 (`ISSUE-080`)
- [x] 공용 AI 대기 화면을 React Bits Strands와 Kokonut UI AI Text Loading 기반 전체 화면 blur overlay로 전환하고 2.4초 문구 전환·`...` 끝맺음·아이콘/글자형 취소 액션·조용한 추천 취소와 기존 상태 이벤트·저장 계약 유지 (`ISSUE-093`)
- [x] 답변 초안 생성 2차 스트리밍 UX 구현: `/api/answer-drafts`의 기존 JSON 계약을 유지하면서 `stream: true` NDJSON 이벤트 계약, 본문 delta 미리보기, 분량 교정 replace, 완료 후 최종 저장 적용 (`ISSUE-081`)
- [x] AI 요청 측정 / 취소 3차 구현: 민감 원문 없이 기능·분량·모델·TTFT·전체 시간·성공 / 실패 / 취소·재시도 여부를 서버 로그로 기록하고, 경험 분석 / 추천 / 활동 합성 / 답변 초안 스트리밍에 AbortController 기반 취소 UI 적용 (`ISSUE-082`)
- [x] 구조화 호출 4차 이벤트 스트리밍 구현: 경험 분석 / AI 추천 / 활동 완료 경험 합성에 `status` SSE 이벤트와 최종 JSON `completed` / `error` 이벤트를 적용하고 raw JSON 토큰과 부분 구조화 결과 노출은 제외 (`ISSUE-083`)
- [x] AI 추천 입력 선별·압축 구현: 저장된 전체 경험 원문 전송 대신 목적 / 문항 기반 후보 context를 72KB 요청 예산 안에서 전송해 경험 수 증가 시 `/api/recommend` 본문 상한 초과 방지 (`ISSUE-084`)
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
- [x] 하위 화면 Basic Breadcrumb과 날짜별 기록의 검색 없는 활동 선택 목록을 적용하고, 신규 기록의 `활동을 선택하세요` 초기 상태·390px 키보드·overflow 검증 완료 (`ISSUE-068`)
- [x] 인증 제품 화면 전체에 Basic Breadcrumb을 적용하고 오늘의 기록·나의 활동·AI 추천과 하위 화면 7곳의 페이지 프레임·제목 규격을 통일해 1440px·1024px·532px 좌표 및 overflow 검증 완료 (`ISSUE-069`)
- [x] 나의 활동 완료 경험 인라인 상세에 `/experiences/[id]`로 이동하는 `활동 상세 보기` 주요 액션을 복원하고 상세 슬롯 560px 이하에서 액션 한 줄 배치 적용 (`ISSUE-071`)
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

2026-07-24 완료 경험 첨부 기능은 새 경험·수정 폼에 `사진 첨부`, `자료 첨부`를 추가하고 선택 사진 썸네일, 파일명·크기, 삭제를 현재 폼 위계 안에 배치했습니다. 사진은 JPG·PNG·WebP, 자료는 PDF만 허용하며 경험당 3개, 파일당 5MB와 빈 파일 차단을 UI·Storage bucket·DB constraint에서 적용합니다. 원본 object는 사용자 ID 경로의 private `experience-attachments` bucket, metadata는 RLS가 적용된 `experience_attachments` table에 저장합니다. 인라인·독립 상세에서 1시간 signed URL로 열고 독립 상세에서 개별 삭제할 수 있습니다. 첨부 타입과 repository를 `Experience`와 분리해 AI 분석·추천 입력에는 포함하지 않으며, 첨부만 추가한 수정은 경험 원문과 분석 상태를 갱신하지 않습니다. 전체 테스트 49개, lint, typecheck, production build와 1440px·390px UI preview를 통과했으며 실제 Supabase project migration과 로그인 세션 Storage smoke test는 남았습니다.

2026-07-24 AI 분석의 부족 정보 답변을 항상 펼쳐진 카드 목록에서 질문별 흰색 `MorphSurface`로 전환했습니다. 닫힌 상태는 원형 상태 아이콘·작은 분류·한 줄 질문·답변 여부·Chevron만 남긴 command bar로 정리하고, 한 번에 하나만 펼치며 열림 시 같은 표면 안에서 전체 질문·필요 이유·답변 입력·메타·차콜 저장 액션을 표시합니다. 선택 시안에 맞춰 베이지 채움과 입력 줄무늬를 제거했습니다. 후속 시각 점검에서 표면 상향 이동량이 질문 간격과 같아 이전 질문과 맞닿고 root layout spring이 질문 전환 중 scale 변형을 만드는 원인을 확인해, 표면 상단을 고정한 anchored reveal로 교체했습니다. 질문 사이는 16px을 유지하고 reveal 높이가 0에서 자연 높이로 열리며 본문은 아래 12px에서 원위치로 올라옵니다. 새 열림에는 짧은 지연을 두고 모바일 추가 translate를 제거했습니다. 기본 `답변 없음`과 화면의 Command/Ctrl+Enter 안내는 제거해 빈 답변 상태에 글자 수와 저장 버튼만 남겼으며, 저장 중·실패·작성 중·완료·마지막 저장처럼 실제 상태 변화는 계속 표시합니다. textarea 자동 초점에는 `preventScroll`을 사용하고 바깥 클릭과 Escape 닫기·trigger 초점 복귀, 화면 안내 없는 Command/Ctrl+Enter 저장, 성공 뒤에만 닫기, 오류 시 입력 유지 계약을 보존했습니다. 기존 `evidenceGaps`, `experience_followups`, repository와 API 계약은 변경하지 않았고 새 dependency도 추가하지 않았습니다. 관련 구조 테스트 12개, lint, typecheck, production build를 통과했고 실제 로그인 독립 분석 화면에서 인접 질문 16px 간격·표면 transform 없음·열린 질문 1개와 전환 중 겹침 제거를 확인했습니다. 새 모션의 390px 실제 캡처와 reduced motion 강제 에뮬레이션은 후속 시각 확인 대상입니다.

2026-07-24 공용 AI 대기 UX를 카드형 progress·skeleton에서 전체 화면 near-white blur overlay로 전환했습니다. 사용자 제공 React Bits shader와 색상 설정을 OGL `Strands`로 이식하고 Kokonut UI AI Text Loading의 상태 문구 전환을 연결해 경험 분석·재분석, 추천·JD 분석, 활동 완료 경험 합성, 답변 초안 첫 결과 대기에 공통 적용했습니다. 기존 SSE / NDJSON 상태, AbortSignal 취소, 저장과 오류 계약은 바꾸지 않았고 reduced motion 정지 frame, WebGL cleanup·fallback, 중첩 body scroll 복구를 추가했습니다. 실제 로그인 분석 스플릿뷰에서 overlay·portal·canvas 각 1개, 중앙 정렬, blur, 즉시 취소 후 화면·스크롤 복구와 알림 1개를 확인했으며 관련 테스트 23개, lint, typecheck, production build, diff check를 통과했습니다. `npm audit --omit=dev`에서 기존 Next.js·PostCSS·sharp production high 3건을 재확인해 `ISSUE-036`을 갱신했고 이번 `ogl` 추가로 발생한 advisory는 없습니다.

2026-07-17 `codex/reapply-unpr-ui-polish`에서는 최신 `origin/main`의 QA 안정화 변경을 보존한 채 PR에 포함되지 않았던 UI/UX 변경을 다시 구현했습니다. 랜딩 수동 재생 컨트롤을 제거하고 명사·조사 사이 2~5px 여유와 평면 인증 입력을 적용했습니다. 빠른 기록 패널은 화면 정중앙에 배치하고, AI 실행 CTA는 colorful Border Beam과 `AI 분석` 문구를 사용합니다. 실제 checkbox는 경로 모션을 갖는 공용 Radix Checkbox로 정리했으며 추천 기록의 중복 eyebrow와 복사 텍스트를 제거했습니다. 결과가 발생하는 핵심 CTA에는 공용 RippleButton을 적용하되 인증·탐색·삭제 컨트롤은 제외했습니다. 추천 목적 `JD`는 코드와 additive migration까지 작성했고, 2026-07-23 사용자가 실제 Supabase SQL Editor에서 `jd` purpose와 `jd_analysis` 관련 migration을 적용했습니다. 로그인 세션 OpenAI·DB 저장 smoke test는 아직 남아 있습니다.

2026-07-17 팀 테스트 계정 준비를 위해 Supabase Auth 관리자 API를 사용하는 `npm run seed:test-users` 스크립트를 추가했습니다. 기본 계정은 `test1@campuslog.test`부터 `test9@campuslog.test`까지이며 비밀번호는 `test1111`부터 `test9999`까지입니다. 스크립트는 `campuslog_profile` metadata를 함께 설정해 온보딩 완료 계정처럼 사용할 수 있게 하며, 기존 계정이 있으면 비밀번호와 metadata를 갱신합니다. 사용자가 실제 Supabase project에서 9개 계정이 모두 `created`로 생성된 것을 확인했습니다. `SUPABASE_SERVICE_ROLE_KEY`는 계정 생성/초기화 담당자만 사용하는 서버 전용 관리자 키이며 앱 코드, 브라우저, 일반 팀원 env에는 공유하지 않습니다. 더미 경험·활동·기록 데이터 주입은 아직 수행하지 않았습니다.

## 구현 이력

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
5. AI 구조화 호출 status 이벤트의 실제 로그인 세션 검증: 장시간 OpenAI 호출 중 상태 문구 갱신, completed / error 이벤트, 저장 성공 경로 확인 (`ISSUE-083`)
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
- AI 경험 분석 v2의 실제 OpenAI 성공 경로와 Supabase migration 적용 후 저장 smoke test 필요
- 목적별 추천 v2와 JD 분석은 Supabase migration 적용과 예시 선택 입력 반영 로직 테스트는 완료됐지만 실제 로그인 세션 OpenAI 성공 경로, 저장·재조회, 결과 품질 smoke test 필요 (`ISSUE-079`)
- AI 추천 입력 선별·압축은 100개 더미 데이터 기준 요청 크기 검증을 완료했지만 실제 로그인 세션의 장기 누적 경험 데이터에서 후보 품질과 OpenAI 추천 품질 smoke test 필요 (`ISSUE-084`)
- 목적별 답변 생성은 정적 검사와 build를 통과했지만 실제 OpenAI 성공 경로와 생성 결과 품질 smoke test 필요 (`ISSUE-079`)
- AI 구조화 호출 1차 대기 UX는 정적 검사와 기본 렌더링, 사용자 직접 로직 테스트를 완료했지만 실제 로그인 세션에서 장시간 OpenAI 응답 중 표시 상태와 저장 성공 경로 smoke test 필요 (`ISSUE-080`)
- 답변 초안 스트리밍은 정적 검사, build, 기본 렌더링과 사용자 직접 로직 테스트를 완료했지만 배포 환경의 스트림 버퍼링 여부와 장시간 응답 회귀 모니터링 필요 (`ISSUE-081`)
- AI 요청 측정 / 취소 3차는 정적 검사, build, 기본 렌더링을 통과했지만 실제 로그인 세션의 장시간 OpenAI 취소, 서버 로그 메타데이터 확인, 외부 AI 요청 중단 시점과 비용 영향은 추가 검증 필요 (`ISSUE-082`)
- 구조화 호출 4차 이벤트 스트리밍은 정적 검사와 build를 통과했지만 실제 로그인 세션의 장시간 OpenAI 호출 중 status 이벤트 표시, completed / error 처리, 배포 환경 SSE 버퍼링 여부는 추가 검증 필요 (`ISSUE-083`)
- 기록 보완 루프의 실제 OpenAI 성공 경로, Supabase migration 적용 후 저장 smoke test, 평가 기준과 회귀 사례 필요
- 팀 테스트용 Supabase Auth 계정 9개는 생성됐지만, 각 계정에 넣을 더미 경험·활동·기록 데이터 seed는 아직 없음
- 2026-07-17 QA 수정은 `npm run lint`, `npm run build`를 통과했지만 실제 로그인 세션에서 보완 질문 복원, 활동 삭제 cascade, 완료 활동 복원, 날짜별 기록 제한, 답변 초안 실제 OpenAI 분량 보정, 작은 화면 팝업 스크롤 회귀 확인이 아직 필요
- 진행 활동 / 마무리 필요 활동 수정과 미래 예정 종료일 활동의 즉시 종료 / AI 초안 생성 수정은 `npm run lint`, `npm run build`를 통과했지만 실제 로그인 세션 브라우저에서 아직 수동 확인하지 않음
- OCR 이미지 원본 저장 여부와 Supabase Storage 도입 범위 미확정
- 새 활동 추가 패널과 프로필 메뉴의 실제 390px 기기 시각 smoke test 미완료
- 로그아웃 실패 안내·재시도, 세션 scope와 미저장 입력 경고 정책 미확정 (`ISSUE-043`)
- Track 간 공통 파일 충돌과 merge 순서 관리 필요
- 기존 Next.js 15.5.20과 전이 PostCSS·sharp에 production high advisory 3건이 남아 있어 별도 framework dependency 업데이트와 인증·API·이미지 처리 회귀 검증 필요 (`ISSUE-036`)

## Git 상태 주의

v1.1 checkpoint는 main에 병합되었습니다. 2차 MVP 기능은 `main`에 직접 추가하지 않고, 최신 main에서 작은 기능 브랜치로 진행합니다.
