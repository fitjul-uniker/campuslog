# CampusLog Data Contract

## 상태

- 적용 상태: `main`에 반영된 PR #30 + AI 분석 v2.1 간소화 + 추천 v2 확장 + 답변 초안 v1 확장 + 분석 부족 정보 답변 저장 호환성
- 범위: 사용자별 Supabase Postgres schema, RLS, localStorage 모델 매핑, repository 경계, 주요 UI의 Supabase repository 전환, localStorage 자동 이전·자동 삭제 금지 정책, AI 경험 분석 v2.1 저장 호환성, 추천 v2 저장 호환성, 답변 초안 v1 저장 호환성, 분석 부족 정보 답변 저장 호환성
- 기준: v1.1 UI/UX와 기존 도메인 타입을 유지하고, DB 전환은 작은 PR로 단계적으로 진행
- 제외: OCR / 이미지 입력

## 현재 localStorage 모델

| 도메인 | storage key | 형태 | 주요 관계 |
| --- | --- | --- | --- |
| `Experience` | `campuslog:v2:experiences` | `Experience[]` | 완료 경험. `id`는 분석, 추천, 활동 종료 결과에서 참조 |
| legacy `Experience` | `campuslog:v1:experiences` | `Experience[]` | v2 key가 없고 migration marker가 없을 때만 v2로 복사 |
| `ExperienceAnalysis` | `campuslog:v1:analyses` | `Record<experienceId, ExperienceAnalysis>` | `experienceId`로 `Experience.id` 참조. 경험 1개당 최신 분석 1개. v1 결과는 v2 기본값으로 보정 |
| `Recommendation` | `campuslog:v1:recommendations` | `RecommendationResult[]` | `recommendedExperienceId`로 1순위 `Experience.id` 참조. v2 결과는 `matches` Top 3를 포함하며 v1 결과는 1개 match로 보정 |
| `AnswerDraftResult` | `campuslog:v1:answer-drafts` | `AnswerDraftResult[]` | `recommendationId`와 `experienceId`로 추천 기록과 선택 경험을 참조. 추천 row 자체를 변경하지 않고 사용자가 선택 생성한 500자 / 800자 / 1000자 + 면접 + 포트폴리오 초안을 누적 저장 |
| `ExperienceFollowup` | `campuslog:v1:experience-followups` | `ExperienceFollowup[]` | 원본 경험을 자동 수정하지 않는 별도 보완 질문 / 답변 호환 저장소. `experienceId`로 `Experience.id`를 참조하며 분석 부족 정보 답변도 함께 저장. 답변 저장만으로 `needs_reanalysis`를 강제하지 않음 |
| `TrackedActivity` | `campuslog:v1:tracked-activities` | `TrackedActivity[]` | 진행 활동. 완료 저장 후 `generatedExperienceId`로 `Experience.id` 참조 |
| `DailyLog` | `campuslog:v1:daily-logs` | `DailyLog[]` | `activityId`로 `TrackedActivity.id` 참조 |
| `SynthesisDraft` | `campuslog:v1:synthesis-drafts` | `Record<activityId, ExperienceSynthesisDraft>` | 활동별 합성 초안 1개. `usedLogIds`로 사용된 `DailyLog.id` 목록 보존 |

현재 UI는 `web/src/lib/repositories/campuslogRepository.ts`의 async repository 계약을 통해 데이터를 읽고 씁니다. Supabase 환경 변수가 설정된 로그인 세션에서는 Supabase repository를 사용하고, localStorage adapter는 설정 누락 fallback과 미래의 선택적 이전 가능성을 위해 보존합니다. localStorage 데이터는 로그인 계정의 기본 데이터로 자동 표시하지 않습니다.

## Supabase 테이블 계약

Migrations:

- `supabase/migrations/20260713000100_user_data_schema.sql`
- `supabase/migrations/20260714000100_ai_analysis_v2.sql`
- `supabase/migrations/20260714000200_ai_recommendation_v2.sql`
- `supabase/migrations/20260714000300_ai_answer_drafts.sql`
- `supabase/migrations/20260714000400_experience_followups.sql`

