# CampusLog 1차 MVP 구현 계획

## 0. 문서 기준

이 문서는 `docs/DESIGN.md`의 디자인 방향을 실제 개발 작업 단위로 나누기 위한 구현 계획입니다. 실제 UI 코드, API 코드, 기존 문서는 수정하지 않고, 1차 MVP의 개발 범위와 작업 순서를 고정하는 기준으로 사용합니다.

기준 문서:

- `PRD.md`
- `README.md`
- `AGENTS.md`
- `docs/USER_FLOW.md`
- `docs/IA.md`
- `docs/SCREEN_SPEC.md`
- `docs/DESIGN.md`
- `docs/GIT_WORKFLOW.md`
- `docs/TODO.md`
- `docs/WORK_STATUS.md`
- `docs/TASK_LOG.md`
- `docs/ISSUE_LOG.md`

현재 프로젝트 구조 기준:

- 루트에는 `README.md`, `PRD.md`, `AGENTS.md`, `docs/`, `frontend/`, `backend/`가 존재합니다.
- `frontend/`에는 아직 Next.js App Router 구현 파일이 없고, `frontend/.env.local`과 `.gitkeep`만 존재합니다.
- `backend/`는 1차 MVP 구현 대상이 아니며, 1차 MVP에서는 수정하지 않습니다.
- 따라서 1차 MVP 앱은 기존 구조를 존중해 `frontend/src/...` 하위에 제안합니다.

## 1. 1차 MVP 구현 목표

CampusLog 1차 MVP는 대학생이 프로젝트, 공모전, 인턴, 대외활동 등 흩어진 활동 경험을 한곳에 기록하고, 필요할 때 AI 분석과 추천으로 다시 꺼내 쓸 수 있게 만드는 것입니다.

구현 기준:

- 대표 컨셉은 `대학생활을 단권화하는 AI 경험 기록장`입니다.
- 첫 화면은 서비스 소개 랜딩이 아니라 저장된 경험 목록이 바로 보이는 메인/경험 목록 대시보드입니다.
- 경험 원본 데이터, AI 분석 결과, AI 추천 결과는 브라우저 `localStorage`에 저장합니다.
- AI 분석과 AI 추천은 클라이언트에서 OpenAI API를 직접 호출하지 않고, Next.js API Route를 통해 처리합니다.
- 1차 MVP는 로그인, DB, Supabase 없이도 경험 기록 -> AI 분석 -> AI 추천 및 활용 흐름을 검증할 수 있어야 합니다.
- AI 추천은 저장된 경험 전체와 분석 결과를 참고해 가장 적합한 경험 1개만 추천합니다.

핵심 사용자 흐름:

```text
메인/경험 목록 대시보드
→ 활동 경험 작성
→ 활동 경험 상세
→ AI 분석 요청
→ AI 경험 분석 결과 저장
→ AI 경험 추천 및 활용
→ 추천 경험 1개와 활용 문장 확인
```

## 2. 구현 범위

1차 MVP에서 구현하는 기능은 아래로 제한합니다.

- 메인/경험 목록 대시보드
- 활동 경험 작성
- 활동 경험 상세
- 활동 경험 수정
- AI 경험 분석 결과
- AI 경험 추천 및 활용
- `localStorage` 기반 경험 CRUD
- OpenAI API 기반 AI 분석
- OpenAI API 기반 AI 추천
- 최근 수정일 / 생성일 기반 경험 메타 정보
- 미분석 / 분석 완료 / 재분석 필요 상태 표시
- 빈 상태 / 로딩 / 실패 상태 UI
- 저장된 경험 목록의 최근 수정일 기준 기본 정렬
- 분석 상태와 AI 생성 태그 / 키워드 기준 필터
- 추천 결과 `localStorage` 저장

1차 MVP에서 화면에 반영할 디자인 기준:

- 데스크톱은 미니멀 좌측 사이드바형 AppShell을 기본으로 합니다.
- 모바일은 상단 앱 바 + 세로 스크롤 중심으로 구성합니다.
- 새 경험 기록하기는 Primary CTA입니다.
- AI 경험 추천 및 활용은 보이게 유지하되 Secondary CTA입니다.
- 빈 상태에서는 첫 경험 기록하기를 우선 안내합니다.
- 카드, 입력, 배지, 버튼은 shadcn/ui로 재현 가능한 단순한 패턴을 우선합니다.
- 캠퍼스 그린 + 민트 계열 포인트를 사용하되, 정확한 hex 값은 구현 후 조정합니다.

## 3. 제외 범위

아래 항목은 1차 MVP에서 구현하지 않습니다.

- 로그인/회원가입
- DB/Supabase
- 파일 업로드
- 마이페이지
- 서비스 소개 랜딩
- 여러 추천 후보 비교
- PDF 생성
- 외부 서비스 연동
- 과한 애니메이션/3D 그래픽
- 복잡한 차트/분석 대시보드
- 사용자 이름 기반 개인화 문구
- GitHub / 블로그 / Notion 자동 연동
- Supabase Auth / Postgres / Storage
- Spring Boot 백엔드
- MySQL / AWS RDS / AWS S3
- 프로필 메뉴 / 계정 드롭다운
- 팀 / 조직 / 결제 / 업그레이드 UI

## 4. 예상 라우트 구조

Next.js App Router 기준 1차 MVP 라우트는 아래처럼 고정합니다.

| Route | 역할 |
| --- | --- |
| `/` | 메인/경험 목록 대시보드 |
| `/experiences/new` | 활동 경험 작성 |
| `/experiences/[id]` | 활동 경험 상세 |
| `/experiences/[id]/edit` | 활동 경험 수정 |
| `/experiences/[id]/analysis` | AI 경험 분석 결과 |
| `/recommend` | AI 경험 추천 및 활용 |
| `/api/analyze` | AI 경험 분석 API Route |
| `/api/recommend` | AI 경험 추천 API Route |

