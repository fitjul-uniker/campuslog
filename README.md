# CampusLog

> AI가 대학생의 활동 경험을 분석하고, 필요한 순간 가장 적합한 경험을 추천해주는 성장 기록 서비스

## Overview

CampusLog는 대학생이 프로젝트, 공모전, 인턴 등 다양한 활동 경험을 잊지 않게 기록하고, AI가 역량과 성과를 정리해 자기소개서·포트폴리오·면접 준비에 바로 활용할 수 있게 돕는 성장 기록 서비스입니다.

1차 MVP와 v1.1 제품 고도화는 완료되었습니다. 현재 저장소의 제품 기준선은 캘린더 기반 진행 활동 기록, 완료 경험 관리, AI 경험 분석, `CampusLog AI` 활동 추천을 포함한 v1.1입니다. **현재 활성 계획 단계는 2차 MVP**이며, v1.1 변경은 main에 반영되었습니다. 이후 최신 main에서 별도 기능 브랜치를 만들어 사용자 계정·DB 기반 전환과 AI 품질 고도화, 디자인·사용자 경험 고도화를 병행합니다.

## Current Status

### v1.1 baseline — 완료

- 과거 활동 경험 등록·조회·수정·삭제
- 현재·미래 활동의 간단 등록과 진행 상태 관리
- 캘린더에서 활동 태그와 함께 날짜별로 한 일 기록
- 활동 종료 시 연결된 기록만 이용한 AI 완료 경험 합성
- `나의 활동`에서 완료 경험과 진행 활동 통합 확인
- 경험별 AI 요약·역량·성과·키워드 분석
- `CampusLog AI`의 `AI 기반 활동 추천`과 `추천 기록`
- Browser localStorage 기반 저장

### 2차 MVP — 현재 활성 계획

2차 MVP는 v1.1 사용자 흐름을 보존하면서 외부 사용자가 계정을 만들고 자신의 기록을 안전하게 이어서 사용할 수 있는 제품으로 확장합니다.

#### Track A: 계정·데이터·AI

다른 팀원이 주로 담당합니다.

- 이메일 또는 이에 준하는 아이디 + 비밀번호 로그인·회원가입·로그아웃과 인증 세션
- Google OAuth 로그인
- Supabase Auth
- Supabase Postgres 기반 사용자별 데이터 저장
- 필요한 첨부 기능이 확정된 경우의 Supabase Storage
- AI 경험 분석·활동 추천의 품질과 안정성 고도화
- AI 경험 분석 v2: STAR, 원본 근거, 부족 정보, 자소서 소재 각도
- 추천 v2: JD 원문·직무 요구사항·우대사항 기반 경험 Top 3 추천, 부족 경험 비교
- 답변 초안 생성: 300자 / 700자 / 면접 / 포트폴리오 버전
- 기록 보완 루프와 후순위 질문 이미지 OCR / vision 입력
- 기존 완료 경험 합성의 인증·DB 전환 호환성과 사실성 유지
- 데이터 소유권, Row Level Security, 마이그레이션과 오류 복구

#### Track B: 디자인·사용자 경험

사용자(제품 오너)가 주로 담당합니다.

- 최신 CampusLog 브랜드와 디자인 시스템 정교화
- 온보딩과 핵심 사용자 동선 개선
- 로딩·빈 상태·오류·성공 상태의 일관된 UX
- 모바일·데스크톱 반응형과 접근성 개선
- 인증·DB·AI 처리 상태를 이해하기 쉬운 피드백 설계

두 Track은 별도 브랜치와 작은 PR로 진행합니다. 데이터 타입, API 계약, 공통 컴포넌트처럼 양쪽에 영향을 주는 변경은 구현 전에 공유하고 함께 검토합니다.

## Core Features

### 활동 경험 기록

이미 끝난 프로젝트, 공모전, 인턴, 대외활동은 제목, 기간, 역할, 내용, 성과, 관련 링크를 중심으로 기록합니다.

### 진행형 활동 기록과 완료 경험 합성