| 테이블 | 기존 타입 | 소유권 | PK / 멱등성 | 주요 관계 |
| --- | --- | --- | --- | --- |
| `experiences` | `Experience` | `user_id uuid default auth.uid()` | `(user_id, id)` | `id`는 기존 localStorage id를 그대로 보존 |
| `tracked_activities` | `TrackedActivity` | `user_id` | `(user_id, id)` | `generated_experience_id`로 `experiences.id` 참조. 사용자별 unique partial index로 같은 완료 경험 중복 연결 방지 |
| `daily_logs` | `DailyLog` | `user_id` | `(user_id, id)` | `(user_id, activity_id)`가 `tracked_activities`를 참조하고 활동 삭제 시 cascade |
| `experience_synthesis_drafts` | `ExperienceSynthesisDraft` | `user_id` | `(user_id, activity_id)` | 활동별 초안 1개만 upsert. 활동 삭제 시 cascade |
| `experience_analyses` | `ExperienceAnalysis` | `user_id` | `(user_id, id)`, unique `(user_id, experience_id)` | 경험별 최신 분석 1개를 upsert. v2/v2.1 분석은 `schema_version`, `prompt_version`, `model`, `star`, `evidence`, `evidence_gaps`, `cover_letter_angles`, `competency_evidence`를 함께 저장하되 신규 v2.1은 표시하지 않는 레거시 배열을 빈 값으로 저장 |
| `recommendations` | `RecommendationResult` | `user_id` | `(user_id, id)` | 1순위 추천 경험 삭제 시 추천 기록 cascade. v2 추천은 `schema_version`, `prompt_version`, `model`, `extracted_requirements`, `matches`를 함께 저장 |
| `answer_drafts` | `AnswerDraftResult` | `user_id` | `(user_id, recommendation_id, experience_id)` | 추천 기록과 선택 경험별 최신 초안 묶음 1개를 upsert. 추천 또는 경험 삭제 시 cascade. 생성된 초안 type들을 `drafts` JSONB 배열로 저장 |
| `experience_followups` | `ExperienceFollowup` | `user_id` | `(user_id, id)` | 경험별 보완 질문 / 답변을 별도 저장. 경험 삭제 시 cascade. 원본 `Experience.description` / `achievements`를 자동 수정하지 않음 |
| `local_data_migration_batches` | migration ledger | `user_id` | unique `(user_id, client_migration_id)` | 사용자 확인 기반 이전 작업 단위 |
| `local_data_migration_items` | migration ledger | `user_id` | unique `(user_id, entity_type, local_id)` | 재시도 시 동일 로컬 항목 중복 이전 방지 |

기존 id는 `uuid`로 강제 변환하지 않습니다. 브라우저가 `crypto.randomUUID()`를 지원하지 않는 환경에서는 `experience-...`, `activity-...`, `daily-log-...` 형태의 문자열 id가 생성될 수 있기 때문입니다.

## RLS 계약

- 모든 사용자 데이터 테이블은 RLS를 활성화하고 `force row level security`를 적용합니다.
- `authenticated` role만 `select / insert / update / delete` 권한을 갖습니다.
- 각 정책은 `auth.uid() = user_id` 조건으로 본인 데이터만 허용합니다.
- `insert`와 `update`에는 `with check (auth.uid() = user_id)`를 적용해 클라이언트가 다른 `user_id`를 넣는 요청을 차단합니다.
- `service_role` key는 현재 앱 코드와 브라우저 환경에서 사용하지 않습니다.
- 서버 repository가 생겨도 클라이언트 입력의 `user_id`를 신뢰하지 않고 Supabase session의 사용자로 소유권을 확인합니다.

## Repository 전환 원칙

1. 보호된 주요 화면은 `storage.ts`를 직접 호출하지 않고 `CampusLogRepository`를 사용합니다.
2. localStorage repository와 Supabase repository는 같은 도메인 타입을 반환해야 합니다.
3. Supabase repository는 `user_id`를 인자로 받지 않고 현재 Supabase session에서 결정합니다.
4. 완료 경험 저장은 activity 기준 멱등 흐름으로 처리합니다.
   - 이미 `generated_experience_id`가 있으면 기존 경험을 반환합니다.
   - 새 경험 생성, 활동 링크, 합성 상태 `saved`, 초안 정리는 한 작업으로 처리합니다.
   - 실패 시 원본 활동, daily log, draft를 보존합니다.

## AI 분석 v2.1 저장 계약