라우트 원칙:

- 작성 / 수정 화면에서는 AI 분석 요청을 실행하지 않습니다.
- AI 분석 요청은 활동 경험 상세 화면 또는 분석 결과 화면의 다시 분석 액션에서 실행합니다.
- AI 추천 화면은 특정 경험의 하위 화면이 아니라 독립 라우트입니다.
- 서비스 소개 랜딩, 로그인, 마이페이지 라우트는 만들지 않습니다.

## 5. Next.js App Router 기준 폴더 구조

현재 루트에 `frontend/` 폴더가 이미 있으므로, 1차 MVP의 Next.js 앱은 `frontend/` 안에 구성합니다.

```text
campuslog/
├── README.md
├── PRD.md
├── AGENTS.md
├── docs/
│   └── IMPLEMENTATION_PLAN.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── experiences/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── edit/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── analysis/
│   │   │   │           └── page.tsx
│   │   │   ├── recommend/
│   │   │   │   └── page.tsx
│   │   │   └── api/
│   │   │       ├── analyze/
│   │   │       │   └── route.ts
│   │   │       └── recommend/
│   │   │           └── route.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── experiences/
│   │   │   ├── ai/
│   │   │   └── common/
│   │   └── lib/
│   │       ├── storage.ts
│   │       ├── types.ts
│   │       ├── sampleExperiences.ts
│   │       ├── date.ts
│   │       └── utils.ts
│   ├── public/
│   ├── .env.local
│   └── package.json
└── backend/
```

구조 기준:

- `frontend/src/app`은 라우트와 페이지 단위 UI를 담당합니다.
- `frontend/src/components`는 재사용 가능한 UI 컴포넌트를 담당합니다.
- `frontend/src/lib/storage.ts`는 `localStorage` 접근과 CRUD를 담당합니다.
- `frontend/src/lib/types.ts`는 경험, 분석, 추천 타입을 담당합니다.
- `backend/`는 1차 MVP에서 사용하지 않습니다.

## 6. 필요한 컴포넌트 목록

| 컴포넌트 | 역할 | 사용 화면 | 예상 props |
| --- | --- | --- | --- |
| `AppShell` | 좌측 사이드바, 모바일 상단 앱 바, 메인 콘텐츠 영역을 감싸는 앱 레이아웃 | 전체 화면 | `children`, `activePath?` |
| `Sidebar` 또는 `Navigation` | 나의 경험, AI 추천 및 활용으로 이동하는 최소 내비게이션 | 전체 화면 | `activePath`, `items` |
| `ExperienceCard` | 경험 목록의 리스트형 카드. 제목, 기간, 역할, 상태, 태그, 최근 수정일 표시 | `/` | `experience`, `analysis?`, `onClick?` |
| `ExperienceForm` | 새 경험 작성과 기존 경험 수정 공통 폼 | `/experiences/new`, `/experiences/[id]/edit` | `initialValue?`, `mode`, `onSubmit`, `onCancel` |
| `ExperienceDetail` | 저장된 경험 원본 내용, 메타 정보, 분석 상태, 주요 액션 표시 | `/experiences/[id]` | `experience`, `analysis?`, `onAnalyze`, `onEdit`, `onDelete?` |
| `StatusBadge` | 미분석 / 분석 완료 / 재분석 필요 상태 표시 | 대시보드, 상세 | `status` |
| `EmptyState` | 경험 없음, 분석 없음, 추천 불가 등 빈 상태 안내 | `/`, 분석/추천 화면 | `title`, `description`, `primaryAction?`, `secondaryAction?`, `icon?` |
| `LoadingState` | 목록 로딩, AI 요청 중, 결과 생성 중 skeleton 표시 | 전체 화면 | `variant`, `count?`, `message?` |
| `AnalysisResult` | 경험 요약, 핵심 역량 태그, 주요 성과, 키워드, 분석 생성일 표시 | `/experiences/[id]/analysis` | `experience`, `analysis`, `onReanalyze?` |
| `RecommendationForm` | 활용 목적 선택과 질문 / 문항 입력 폼 | `/recommend` | `initialValue?`, `onSubmit`, `isLoading?` |
| `RecommendationResult` | 추천 경험 1개, 추천 이유, 성과, 활용 방향, 참고 문장 표시 | `/recommend` | `result`, `onCopy`, `onSave?` |
| `SortSelect` | 경험 목록 정렬 옵션 선택 | `/` | `value`, `onChange`, `options` |
| `FilterDropdown` | 분석 상태, 역량 태그, 키워드 기준 필터 선택 | `/` | `value`, `onChange`, `options` |

컴포넌트 구현 원칙:

- 기능 컴포넌트와 스타일 컴포넌트를 과하게 분리하지 않습니다.
- `ExperienceForm`, `storage.ts`, `types.ts`는 기능 PR에서 먼저 안정화합니다.
- 디자인 고도화 PR은 주로 `AppShell`, `ExperienceCard`, `EmptyState`, `StatusBadge`, `globals.css`를 다룹니다.

## 7. 필요한 타입 정의

`frontend/src/lib/types.ts`에 아래 타입을 정의하는 방향을 제안합니다.

