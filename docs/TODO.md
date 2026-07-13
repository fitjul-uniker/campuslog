# CampusLog TODO

## 문서 상태

- v1.1 고도화: commit / push / PR #27 main merge 완료
- 활성 계획: 2차 MVP
- 단계 기준: `docs/CURRENT_PHASE.md`

새 작업은 담당 Track과 완료 조건을 명시합니다. 과거 1차 MVP 제외 목록은 현재 2차 MVP를 제한하지 않습니다. 범위·보안·데이터 정책 결정이 필요한 작업은 `docs/ISSUE_LOG.md`에 함께 기록합니다.

## Transition — 먼저 완료

- [x] v1.1 변경 파일 최종 검토
- [x] 사용자의 승인 후 논리적 단위로 commit
- [x] 원격 branch push와 Draft PR #27
- [x] 팀 리뷰와 main merge
- [ ] 승인된 v1.1 기준 commit에 release tag 생성 여부 결정
- [ ] 2차 MVP Track별 브랜치를 최신 main에서 생성

## Track A — 인증·데이터·AI 고도화

담당: 다른 팀원

### High

- [ ] Supabase project / 환경 변수 / 개발·배포 환경 정책 확정
- [ ] 이메일 또는 이에 준하는 아이디 + 비밀번호 로그인·회원가입·로그아웃·세션 복구 구현
- [ ] Google OAuth provider, callback URL, 로그인 후 redirect 구현
- [ ] 보호 라우트와 로그인 후 원래 화면 복귀 구현
- [ ] 사용자별 DB schema와 RLS 정책 설계·검증
- [ ] Experience / TrackedActivity / DailyLog / SynthesisDraft / Analysis / Recommendation 관계 정의
- [ ] 합성 초안 RLS·보존·완료 Experience 멱등 저장 contract 구현 (`ISSUE-029`)
- [ ] repository 경계를 두고 localStorage와 DB 접근 분리
- [ ] localStorage → 계정 데이터 마이그레이션 정책 결정 (`ISSUE-025`)
- [ ] 공개 AI API 인증, rate limit, OpenAI spend limit / alert 적용 (`ISSUE-024`)

### Medium

- [ ] 기존 v1.1 데이터 read 호환과 migration 멱등성 구현
- [ ] 사용자 생성 데이터 판별과 샘플·fixture·파싱 실패 항목 제외 contract 구현
- [ ] migration 부분 실패 / 재시도 / 원본 보존 구현
- [ ] AI 분석 결과 schema와 근거 표시 고도화
- [ ] AI 추천 정확도 평가 기준과 회귀 사례 정의
- [ ] AI 추천 이유·활용 방향·근거 일치 강화
- [ ] JD / 직무 요구사항 / 우대사항 원문 입력 구조화와 경험 매칭 contract 정의
- [ ] 질문 이미지 OCR / vision 입력의 일회성 처리와 개인정보·비용 정책 정의
- [ ] 추천 경험 기반 답변 초안 생성 schema와 저장 여부 결정
- [ ] 보유 경험과 부족 경험 비교 기준 정의
- [ ] AI model / prompt version 기록 여부 결정
- [ ] 서버 오류 code와 사용자용 message 계약 정리

### Decision required

- [ ] 이메일 인증 포함 여부
- [ ] 비밀번호 재설정 범위
- [ ] Google OAuth provider 설정값과 배포 callback URL
- [ ] Supabase 비밀번호 validation과 계정 열거 방지 오류 문구 정책
- [ ] Supabase Storage를 사용할 실제 기능. OCR용 이미지는 우선 원본 저장 없이 처리
- [ ] 여러 추천 후보와 비교 기능 범위

## Track B — 디자인·사용자 경험 고도화

담당: 사용자

### High

- [ ] 검정·차콜 디자인 token과 공통 컴포넌트 상태 정리
- [ ] Track A 인증 contract 기반 로그인 / 회원가입 route UI와 `components/auth/**` 설계
- [ ] 인증 확인 중 / 세션 만료 / 접근 불가 상태 설계
- [ ] localStorage 데이터 이전 안내와 진행·부분 실패·완료 UX 설계
- [ ] 오늘의 기록 핵심 작성 흐름 사용성 검토
- [ ] 나의 활동 목록·상세 탐색 흐름 개선
- [ ] CampusLog AI 입력·결과·추천 기록 위계 개선

### Medium

- [ ] Button / Input / Textarea / Badge / Tabs / Dialog / Alert 상태 통일
- [ ] 모바일 상단 내비게이션과 safe area 재검증
- [ ] loading / empty / error / success / reconnecting 상태 통일
- [ ] 키보드 focus 이동과 Dialog 초점 복귀 검증
- [ ] 200% 확대와 긴 한글·URL 줄바꿈 검증
- [ ] reduced motion과 애니메이션 fallback 검증
- [ ] AI 원본·생성 결과·근거의 시각적 구분 개선

## Shared integration

- [ ] 인증 상태 contract를 UI와 공유
- [ ] repository / API loading·error contract를 UI와 공유
- [ ] AI 제한 초과 오류 code, `retryAfter`, 입력 보존과 재시도 contract 공유
- [ ] schema 또는 API response 변경 시 관련 화면 명세 동시 수정
- [ ] Track 간 공통 파일 담당과 merge 순서 합의
- [ ] 데스크톱·모바일 핵심 E2E 시나리오 작성
- [ ] 다른 사용자 데이터 접근 방지 테스트
- [ ] Vercel + Supabase preview 환경 통합 확인

## Existing open risks

- [ ] malformed localStorage JSON과 빈 상태 구분 (`ISSUE-013`)
- [ ] WebGL 표지 실패 fallback (`ISSUE-017`)
- [ ] 관련 링크 실제 저장·새로고침 유지 수동 검증 (`ISSUE-021`)
- [ ] AI API 비용과 호출 빈도 제한 (`ISSUE-024`)

## v1.1 Done summary

- [x] 과거 활동 경험 CRUD
- [x] 활동 추가와 planned / active / completed 흐름
- [x] 날짜별 실제 한 일 작성·수정·삭제
- [x] 월간 캘린더와 기록 개수
- [x] 활동 종료 → AI 사실 기반 초안 → 완료 경험 저장
- [x] 나의 활동에서 완료 경험과 진행 활동 통합
- [x] AI 경험 분석
- [x] CampusLog AI 기반 활동 추천과 추천 기록
- [x] 검정·차콜 공통 앱 셸과 반응형 UI
- [x] lint / typecheck / production build / 브라우저 검증