- `ExperienceAnalysis`는 기존 `summary`, `competencyTags`, `achievements`, `keywords`를 유지합니다.
- 신규 v2.1 분석은 화면과 추천에 쓰는 `summary`, `star`, `achievements`, `evidenceGaps`, `keywords`를 중심으로 저장합니다.
- `competencyTags`, `evidence`, `coverLetterAngles`, `competencyEvidence`는 타입 / DB / 기존 데이터 호환을 위해 유지하지만 신규 분석에서는 생성하지 않고 화면에도 표시하지 않습니다.
- `schemaVersion`은 기존 저장 결과를 `v1`, 새 분석 결과를 `v2`로 구분합니다.
- `promptVersion`과 `model`은 분석 결과 생성 시점의 프롬프트와 모델 추적용으로 저장합니다.
- Supabase의 v2 확장 필드는 JSONB 배열 또는 객체로 저장하며, 기존 row는 기본값으로 빈 구조를 받습니다.
- localStorage는 기존 `campuslog:v1:analyses` key를 유지하고, v1 객체를 읽을 때 v2 필드를 빈 값으로 보정합니다.
- 보완 답변은 분석의 `evidenceGaps.answer` / `updatedAt`에 저장하고, `experience_followups` / `campuslog:v1:experience-followups`에도 호환 답변으로 남깁니다. 원본 `Experience.description` / `achievements`는 자동 수정하지 않습니다.
- 분석 부족 정보 항목은 최소 `id`, `category`, `title`, `reason`, `question`, `answer`, `answeredAt` 또는 `updatedAt`을 가집니다. 기존 `topic` 기반 저장 결과는 읽을 때 `category/title`로 보정합니다.
- 답변 저장은 원본 경험과 기존 분석 요약 / STAR를 자동 갱신하지 않습니다. 원본 경험이 분석 이후 수정된 경우에만 화면에서 업데이트 필요를 표시하고, 보완 답변만 추가된 경우에는 추천 / 답변 초안 입력에 즉시 병합합니다.
- `/api/analyze` 재분석은 원본 경험과 answered followup을 함께 사용할 수 있으며, 재분석을 명시적으로 실행한 경우에만 요약 / STAR / 주요 성과가 새 답변까지 반영된 결과로 갱신됩니다.

## 추천 v2 저장 계약

- `RecommendationResult`는 기존 v1 필드 `recommendedExperienceId`, `recommendedExperienceTitle`, `reason`, `relatedTags`, `highlightedAchievement`, `usageDirection`, `draftSentence`를 유지합니다.
- `purpose`는 `cover_letter`, `portfolio`, `interview`, `jd`, `activity_application`, `other` 중 하나입니다. 기존 row는 변경하지 않고 `20260714000500_recommendation_jd_purpose.sql`에서 Supabase check constraint에 `jd`만 추가하며 실제 project 적용 전에는 JD 저장 smoke test를 완료로 간주하지 않습니다.
- v2 추천은 `schemaVersion`, `promptVersion`, `model`, `extractedRequirements`, `matches`를 추가로 저장합니다.
- `extractedRequirements`는 문항 / 면접 질문 / JD / 지원서 원문에서 추출한 필수 역량, 우대 역량, 키워드, 답변 의도, 제약 조건입니다.
- `matches`는 최대 3개 추천 경험의 `rank`, `score`, `fitLevel`, `matchReason`, `matchedEvidence`, `missingEvidence`, `overclaimRisks`, `suggestedAngle`, `relatedCompetencies`를 포함합니다.
- Supabase의 v2 확장 필드는 JSONB 객체 또는 배열로 저장하며, 기존 row는 `schema_version: "v1"`과 빈 v2 구조를 기본값으로 받습니다.
- localStorage는 기존 `campuslog:v1:recommendations` key를 유지하고, v1 객체를 읽을 때 `matches` 1개와 빈 `extractedRequirements`로 보정합니다.
- 답변 초안 본문은 추천 row를 확장하지 않고 별도 `AnswerDraftResult`로 저장합니다. 추천의 `missingEvidence` / `overclaimRisks`는 보완 루프의 source로 사용될 수 있으며, 추천 row 자체는 보완 답변으로 자동 변경하지 않습니다.
- 추천 요청 입력은 원본 경험과 분석 `summary`, `star`, `achievements`, `keywords`, `evidenceGaps.answer`를 함께 전달합니다. 보완 답변은 추천 저장 row를 자동 재작성하지 않고 새 추천 / 새 초안 생성 시점에 반영됩니다.

## 답변 초안 v1 저장 계약