```ts
export type AnalysisStatus = "unanalyzed" | "analyzed" | "needs_reanalysis";

export type RecommendationPurpose =
  | "cover_letter"
  | "portfolio"
  | "interview"
  | "activity_application"
  | "other";

export type SortOption = "updated_desc" | "created_asc" | "period_desc";

export type FilterOption =
  | "all"
  | "unanalyzed"
  | "analyzed"
  | "needs_reanalysis"
  | string;

export type Experience = {
  id: string;
  title: string;
  period: string;
  role: string;
  description: string;
  achievements: string;
  relatedLinks: string[];
  createdAt: string;
  updatedAt: string;
  analysisStatus: AnalysisStatus;
};

export type ExperienceFormInput = {
  title: string;
  period: string;
  role: string;
  description: string;
  achievements: string;
  relatedLinksText: string;
};

export type ExperienceAnalysis = {
  id: string;
  experienceId: string;
  summary: string;
  competencyTags: string[];
  achievements: string[];
  keywords: string[];
  generatedAt: string;
  sourceExperienceUpdatedAt: string;
};

export type RecommendationResult = {
  id: string;
  purpose: RecommendationPurpose;
  prompt: string;
  recommendedExperienceId: string;
  recommendedExperienceTitle: string;
  reason: string;
  relatedTags: string[];
  highlightedAchievement: string;
  usageDirection: string;
  draftSentence: string;
  generatedAt: string;
};
```

타입 설계 기준:

- 경험 제목, 기간, 역할, 내용, 성과, 관련 링크를 원본 경험에 저장합니다.
- 생성일과 수정일은 ISO string으로 저장합니다.
- 분석 상태는 경험 목록과 상세 화면에서 바로 표시할 수 있도록 `Experience.analysisStatus`에 둡니다.
- AI 생성 역량 태그와 분석 결과는 `ExperienceAnalysis`에 둡니다.
- 추천 결과는 특정 경험 1개를 참조하되, 화면 표시를 위해 추천 당시 제목도 함께 저장합니다.
- 경험 수정 시 `sourceExperienceUpdatedAt`과 현재 `experience.updatedAt`이 다르면 재분석 필요 상태로 판단할 수 있습니다.

## 8. localStorage 설계

저장 key 이름:

```ts
export const STORAGE_KEYS = {
  experiences: "campuslog:v1:experiences",
  analyses: "campuslog:v1:analyses",
  recommendations: "campuslog:v1:recommendations",
} as const;
```

경험 목록 저장 구조:

```ts
type StoredExperiences = Experience[];
```

분석 결과 저장 구조:

```ts
type StoredAnalyses = Record<string, ExperienceAnalysis>;
// key: experienceId
```

추천 결과 저장 구조:

```ts
type StoredRecommendations = RecommendationResult[];
```

필요 함수:

| 함수 | 역할 |
| --- | --- |
| `createExperience(input)` | 새 경험을 생성하고 `createdAt`, `updatedAt`, `analysisStatus: "unanalyzed"`를 부여 |
| `getExperiences()` | 저장된 경험 목록을 읽고 기본값은 최근 수정일 내림차순으로 반환 |
| `getExperienceById(id)` | 특정 경험 1개 조회 |
| `updateExperience(id, input)` | 경험을 수정하고 `updatedAt` 갱신. 기존 분석 결과가 있으면 `analysisStatus: "needs_reanalysis"`로 변경 |
| `deleteExperience(id)` | 경험 삭제. 연결된 분석 결과도 함께 삭제하는 방향을 기본값으로 검토 |
| `saveAnalysisResult(result)` | 분석 결과 저장. 해당 경험의 `analysisStatus`를 `analyzed`로 변경 |
| `getAnalysisByExperienceId(experienceId)` | 특정 경험의 분석 결과 조회 |
| `saveRecommendationResult(result)` | 추천 결과 저장 |

상태 처리 기준:

- 경험 수정 시 기존 분석 결과가 있으면 기존 분석은 삭제하지 않고 경험 상태를 `재분석 필요`로 변경합니다.
- 재분석 완료 시 `sourceExperienceUpdatedAt`을 최신 `experience.updatedAt`으로 저장합니다.
- 대시보드 기본 정렬은 최근 수정일 기준입니다.
- 생성일은 상세 화면 또는 보조 메타에서 확인할 수 있게 합니다.
- `localStorage` 데이터 파싱 실패 시 앱이 깨지지 않도록 빈 배열 / 빈 객체로 fallback합니다.
- 파싱 실패가 발생하면 화면 안에 저장소 데이터를 불러오지 못했다는 오류 상태를 표시할 수 있게 합니다.
- API 실패나 화면 이동 실패가 있어도 사용자가 입력한 폼 데이터는 가능한 유지합니다.

## 9. API Route 설계

### `/api/analyze`

역할:

- 클라이언트에서 전달한 특정 경험 데이터를 OpenAI API로 분석합니다.
- 경험 요약, 핵심 역량 태그, 주요 성과, 활용 가능한 키워드를 구조화된 JSON으로 반환합니다.
- 분석 결과 저장은 클라이언트가 응답을 받은 뒤 `localStorage`에 수행합니다.

요청 payload:

```ts
type AnalyzeRequest = {
  experience: Experience;
};
```

성공 응답 payload:

```ts
type AnalyzeResponse = {
  ok: true;
  analysis: Omit<ExperienceAnalysis, "id" | "generatedAt" | "sourceExperienceUpdatedAt">;
};
```

실패 응답 구조:

```ts
type ApiErrorResponse = {
  ok: false;
  error: {
    code: "BAD_REQUEST" | "OPENAI_API_ERROR" | "MISSING_API_KEY" | "UNKNOWN_ERROR";
    message: string;
  };
};
```

### `/api/recommend`

역할:

- 활용 목적, 질문 / 문항, 저장된 경험 전체, 저장된 분석 결과를 받아 가장 적합한 경험 1개를 추천합니다.
- 추천 이유, 관련 역량 태그, 강조할 성과, 활용 방향, 참고 문장을 구조화된 JSON으로 반환합니다.
- 추천 결과 저장은 클라이언트가 응답을 받은 뒤 `localStorage`에 수행합니다.

