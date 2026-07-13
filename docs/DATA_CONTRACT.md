# CampusLog Data Contract

## 상태

- 적용 상태: `main`에 반영된 PR #30
- 범위: 사용자별 Supabase Postgres schema, RLS, localStorage 모델 매핑, repository 경계, 주요 UI의 Supabase repository 전환, localStorage 자동 이전·자동 삭제 금지 정책
- 기준: v1.1 UI/UX와 기존 도메인 타입을 유지하고, DB 전환은 작은 PR로 단계적으로 진행
- 제외: JD 원문, OCR, 부족 경험 비교, 답변 초안 등 AI 고도화는 이번 작업에서 시작하지 않음

## 현재 localStorage 모델

| 도메인 | storage key | 형태 | 주요 관계 |
| --- | --- | --- | --- |
| `Experience` | `campuslog:v2:experiences` | `Experience[]` | 완료 경험. `id`는 분석, 추천, 활동 종료 결과에서 참조 |
| legacy `Experience` | `campuslog:v1:experiences` | `Experience[]` | v2 key가 없고 migration marker가 없을 때만 v2로 복사 |
| `ExperienceAnalysis` | `campuslog:v1:analyses` | `Record<experienceId, ExperienceAnalysis>` | `experienceId`로 `Experience.id` 참조. 경험 1개당 최신 분석 1개 |
| `Recommendation` | `campuslog:v1:recommendations` | `RecommendationResult[]` | `recommendedExperienceId`로 `Experience.id` 참조 |
| `TrackedActivity` | `campuslog:v1:tracked-activities` | `TrackedActivity[]` | 진행 활동. 완료 저장 후 `generatedExperienceId`로 `Experience.id` 참조 |
| `DailyLog` | `campuslog:v1:daily-logs` | `DailyLog[]` | `activityId`로 `TrackedActivity.id` 참조 |
| `SynthesisDraft` | `campuslog:v1:synthesis-drafts` | `Record<activityId, ExperienceSynthesisDraft>` | 활동별 합성 초안 1개. `usedLogIds`로 사용된 `DailyLog.id` 목록 보존 |

현재 UI는 `web/src/lib/repositories/campuslogRepository.ts`의 async repository 계약을 통해 데이터를 읽고 씁니다. Supabase 환경 변수가 설정된 로그인 세션에서는 Supabase repository를 사용하고, localStorage adapter는 설정 누락 fallback과 미래의 선택적 이전 가능성을 위해 보존합니다. localStorage 데이터는 로그인 계정의 기본 데이터로 자동 표시하지 않습니다.

## Supabase 테이블 계약

Migration: `supabase/migrations/20260713000100_user_data_schema.sql`

| 테이블 | 기존 타입 | 소유권 | PK / 멱등성 | 주요 관계 |
| --- | --- | --- | --- | --- |
| `experiences` | `Experience` | `user_id uuid default auth.uid()` | `(user_id, id)` | `id`는 기존 localStorage id를 그대로 보존 |
| `tracked_activities` | `TrackedActivity` | `user_id` | `(user_id, id)` | `generated_experience_id`로 `experiences.id` 참조. 사용자별 unique partial index로 같은 완료 경험 중복 연결 방지 |
| `daily_logs` | `DailyLog` | `user_id` | `(user_id, id)` | `(user_id, activity_id)`가 `tracked_activities`를 참조하고 활동 삭제 시 cascade |
| `experience_synthesis_drafts` | `ExperienceSynthesisDraft` | `user_id` | `(user_id, activity_id)` | 활동별 초안 1개만 upsert. 활동 삭제 시 cascade |
| `experience_analyses` | `ExperienceAnalysis` | `user_id` | `(user_id, id)`, unique `(user_id, experience_id)` | 경험별 최신 분석 1개를 upsert |
| `recommendations` | `RecommendationResult` | `user_id` | `(user_id, id)` | 추천 경험 삭제 시 추천 기록 cascade |
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
- SQL-level 또는 자동화된 select / insert / update / delete RLS 정책 검증은 아직 별도 hardening 작업으로 남아 있습니다.