- `AnswerDraftResult`는 `schemaVersion`, `promptVersion`, `model`, `recommendationId`, `experienceId`, `sourceMatchRank`, `drafts`, `generatedAt`을 저장합니다.
- `drafts`는 사용자가 선택해 생성한 `cover_letter_500`, `cover_letter_800`, `cover_letter_1000`, `interview`, `portfolio` type 초안을 포함합니다. 아직 생성하지 않은 type은 저장하지 않습니다.
- 각 draft는 `title`, `content`, `targetGuide`, `usedEvidence`, `missingEvidenceNotes`, `cautions`를 포함합니다.
- 원본 기록에 없는 성과, 수치, 역할, 협업 규모, 기술명은 `content`에 사실처럼 넣지 않고 `missingEvidenceNotes` 또는 `cautions`로 분리합니다.
- Supabase는 `answer_drafts` table에 `(user_id, recommendation_id, experience_id)` primary key로 저장하며 같은 추천 / 경험 조합은 최신 초안 묶음으로 upsert합니다. 새 type을 생성하면 기존 type은 보존하고 해당 type만 교체합니다.
- localStorage는 `campuslog:v1:answer-drafts` key를 사용하고, 기존 추천 기록 key와 분석 key를 변경하지 않습니다. localStorage도 같은 type별 merge 규칙을 적용합니다.
- 추천 v1 기록은 정규화된 1개 match와 원본 경험이 있을 때만 초안 생성 대상이 될 수 있습니다. 원본 경험이 없거나 삭제된 기록은 추천 기록 화면 자체만 유지합니다.

## 기록 보완 루프 v2.1 저장 계약

- `ExperienceFollowup`은 `schemaVersion`, `experienceId`, `source`, optional `sourceRecommendationId`, optional `sourceAnswerDraftType`, `questions`, `answers`, `status`, `generatedAt`, `updatedAt`을 저장합니다. 분석 부족 정보 답변은 `source: "analysis_gap"` followup으로 호환 저장합니다.
- `questions`는 AI가 제안한 질문이며 `id`, `question`, `reason`, `targetEvidenceType`, `caution`을 포함합니다.
- `answers`는 사용자 답변이며 `questionId`, `answer`, `createdAt`, `updatedAt`을 포함합니다.
- `status`는 `open`, `answered`, `dismissed` 중 하나입니다. 모든 질문에 답하면 `answered`, 사용자가 숨기면 `dismissed`가 됩니다.
- 보완 답변 저장은 원본 경험 필드를 자동 수정하지 않습니다.
- 보완 답변 저장만으로 기존 분석이 있던 경험을 `analysisStatus: "needs_reanalysis"`로 바꾸지 않습니다. 원본 경험이 분석 이후 수정된 경우에만 업데이트 필요 상태를 표시합니다.
- 기존 추천 / 답변 초안 row는 보완 답변으로 자동 재생성하지 않습니다. 새 추천 / 새 초안 생성 시에는 저장된 보완 답변을 즉시 입력 context에 병합합니다.
- Supabase는 `experience_followups` table에 `(user_id, id)` primary key로 저장하고 `(user_id, experience_id)`가 `experiences`를 cascade 참조합니다.
- localStorage는 `campuslog:v1:experience-followups` key를 사용하며, 경험 삭제 시 관련 followup을 함께 제거합니다.

## localStorage 처리 정책

- 정식 사용자는 계정별 Supabase DB부터 새로 시작합니다.
- localStorage → 계정 DB 이전 UI와 실제 upsert 구현은 현재 High 필수 범위가 아니며 Deferred / Optional입니다.
- localStorage 데이터는 로그인 계정의 기본 데이터로 자동 표시하지 않습니다.
- localStorage 원본은 자동 이전하거나 자동 삭제하지 않습니다.
- `local_data_migration_batches`와 `local_data_migration_items`는 향후 실제 기존 사용자 데이터 보존 요구가 생길 때 선택적으로 이전 기능을 만들기 위한 안전장치입니다.
- 미래에 이전 기능을 다시 도입한다면 다음 원칙을 유지합니다.
  - 사용자 확인 전 자동 이전 금지
  - 성공 확인 전 원본 삭제 금지
  - 기존 local id 보존
  - 부분 실패와 재시도 허용
  - 샘플·fixture·파싱 실패 항목 제외 사유 제공
  - 동일 local item의 중복 이전 방지

## 남은 검증

- 사용자가 Supabase project에 migration을 적용했고 Google 계정 A/B UI smoke test로 계정별 데이터 분리를 확인했습니다.
- 추천 v2 migration `20260714000200_ai_recommendation_v2.sql`은 Supabase project 적용 후 로그인 세션에서 추천 저장 smoke test가 필요합니다.
- 답변 초안 migration `20260714000300_ai_answer_drafts.sql`은 Supabase project 적용 후 로그인 세션에서 초안 저장 smoke test가 필요합니다.
- 기록 보완 migration `20260714000400_experience_followups.sql`은 Supabase project 적용 후 로그인 세션에서 분석 부족 정보 답변 저장, 수정, 새로고침 유지, 추천 반영 smoke test가 필요합니다.
- SQL-level 또는 자동화된 select / insert / update / delete RLS 정책 검증은 아직 별도 hardening 작업으로 남아 있습니다.