요청 payload:

```ts
type RecommendRequest = {
  purpose: RecommendationPurpose;
  prompt: string;
  experiences: Experience[];
  analyses: ExperienceAnalysis[];
};
```

성공 응답 payload:

```ts
type RecommendResponse = {
  ok: true;
  recommendation: Omit<RecommendationResult, "id" | "generatedAt" | "purpose" | "prompt">;
};
```

실패 응답 구조는 `/api/analyze`와 동일한 `ApiErrorResponse`를 사용합니다.

보안 기준:

- OpenAI API Key는 `frontend/.env.local`의 `OPENAI_API_KEY`를 사용합니다.
- API Key는 서버의 API Route에서만 읽고, 클라이언트 컴포넌트에 노출하지 않습니다.
- `NEXT_PUBLIC_` prefix가 붙은 환경 변수에 OpenAI API Key를 넣지 않습니다.
- API Route 응답에는 원본 API 에러 전체나 민감한 환경 정보를 포함하지 않습니다.

프론트 상태 UI 기준:

- AI 분석 요청 중에는 버튼을 disabled 처리하고 분석 결과 영역에 loading state를 표시합니다.
- AI 분석 실패 시 입력한 경험 데이터는 유지하고, 실패 안내와 다시 분석 버튼을 보여줍니다.
- AI 추천 요청 중에는 추천 요청 버튼을 disabled 처리하고 추천 결과 카드 skeleton을 표시합니다.
- AI 추천 실패 시 입력한 목적과 문항은 유지하고, 다시 추천 요청 버튼을 보여줍니다.
- 성공 시 클라이언트에서 `saveAnalysisResult` 또는 `saveRecommendationResult`를 호출해 `localStorage`에 저장합니다.

## 10. 작업 순서

### 1단계: `base-structure`

목표:

- `frontend/` 안에 Next.js App Router 기반 골격을 만듭니다.
- 라우트, AppShell, 공통 스타일, 타입 파일의 기본 구조를 준비합니다.

작업 범위:

- Next.js 초기 세팅
- `src/app` 라우트 파일 생성
- `AppShell`, `Navigation`, 기본 페이지 placeholder 생성
- 디자인 토큰 역할을 반영한 `globals.css` 기본값 준비

수정 예상 파일:

- `frontend/package.json`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/components/layout/*`
- `frontend/src/lib/types.ts`
- `frontend/src/lib/utils.ts`

완료 기준:

- `/`, `/experiences/new`, `/recommend` 등 핵심 라우트가 빈 화면이 아니라 기본 레이아웃으로 열립니다.
- 로그인 / 랜딩 / 마이페이지 라우트가 없습니다.
- 좌측 사이드바형 AppShell의 기본 구조가 잡혀 있습니다.

### 2단계: `experience-crud`

목표:

- 경험 작성, 목록, 상세, 수정, 삭제 흐름을 `localStorage` 기반으로 구현합니다.

작업 범위:

- `Experience`, `ExperienceFormInput`, `AnalysisStatus` 타입 확정
- `storage.ts` 경험 CRUD 구현
- 경험 목록 카드, 작성/수정 폼, 상세 화면 구현
- 생성일 / 수정일 / 분석 상태 표시
- 경험 수정 시 재분석 필요 상태 처리

수정 예상 파일:

- `frontend/src/lib/storage.ts`
- `frontend/src/lib/types.ts`
- `frontend/src/lib/sampleExperiences.ts`
- `frontend/src/app/page.tsx`
- `frontend/src/app/experiences/new/page.tsx`
- `frontend/src/app/experiences/[id]/page.tsx`
- `frontend/src/app/experiences/[id]/edit/page.tsx`
- `frontend/src/components/experiences/*`
- `frontend/src/components/common/StatusBadge.tsx`

완료 기준:

- 새 경험을 저장하면 상세 화면으로 이동합니다.
- 새로고침 후에도 저장된 경험이 목록에 남아 있습니다.
- 경험 수정 시 최근 수정일이 갱신됩니다.
- 기존 분석 결과가 있는 경험을 수정하면 `재분석 필요` 상태가 됩니다.
- 필수 입력값 누락 시 저장되지 않습니다.

### 3단계: `ai-analysis`

목표:

- 저장된 특정 경험을 Next.js API Route와 OpenAI API로 분석하고 결과를 저장합니다.

작업 범위:

- `/api/analyze` 구현
- 분석 결과 타입과 저장 함수 구현
- 활동 경험 상세의 AI 분석 요청 액션 구현
- AI 경험 분석 결과 화면 구현
- 분석 중 / 실패 / 재분석 필요 상태 UI 구현

수정 예상 파일:

- `frontend/src/app/api/analyze/route.ts`
- `frontend/src/app/experiences/[id]/page.tsx`
- `frontend/src/app/experiences/[id]/analysis/page.tsx`
- `frontend/src/components/ai/AnalysisResult.tsx`
- `frontend/src/lib/storage.ts`
- `frontend/src/lib/types.ts`

완료 기준:

- 상세 화면에서 AI 분석 요청을 실행할 수 있습니다.
- 분석 결과가 경험 ID에 연결되어 `localStorage`에 저장됩니다.
- 분석 완료 후 대시보드와 상세 화면에 `분석 완료` 상태가 표시됩니다.
- AI 분석 실패 시 입력 경험이 사라지지 않고 다시 시도할 수 있습니다.
- API Key는 클라이언트에 노출되지 않습니다.

### 4단계: `ai-recommendation`

목표:

- 저장된 경험 전체와 분석 결과를 기준으로 활용 목적에 맞는 경험 1개를 추천합니다.

작업 범위:

- `/api/recommend` 구현
- 추천 입력 폼 구현
- 추천 결과 화면 구현
- 복사 기능 구현
- 추천 결과 저장 함수 구현
- 경험 없음 / 입력 없음 / 추천 실패 상태 UI 구현

수정 예상 파일:

- `frontend/src/app/api/recommend/route.ts`
- `frontend/src/app/recommend/page.tsx`
- `frontend/src/components/ai/RecommendationForm.tsx`
- `frontend/src/components/ai/RecommendationResult.tsx`
- `frontend/src/lib/storage.ts`
- `frontend/src/lib/types.ts`

완료 기준:

- 저장된 경험 전체와 분석 결과를 API Route로 전달합니다.
- 추천 결과는 1개만 표시합니다.
- 추천 이유, 관련 태그, 강조 성과, 활용 방향, 참고 문장이 표시됩니다.
- 참고 문장을 복사할 수 있습니다.
- 추천 결과를 `localStorage`에 저장할 수 있습니다.

### 5단계: `dashboard-polish`

목표:

- 대시보드의 목록 탐색, 빈 상태, 분석 상태 표현을 다듬습니다.

작업 범위:

- ExperienceCard 정보 구조 정리
- EmptyState / LoadingState / 실패 Alert 정리
- StatusBadge 색상과 라벨 정리
- 정렬 / 필터 UI 기본 구현

수정 예상 파일:

- `frontend/src/app/page.tsx`
- `frontend/src/components/experiences/ExperienceCard.tsx`
- `frontend/src/components/common/EmptyState.tsx`
- `frontend/src/components/common/LoadingState.tsx`
- `frontend/src/components/common/StatusBadge.tsx`
- `frontend/src/components/common/SortSelect.tsx`
- `frontend/src/components/common/FilterDropdown.tsx`

완료 기준:

- 저장된 경험이 없을 때 첫 경험 기록하기 CTA가 가장 먼저 보입니다.
- AI 추천 CTA는 빈 상태에서도 낮은 우선순위로 접근 가능합니다.
- 정렬 / 필터가 실제 목록에 반영됩니다.
- 작동하지 않는 장식용 검색창은 없습니다.

### 6단계: `responsive/brand-polish`

목표:

- DESIGN.md의 브랜드 방향과 모바일 반응형 기준을 화면에 반영합니다.

작업 범위:

- 캠퍼스 그린 + 민트 포인트 적용
- AppShell 데스크톱 / 모바일 레이아웃 정리
- 모바일 CTA 배치 조정
- 카드 radius, spacing, hover, focus 상태 정리
- 책갈피 노트 파비콘 후보 적용 여부 검토

수정 예상 파일:

- `frontend/src/app/globals.css`
- `frontend/src/app/layout.tsx`
- `frontend/src/components/layout/*`
- `frontend/src/components/experiences/ExperienceCard.tsx`
- `frontend/src/components/common/EmptyState.tsx`
- `frontend/public/*`

완료 기준:

- 데스크톱은 좌측 사이드바형 레이아웃으로 보입니다.
- 모바일은 사이드바 없이 상단 앱 바와 세로 스크롤로 동작합니다.
- CTA와 카드 텍스트가 모바일에서 겹치지 않습니다.
- 과한 애니메이션, 3D, 랜딩 히어로가 없습니다.

### 7단계: `QA/refinement`

목표:

- 핵심 흐름을 실제 사용 시나리오 기준으로 점검하고 작은 보완 PR로 나눕니다.

작업 범위:

- 경험 생성 -> 수정 -> 분석 -> 재분석 -> 추천 흐름 QA
- 모바일 화면 QA
- 실패 상태 QA
- 폼 validation 보완
- 문서 상태 업데이트

수정 예상 파일:

- `frontend/src/app/*`
- `frontend/src/components/*`
- `frontend/src/lib/*`
- `docs/WORK_STATUS.md`
- `docs/TASK_LOG.md`
- `docs/TODO.md`
- `docs/ISSUE_LOG.md`

완료 기준:

- 1차 MVP 성공 기준을 수동 QA로 확인합니다.
- 기능 로직과 스타일 변경이 같은 PR에 섞이지 않습니다.
- 남은 이슈는 문서에 기록합니다.

## 11. 브랜치/PR 단위

작업은 아래 브랜치 단위로 나눕니다. 각 PR은 리뷰 가능한 작은 단위를 기준으로 합니다.

1. `feature/base-structure`
2. `feature/experience-crud`
3. `feature/ai-analysis`
4. `feature/ai-recommendation`
5. `design/dashboard-polish`
6. `design/responsive-polish`
7. `design/brand-visual`
8. `fix/mobile-qa`
9. `feature/sort-filter`
10. `fix/form-validation`
11. `docs/update-project-status`

권장 merge 순서:

```text
feature/base-structure
→ feature/experience-crud
→ feature/ai-analysis
→ feature/ai-recommendation
→ design/dashboard-polish
→ design/responsive-polish
→ design/brand-visual
→ fix/mobile-qa
→ feature/sort-filter
→ fix/form-validation
→ docs/update-project-status
```

단, `feature/sort-filter`는 대시보드 구현 상태에 따라 `design/dashboard-polish`보다 먼저 진행할 수 있습니다.

## 12. 각 PR의 완료 기준

### `feature/base-structure`

- 작업 목적: Next.js App Router 앱 골격과 공통 레이아웃을 준비합니다.
- 수정/생성 예상 파일: `frontend/package.json`, `frontend/src/app/*`, `frontend/src/components/layout/*`, `frontend/src/lib/types.ts`, `frontend/src/lib/utils.ts`
- 구현할 내용: 기본 라우트, AppShell, Navigation, globals.css, placeholder 페이지
- 구현하지 말아야 할 내용: 경험 CRUD, AI API 호출, 로그인, 랜딩 페이지
- 완료 기준: 핵심 라우트가 AppShell 안에서 열리고, 제외 범위 라우트가 없습니다.
- 확인 방법: 로컬 실행 후 `/`, `/experiences/new`, `/recommend` 접근 확인

### `feature/experience-crud`

- 작업 목적: 활동 경험 기록과 조회의 핵심 흐름을 완성합니다.
- 수정/생성 예상 파일: `storage.ts`, `types.ts`, `sampleExperiences.ts`, 경험 라우트 페이지, 경험 컴포넌트
- 구현할 내용: create, read, update, delete, 최근 수정일 정렬, 분석 상태 기본값
- 구현하지 말아야 할 내용: OpenAI API 호출, DB, Supabase, 파일 업로드
- 완료 기준: 새 경험 작성, 목록 확인, 상세 확인, 수정, 삭제가 새로고침 후에도 유지됩니다.
- 확인 방법: 브라우저에서 경험을 생성/수정/삭제하고 localStorage 저장 여부 확인

### `feature/ai-analysis`

- 작업 목적: 특정 경험의 AI 분석 결과를 생성하고 저장합니다.
- 수정/생성 예상 파일: `/api/analyze/route.ts`, 분석 결과 페이지, `AnalysisResult`, `storage.ts`, `types.ts`
- 구현할 내용: API Route, 분석 요청, 분석 결과 저장, 분석 완료/실패/재분석 필요 상태
- 구현하지 말아야 할 내용: 클라이언트에서 직접 OpenAI 호출, 추천 기능, 여러 후보 추천
- 완료 기준: 특정 경험의 분석 결과가 저장되고 다시 확인됩니다.
- 확인 방법: 상세 화면에서 AI 분석 요청 후 분석 결과 화면과 대시보드 상태 확인

### `feature/ai-recommendation`

- 작업 목적: 저장된 경험 전체와 분석 결과를 기준으로 경험 1개를 추천합니다.
- 수정/생성 예상 파일: `/api/recommend/route.ts`, `/recommend/page.tsx`, `RecommendationForm`, `RecommendationResult`, `storage.ts`, `types.ts`
- 구현할 내용: 추천 요청, 추천 결과 1개 표시, 참고 문장 복사, 추천 결과 저장
- 구현하지 말아야 할 내용: 2~3개 후보 비교, PDF 생성, 외부 서비스 연동
- 완료 기준: 활용 목적 입력 후 추천 경험 1개와 활용 문장이 표시됩니다.
- 확인 방법: 경험이 있는 상태와 없는 상태에서 추천 화면 동작 확인

### `design/dashboard-polish`

- 작업 목적: 대시보드 정보 구조와 상태 UI를 DESIGN.md 기준으로 정리합니다.
- 수정/생성 예상 파일: `page.tsx`, `ExperienceCard`, `EmptyState`, `LoadingState`, `StatusBadge`, `globals.css`
- 구현할 내용: 카드 정보 우선순위, 빈 상태, 로딩, 실패 Alert, CTA 위계
- 구현하지 말아야 할 내용: storage key 변경, API Route 변경, CRUD 로직 변경
- 완료 기준: 새 경험 기록하기가 Primary CTA이고 AI 추천은 Secondary CTA로 보입니다.
- 확인 방법: 경험 없음 / 경험 있음 / 분석 완료 / 재분석 필요 상태 화면 확인

### `design/responsive-polish`

- 작업 목적: 모바일과 태블릿에서 핵심 흐름이 깨지지 않게 합니다.
- 수정/생성 예상 파일: `AppShell`, `Navigation`, 페이지 레이아웃, `globals.css`
- 구현할 내용: 모바일 상단 앱 바, 세로 스크롤, CTA 배치, 카드 한 열 리스트
- 구현하지 말아야 할 내용: 기능 로직 변경, API payload 변경, localStorage 구조 변경
- 완료 기준: 모바일에서 버튼과 카드 텍스트가 겹치지 않고 주요 액션에 접근 가능합니다.
- 확인 방법: 모바일 viewport에서 대시보드, 폼, 상세, 분석, 추천 화면 확인

### `design/brand-visual`

- 작업 목적: 노트 / 단권화 컨셉과 캠퍼스 그린 + 민트 브랜드 톤을 반영합니다.
- 수정/생성 예상 파일: `globals.css`, `AppShell`, `StatusBadge`, `EmptyState`, `public/*`
- 구현할 내용: 색상 역할, focus 상태, 배지 톤, 빈 상태 아이콘, 파비콘 후보
- 구현하지 말아야 할 내용: 과한 애니메이션, 3D 그래픽, 랜딩 히어로, 기능 로직 수정
- 완료 기준: 화면이 노트형 기록장 분위기를 가지되 과하게 장식적이지 않습니다.
- 확인 방법: 대시보드와 빈 상태를 중심으로 색상, 대비, 아이콘 확인

### `fix/mobile-qa`

- 작업 목적: 모바일 QA에서 발견된 깨짐과 사용성 문제를 보완합니다.
- 수정/생성 예상 파일: 관련 페이지와 컴포넌트의 스타일 파일
- 구현할 내용: 줄바꿈, 버튼 폭, 카드 간격, 하단 액션 영역 보완
- 구현하지 말아야 할 내용: 새 기능 추가, 데이터 구조 변경
- 완료 기준: 모바일 핵심 흐름을 끝까지 진행할 수 있습니다.
- 확인 방법: 모바일 viewport에서 경험 작성 -> 상세 -> 분석 -> 추천 흐름 확인

### `feature/sort-filter`

- 작업 목적: 대시보드 목록 정렬과 필터를 실제 동작하게 합니다.
- 수정/생성 예상 파일: `page.tsx`, `SortSelect`, `FilterDropdown`, `storage.ts` 또는 목록 유틸
- 구현할 내용: 최근 수정순, 오래된 작성순, 활동 기간순, 분석 상태 필터, 태그/키워드 필터
- 구현하지 말아야 할 내용: 장식용 검색창, 복잡한 분석 대시보드
- 완료 기준: 선택한 정렬 / 필터가 경험 목록에 즉시 반영됩니다.
- 확인 방법: 여러 경험과 분석 상태를 만들어 정렬 / 필터 결과 확인

### `fix/form-validation`

- 작업 목적: 경험 작성/수정과 추천 입력의 validation을 보완합니다.
- 수정/생성 예상 파일: `ExperienceForm`, `RecommendationForm`, 관련 페이지
- 구현할 내용: 필수값 안내, 링크 형식 안내, 빈 문항 안내, 입력 유지
- 구현하지 말아야 할 내용: UI 전체 리디자인, 저장 구조 변경
- 완료 기준: 잘못된 입력은 저장/요청되지 않고 화면 안에서 이유를 알 수 있습니다.
- 확인 방법: 빈 제목, 빈 질문, 잘못된 링크 입력 테스트

### `docs/update-project-status`

- 작업 목적: 구현 진행 후 작업 기록 문서를 최신 상태로 업데이트합니다.
- 수정/생성 예상 파일: `docs/WORK_STATUS.md`, `docs/TASK_LOG.md`, `docs/TODO.md`, `docs/ISSUE_LOG.md`
- 구현할 내용: 완료 작업, 남은 작업, 발견 이슈, 검증 결과 기록
- 구현하지 말아야 할 내용: 코드 변경, 기능 범위 변경
- 완료 기준: 다음 작업자가 현재 상태와 다음 액션을 문서만 보고 이해할 수 있습니다.
- 확인 방법: 기준 문서 간 완료/미완료 항목이 모순되지 않는지 확인

## 13. 기능 개발과 디자인 고도화 충돌 방지 규칙

- 기능 개발 PR이 `main`에 먼저 들어간 뒤 디자인 고도화 PR을 올립니다.
- 디자인 고도화 작업은 `className`, layout, spacing, color, `AppShell`, `ExperienceCard`, `EmptyState`, `StatusBadge`, `globals.css` 중심으로 합니다.
- 디자인 고도화 작업에서는 `storage.ts`, `types.ts`, `app/api/*`, `localStorage` key, 저장/수정/삭제 로직, OpenAI API 호출 코드를 수정하지 않는 것을 원칙으로 합니다.
- QA/보완 작업은 핵심 구조가 안정된 뒤 작은 PR 단위로 진행합니다.
- 기능 로직과 스타일 변경이 같은 PR에 섞이지 않도록 합니다.
- `feature/experience-crud`, `feature/ai-analysis`, `feature/ai-recommendation`에서 타입이나 저장 구조가 바뀌면 디자인 PR 시작 전에 main에 먼저 반영합니다.
- 디자인 PR에서 기능 버그를 발견하면 해당 PR에서 임시 수정하지 않고 `fix/*` 브랜치로 분리합니다.

## 14. 7/9~7/16 개발 로드맵

| 일정 | 목표 | 산출물 |
| --- | --- | --- |
| 7/9 오전 | `DESIGN.md` 최종 확정 | 디자인 기준 문서 확정 |
| 7/9 오후 | `docs/IMPLEMENTATION_PLAN.md` 생성, 작업 브랜치/PR 단위 확정 | 구현 계획 문서, PR 단위 |
| 7/9~7/10 | `base-structure` 구현 후 `main` 머지 | Next.js App Router 골격, AppShell |
| 7/10~7/12 | `experience-crud` 구현, 디자인 고도화 준비 | 경험 CRUD, localStorage 저장 구조 |
| 7/12~7/14 | AI 분석 기능 구현, dashboard polish PR | `/api/analyze`, 분석 결과 화면, 대시보드 상태 UI |
| 7/14~7/16 | AI 추천 기능 구현, responsive/brand polish PR | `/api/recommend`, 추천 화면, 모바일/브랜드 보완 |
| 7/16 이후 | QA, 필터/정렬, 문구, 문서 업데이트 | QA 보완 PR, `docs/update-project-status` |

로드맵 기준:

- 7/16 전에는 핵심 흐름을 먼저 완성합니다.
- 필터/정렬은 대시보드 기본 사용성을 위해 포함하되, 복잡한 검색이나 분석 대시보드로 확장하지 않습니다.
- 디자인 고도화는 기능 구조가 main에 반영된 뒤 작은 PR로 진행합니다.

## 15. 구현 전 위험 요소

| 위험 요소 | 대응 기준 |
| --- | --- |
| `localStorage` 데이터 구조가 중간에 바뀌는 문제 | `campuslog:v1:*` key를 고정하고, 타입 변경이 필요하면 별도 마이그레이션 이슈로 기록 |
| AI 분석 결과와 경험 수정 상태가 어긋나는 문제 | `sourceExperienceUpdatedAt`을 저장하고 수정 시 `needs_reanalysis`로 변경 |
| OpenAI API Key 노출 위험 | API Route에서만 `OPENAI_API_KEY`를 읽고 클라이언트에 전달하지 않음 |
| 한 번에 너무 큰 PR을 만드는 문제 | base, CRUD, 분석, 추천, 디자인, QA를 브랜치로 분리 |
| 디자인 고도화와 기능 개발 파일 충돌 문제 | 디자인 PR은 기능 로직 파일을 수정하지 않는 원칙 적용 |
| 모바일 반응형이 후순위로 밀리는 문제 | `design/responsive-polish`와 `fix/mobile-qa`를 별도 PR로 예약 |
| 검색 기능을 장식용으로만 만드는 문제 | 1차 MVP 첫 구현에서는 검색을 만들지 않거나, 만들 경우 실제 localStorage 검색으로만 구현 |
| 빈 상태에서 AI 추천 CTA 처리 기준이 흐려지는 문제 | 첫 경험 기록하기를 우선하고, AI 추천은 낮은 우선순위 또는 비활성 안내로 처리 |
| API 실패 시 입력 데이터가 사라지는 문제 | 분석/추천 실패 상태에서도 폼 입력과 경험 원본 데이터를 유지 |
| 추천 결과 저장 우선순위가 과하게 커지는 문제 | 추천 결과 저장은 구현하되 복사 기능보다 낮은 UI 우선순위 유지 |
| `frontend/.env.local` 관리 문제 | 실제 키는 커밋하지 않고, 필요 시 `.env.local.example` 추가 여부를 별도 PR에서 결정 |

## 16. 필요한 라이브러리 후보

이번 문서 작업에서는 라이브러리를 설치하지 않습니다. 구현 전에 아래 후보를 PR 단위로 결정합니다.

| 후보 | 필요한 이유 | 비고 |
| --- | --- | --- |
| Next.js / React / TypeScript | App Router 기반 프론트엔드 구현 | `feature/base-structure`에서 결정 |
| Tailwind CSS | shadcn/ui와 DESIGN.md의 spacing/color 기준 구현 | Next.js 초기 세팅과 함께 검토 |
| shadcn/ui | Button, Card, Badge, Select, DropdownMenu, Skeleton, Alert, Dialog 패턴 구현 | 필요한 컴포넌트만 추가 |
| `lucide-react` | DESIGN.md의 권장 아이콘 사용 | 버튼/상태/내비게이션 아이콘 |
| OpenAI SDK 또는 server-side `fetch` | API Route에서 OpenAI API 호출 | dependency 최소화를 원하면 `fetch` 우선 검토 |
| `zod` | API payload와 폼 입력 검증 | 필수는 아니며 `fix/form-validation`에서 검토 |

설치 원칙:

- 새 라이브러리는 해당 PR 설명에 이유와 대안을 적은 뒤 설치합니다.
- Magic UI, Aceternity UI, Motion 계열은 1차 MVP 필수 범위가 아니므로 설치하지 않습니다.
- 로직이 단순한 경우 새 dependency보다 TypeScript 타입과 기본 검증으로 처리합니다.

## 17. 확인 필요 사항

구현 전 사람이 확인해야 할 내용은 아래와 같습니다.

- `frontend/.env.local`이 이미 존재하지만 이 문서 작업에서는 내용을 확인하지 않았습니다. AI API 작업 전 `OPENAI_API_KEY`가 안전하게 준비되어 있는지 확인해야 합니다.
- `docs/GIT_WORKFLOW.md`와 `AGENTS.md`는 작업 후 상태 기록 문서 업데이트를 권장하지만, 이번 요청은 `docs/IMPLEMENTATION_PLAN.md`만 생성하는 범위입니다. 실제 구현 후에는 `docs/update-project-status` PR에서 `WORK_STATUS`, `TASK_LOG`, `TODO`, `ISSUE_LOG` 업데이트가 필요합니다.
- 정렬 옵션의 `오래된순` 표현은 문서마다 `오래된순`과 `오래된 작성순`으로 표현됩니다. 구현에서는 `createdAt` 오름차순을 의미하는 `오래된 작성순`으로 확정할지 확인이 필요합니다.
- `deleteExperience` 실행 시 연결된 분석 결과와 추천 결과를 어떻게 처리할지 최종 확인이 필요합니다. 기본 제안은 연결된 분석 결과는 삭제하고, 과거 추천 결과는 추천 기록으로 유지하되 삭제된 경험 표시 정책을 별도로 정하는 것입니다.
- `sampleExperiences.ts`를 초기 화면에 자동 주입할지, 빈 상태 검증용 개발 데이터로만 둘지 확인이 필요합니다. PRD와 README는 샘플 데이터 사용을 언급하지만, 실제 사용자 저장소에 자동 저장할지 여부는 구현 전에 정해야 합니다.
- 책갈피 노트 파비콘을 직접 제작할지, 임시 Lucide 기반 아이콘으로 시작할지 확인이 필요합니다.
- OpenAI 응답 구조화를 OpenAI SDK로 처리할지, API Route의 server-side `fetch`로 처리할지 결정이 필요합니다.
- 추천 결과 저장은 MVP 범위에 포함되어 있지만 첫 구현에서는 복사보다 낮은 우선순위입니다. `feature/ai-recommendation` 안에서 함께 구현할지, 별도 작은 PR로 분리할지 확인이 필요합니다.

## 18. 다음에 바로 시작할 첫 개발 작업

첫 개발 작업은 `feature/base-structure`입니다.

작업 시작 전 확인:

- 현재 브랜치가 `main`이고 깨끗한 상태인지 확인합니다.
- `frontend/` 안에 Next.js App Router 프로젝트를 초기화할지, 기존 빈 폴더에 직접 파일을 구성할지 결정합니다.
- shadcn/ui와 Tailwind CSS 도입 여부를 `feature/base-structure` PR에서 함께 결정합니다.

첫 작업의 최소 완료 기준:

- `frontend/`에서 Next.js 앱이 실행됩니다.
- `/`가 메인/경험 목록 대시보드의 기본 레이아웃으로 열립니다.
- 좌측 사이드바형 AppShell이 데스크톱 기준으로 보입니다.
- `/experiences/new`, `/recommend` 라우트로 이동할 수 있습니다.
- 로그인/회원가입, 서비스 소개 랜딩, DB, Supabase, 파일 업로드 관련 구현은 없습니다.