현재 또는 미래 활동은 제목, 간단한 내용, 시작일, 예상 종료일 또는 미정만 먼저 등록할 수 있습니다. 사용자는 캘린더에서 오늘 또는 과거 날짜에 실제로 한 일을 활동과 연결해 쌓고, 활동 종료 시 AI가 해당 기록만 사실 기반으로 정리한 초안을 검토한 뒤 완료 경험으로 저장합니다.

### AI 경험 분석

저장된 특정 활동 경험을 AI가 요약하고, 핵심 역량 태그, 주요 성과, 활용 가능한 키워드로 정리합니다.

2차 MVP 고도화에서는 이 결과를 STAR, 원본 근거, 부족한 정보, 자소서 소재 각도까지 확장해 실제 자기소개서·지원서 작성에 바로 재사용할 수 있게 만듭니다.

### CampusLog AI

`CampusLog AI` 안에서 `AI 기반 활동 추천`과 `추천 기록`을 전환합니다. 자기소개서 문항, 포트폴리오 작성 목적, 면접 질문 등을 입력하면 AI가 저장된 경험과 분석 결과를 참고해 적합한 활동, 추천 이유, 활용 방향을 제공합니다.

다음 개발 순서는 `AI 경험 분석 v2 → 추천 v2 → 답변 초안 생성 → 기록 보완 루프 → OCR / JD 이미지 입력`입니다. OCR은 텍스트 붙여넣기 흐름이 안정화된 뒤 원본 이미지 저장 없이 일회성 입력으로 붙입니다.

## User Flow

### 진행형 활동

```text
/dashboard 오늘의 기록
→ 활동 추가
→ 활동 태그와 함께 날짜별로 한 일 기록
→ 활동 종료
→ AI 완료 경험 초안 검토 / 수정
→ /experiences 나의 활동에 저장
```

### 과거 경험과 AI 분석

```text
/experiences 나의 활동
→ 과거 경험 등록 또는 기존 경험 선택
→ AI 분석 요청
→ 요약 / 역량 / 성과 / 키워드 확인
```

### CampusLog AI

```text
CampusLog AI
→ AI 기반 활동 추천
→ 자기소개서 / 포트폴리오 / 면접 목적 / JD 원문 / 질문 이미지 입력
→ 질문·요구사항·우대사항 추출
→ 저장된 경험과 분석 결과 기반 추천
→ 부족 경험 비교
→ 추천 이유, 활용 방향, 답변 초안 확인
→ 추천 기록 저장
```

### 2차 MVP 계정 전환

```text
`대학생활을 기록하다.` 순환 문구 첫 화면
→ 스크롤하여 회원가입 또는 로그인
→ 회원가입 방식 선택
→ 이메일은 자격 증명 입력, Google은 OAuth
→ 이름·닉네임 입력
→ 인증·프로필 저장 성공
→ 3D 책 표지 선택
→ 계정 기반 오늘의 기록
→ 다른 세션에서도 저장된 활동과 AI 결과 확인
```

기존 localStorage 기록 가져오기는 현재 기본 진입 흐름에 포함하지 않는 Deferred / Optional 기능입니다.

## 2차 MVP Scope

### 포함

- 이메일 또는 이에 준하는 아이디 + 비밀번호 회원가입·로그인·로그아웃
- Google OAuth 로그인
- 이메일·Google 가입의 이름·닉네임 온보딩
- Supabase Auth 세션과 보호된 화면
- 사용자별 활동·일일 기록·완료 경험·AI 결과 저장
- 미완료 AI 합성 초안과 합성 상태의 사용자별 저장·RLS·보존 정책
- Row Level Security와 서버 측 데이터 소유권 검증
- v1.1 localStorage 원본의 자동 이전·자동 삭제 금지 정책. 선택적 마이그레이션 UI와 upsert는 실제 보존 요구가 생길 때 별도 승인
- AI 분석·추천의 구조화된 결과, 품질, 실패 복구 개선
- JD 원문, 질문 이미지, 답변 초안까지 확장 가능한 AI 입력·출력 contract
- 기존 완료 경험 합성의 사실성·멱등성·실패 복구 회귀 검증
- 인증 전후 정보 구조, 온보딩, 상태 피드백, 반응형·접근성 고도화

