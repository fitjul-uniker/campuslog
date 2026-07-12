# CampusLog v1.1 Baseline Archive

> 이 문서는 v1.1 완료 기준선을 보존하는 archive입니다. 현재 기능 범위와 구현 우선순위는 `docs/CURRENT_PHASE.md`와 활성 제품 문서를 따릅니다.

## 단계

- 1차 MVP: 경험 기록 → AI 분석 → AI 추천 핵심 흐름 구현
- v1.1 고도화: 진행 활동과 날짜별 기록을 핵심 흐름 앞에 추가하고 최신 CampusLog UI로 통합
- 완료 시점: 2026-07-13 작업 기준
- release tag: v1.1 merge 후 팀 확인을 거쳐 생성 예정

## 완료 기능

- 과거 활동 경험 작성, 상세, 수정, 삭제
- 활동 추가와 `planned / active / completed` 상태
- 오늘 또는 과거 날짜의 실제 한 일 작성, 수정, 삭제
- 월간 캘린더와 날짜별 기록 개수
- 활동 종료 후 연결 기록만 사용하는 AI 완료 경험 합성
- 사용자 검토 후 기존 Experience 형식으로 멱등 저장
- AI 경험 분석과 분석 결과 저장
- CampusLog AI 기반 활동 추천과 추천 기록
- `/dashboard` 오늘의 기록, `/experiences` 나의 활동
- 완료 경험과 진행 활동을 함께 보는 나의 활동 목록
- 검정·차콜·웜그레이 기반 공통 앱 셸과 CampusLog 세리프 워드마크
- 모바일·데스크톱 반응형, 키보드 focus, reduced motion 대응

## 기술 기준선

- Next.js App Router / TypeScript
- Next.js API Routes
- Browser localStorage
- OpenAI Responses API
- Vercel 배포 구조
- Pretendard 본문과 Petrona CampusLog 워드마크
- 기존 custom CSS, Tailwind CSS·shadcn/ui는 선택적 도입 가능

## v1.1 당시 제외 항목

- 로그인 / 회원가입
- 사용자 계정과 권한
- Supabase Auth / Postgres / Storage
- 사용자별 서버 데이터
- 결제, 커뮤니티, 팀 협업
- 외부 서비스 자동 동기화

이 제외 목록은 v1.1 당시 범위 기록입니다. 2차 MVP에서는 인증·DB·사용자별 저장과 AI 고도화를 명시적으로 허용합니다.

## 회귀 확인 흐름

```text
활동 추가
→ 날짜별 기록
→ 활동 종료
→ AI 완료 경험 초안
→ 나의 활동 저장
→ AI 분석
→ CampusLog AI 추천
→ 추천 기록 확인
```

2차 MVP에서도 이 흐름은 데이터 저장 위치가 localStorage에서 DB로 확장되더라도 사용자 관점에서 유지되어야 합니다.