### 제외

- 학교 인증
- 커뮤니티와 팀 협업
- 결제와 구독
- 관리자 페이지와 공개 프로필
- GitHub, 블로그, Notion 등 외부 서비스 자동 연동
- PDF 포트폴리오 자동 생성
- 네이티브 모바일 앱
- Spring Boot, MySQL/AWS RDS 등 개인 Backend Portfolio Edition 스택

파일 원본 저장과 Supabase Storage는 자동 포함하지 않습니다. OCR용 일회성 이미지 입력은 AI 고도화 후보에 포함하되, 수료증·활동사진·지원서 이미지 원본 저장은 사용자 가치, 개인정보, 저장 비용 정책을 확정한 뒤 별도 작업으로 승인합니다.

## Tech Stack

### 현재 v1.1

- Next.js App Router
- TypeScript
- Next.js Route Handlers (`web/src/app/api/*`)
- Browser localStorage
- OpenAI API
- lucide-react
- React Three Fiber 기반 브랜드 진입 화면
- Vercel

### 2차 MVP 목표

- Next.js Full Stack + TypeScript
- Next.js Route Handler 또는 Server Action
- Supabase Auth
- Supabase Postgres + Row Level Security
- Supabase Storage는 승인된 첨부 기능에 한해 사용
- OpenAI API 서버 측 호출
- Tailwind CSS, shadcn/ui, lucide-react 선택적 사용
- Vercel

현재 서비스의 기존 CSS 화면을 기능 변경과 무관하게 전면 마이그레이션하지 않습니다. 신규·리팩터링 UI에서도 최신 CampusLog 전역 토큰과 시각 양식을 유지합니다.

## Data Migration Principles

- v1.1 localStorage 데이터는 사용자의 기존 기록으로 취급하며 자동 삭제하지 않습니다.
- 로그인 후 사용자가 로컬 기록을 계정으로 가져올지 선택합니다.
- 같은 항목을 다시 가져와도 중복되지 않도록 안정적인 식별자와 멱등성을 보장합니다.
- 마이그레이션 완료가 검증되기 전에는 로컬 원본을 보존합니다.
- 샘플 데이터는 실제 계정 데이터로 자동 이관하지 않습니다.
- 기존 도메인 타입과 화면 계약은 어댑터 또는 단계적 전환으로 호환합니다.

## Frontend Design Direction

제품 화면은 가장 최근 구현된 CampusLog 양식을 기준으로 합니다. 흰색 SaaS 작업 공간, 검정·차콜 브랜드 토큰, Pretendard 본문, 브랜드 워드마크 서체, 넓은 여백, 부드러운 모서리, 얇은 중립 테두리와 은은한 그림자를 유지합니다.

Apple 스타일의 미니멀함은 정렬·간격·폰트 위계를 다듬는 참고 기준으로 사용합니다. 핵심 CTA와 기록·AI 결과의 가독성을 우선하며, 모바일 안정성, 키보드 접근성, 텍스트 대비, reduced motion을 함께 확인합니다.

비로그인 `/`는 좌측 상단에 `CampusLog` 워드마크를 고정 표시하고, `대학생활을 / 공모전을 / 해커톤을 / 프로젝트를 / 대회를 기록하다.` 문구를 중앙에서 순환해 보여줍니다. `대학생활`은 진한 검정·강한 굵기를 유지하고 나머지 순환 명사는 웜그레이·가벼운 굵기로 구분하되 조사 `을/를`은 항상 진한 검정·강한 굵기로 유지합니다. 명사의 실제 렌더링 폭은 부드럽게 보간하며 조사는 실제 값이 `을 ↔ 를`로 바뀔 때만 별도로 전환합니다. 작은 `일시정지 / 재생` 컨트롤로 자동 전환을 멈출 수 있습니다. 첫 화면 하단에는 `스크롤하여 로그인 또는 회원가입` 한 줄과 약한 화살표 모션만 사용하며, 작은 아래 방향 휠 입력만 해도 중앙 로그인·회원가입 카드로 이동합니다. 인증 화면에서 위로 돌아갈 때는 자동 복귀하지 않고 자연스러운 기본 스크롤로 충분히 올려야 합니다. 로그인 mode는 `Welcome back`과 제목 아래 소개 문구를 생략합니다. 회원가입은 이메일·Google 방식 선택으로 시작하고, 이메일만 자격 증명을 입력한 뒤 두 방식 모두 이름 → 닉네임 Stepper를 완료합니다. reduced motion에서는 첫 문구 고정·자동 전환 컨트롤 비활성화·화살표 모션 정지·즉시 아래 방향 섹션 이동과 즉시 Stepper 전환을 사용합니다. 인증과 프로필 저장 성공 후 같은 `/`에서 React Three Fiber 기반 인터랙티브 3D 노트 표지를 보여주며, 노트를 선택하면 `/dashboard`의 오늘 기록으로 이동합니다. 활동 전체는 `/experiences`에서 확인합니다.

## Security, Privacy, and Cost

- API Key, 토큰, 비밀번호, Supabase 서비스 역할 키를 코드나 클라이언트에 넣지 않습니다.
- `.env`와 실제 사용자 데이터는 Git에 커밋하지 않습니다.
- OpenAI API는 서버에서만 호출하며 개발·테스트 호출 비용을 통제합니다.
- Supabase Row Level Security와 서버 측 소유권 검증을 적용합니다.
- 활동 원문과 인증 정보 등 민감한 내용을 로그에 무분별하게 남기지 않습니다.
- 데이터 마이그레이션은 백업·복구 방안과 검증 없이 실행하지 않습니다.

## Project Structure

```text
campuslog/
├── web/                   # Next.js Full Stack 앱
├── docs/
│   ├── CURRENT_PHASE.md   # 현재 활성 계획 단계와 협업 기준
│   ├── USER_FLOW.md
│   ├── IA.md
│   ├── SCREEN_SPEC.md
│   ├── DESIGN.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── GIT_WORKFLOW.md
│   ├── WORK_STATUS.md
│   ├── TASK_LOG.md
│   ├── TODO.md
│   ├── ISSUE_LOG.md
│   └── archive/
│       └── MVP_V1_1_BASELINE.md
├── README.md
├── PRD.md
└── AGENTS.md
```

## Getting Started

Next.js 앱과 `package.json`은 `web/`에 있습니다. 현재 Supabase 의존성의 실행 조건에 맞춰 Node.js 22 이상을 사용하고, 로컬 실행은 저장소 루트가 아니라 `web/`에서 진행합니다.

```bash
cd web
npm install
npm run dev
```

현재 보호 화면은 로그인 세션에 연결된 사용자별 Supabase repository를 기본으로 사용합니다. 기존 Browser localStorage 원본은 자동 이전하거나 삭제하지 않으며, 정식 계정은 계정 DB에서 새로 시작합니다. 인증 환경 없이 보호 화면 디자인만 확인할 때는 로컬 development 서버에 한해 `NEXT_PUBLIC_CAMPUSLOG_UI_PREVIEW=1`을 사용할 수 있으며, 이 모드는 localStorage repository를 사용하되 보호 API와 production 인증을 우회하지 않습니다. Vercel 배포 시 Project Settings의 Root Directory를 `web`으로 설정합니다.

## Documentation

- 현재 제품 범위와 성공 기준: `PRD.md`
- 현재 개발 단계와 작업 분담: `docs/CURRENT_PHASE.md`
- 사용자 흐름: `docs/USER_FLOW.md`
- 정보 구조: `docs/IA.md`
- 화면별 동작: `docs/SCREEN_SPEC.md`
- 최신 시각 기준: `docs/DESIGN.md`
- 2차 MVP 병렬 구현 계획: `docs/IMPLEMENTATION_PLAN.md`
- 협업과 브랜치 전략: `docs/GIT_WORKFLOW.md`

1차 MVP의 과거 제외 목록은 완료된 단계의 기록이며 2차 MVP 개발 제한으로 사용하지 않습니다. 현재 범위는 `PRD.md`, `docs/CURRENT_PHASE.md`, 사용자의 최신 명시적 요구사항을 기준으로 판단합니다.
