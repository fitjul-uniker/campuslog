# CampusLog AI API Contract

## 상태

- 브랜치: `feature/ai-answer-drafts`
- 범위: `/api/analyze` AI 경험 분석 v2 schema 유지, `/api/recommend` 추천 v2 schema / prompt / Top 3 매칭 / 저장 호환성, `/api/answer-drafts` 답변 초안 v1 schema / prompt / 저장 호환성, `/api/synthesize-activity` 보호 foundation 유지
- 제외: 기록 보완 루프, OCR

## 후속 AI 고도화 순서

현재 문서는 AI API 보호 foundation, AI 경험 분석 v2, 추천 v2, 답변 초안 v1의 계약입니다. 후속 AI 결과 구조 고도화는 아래 순서로 별도 작은 PR에서 진행합니다.

1. AI 경험 분석 v2 — 구현 완료
   - STAR, 원본 근거, 부족한 정보, 자소서 소재 각도 추가
   - 기존 분석 결과와 새 분석 결과를 `schemaVersion`으로 구분
2. 추천 v2 — 구현 완료
   - 자기소개서 문항 / JD 요구사항 추출
   - 경험 Top 3 매칭, 부족 근거, 과장 위험 표시
3. 답변 초안 생성 — 구현 완료
   - 사용자가 선택한 500자 / 800자 / 1000자 자기소개서, 면접 답변, 포트폴리오 설명 중 1개 버전
   - 기록에 없는 사실은 생성하지 않고 부족 근거를 `missingEvidenceNotes` 또는 `cautions`로 분리
4. 기록 보완 루프
   - AI 보완 질문, 사용자 답변 저장 위치, 분석 재생성 contract 결정
5. OCR / JD 이미지 입력
   - 텍스트 붙여넣기 흐름 안정화 후 Optional
   - 원본 이미지 저장 없이 일회성 입력을 기본값으로 검토

## 보호 순서

AI API Route는 모두 아래 순서로 요청을 처리합니다.

1. Supabase 서버 세션 확인
2. 사용자별 runtime-local rate guard 확인
3. `Content-Length` 기반 요청 크기 상한 확인
4. route별 입력 schema / 필드 길이 검증
5. 서버 환경의 `OPENAI_API_KEY` 확인
6. timeout이 걸린 OpenAI Responses API 호출
7. 구조화된 응답 검증 후 `ok: true` 반환

`service_role` key는 사용하지 않습니다. 세션 확인은 Supabase anon key와 request cookie 기반 `auth.getUser()`로만 수행합니다.

## 공통 오류 응답

비로그인 요청은 모든 AI API에서 같은 401 JSON contract를 사용합니다.

```json
{
  "ok": false,
  "error": {
    "code": "SESSION_REQUIRED",
    "message": "로그인이 필요한 화면입니다."
  }
}
```

오류 응답은 항상 `ok: false`입니다. 제한 초과처럼 재시도 시점을 안내할 수 있는 오류는 `Retry-After` header와 `error.retryAfter` 초 단위를 함께 반환합니다.

| code | HTTP | 의미 |
| --- | --- | --- |
| `CONFIGURATION_MISSING` | 503 | Supabase 공개 환경 변수 누락 |
| `SESSION_REQUIRED` | 401 | 로그인 세션 없음 또는 만료 |
| `BAD_REQUEST` | 400 | 요청 JSON 또는 필드 형식 오류 |
| `INSUFFICIENT_INPUT` | 422 | AI가 처리할 최소 근거 부족 |
| `PAYLOAD_TOO_LARGE` | 413 | 요청 본문 상한 초과 |
| `RATE_LIMITED` | 429 | 사용자별 route 호출 제한 초과 |
| `MISSING_API_KEY` | 500 | 서버 `OPENAI_API_KEY` 누락 |
| `OPENAI_API_ERROR` | 502 / 504 | OpenAI 오류, invalid output, timeout |
| `UNKNOWN_ERROR` | 500 | 예상하지 못한 서버 오류 |

## 현재 상한

| Route | 본문 상한 | OpenAI timeout | runtime-local rate guard | 주요 입력 상한 |
| --- | ---: | ---: | ---: | --- |
| `/api/analyze` | 32 KB | 45초 | 사용자당 10분 20회 | 설명 8,000자, 성과 4,000자, 관련 링크 10개 |
| `/api/recommend` | 96 KB | 60초 | 사용자당 10분 12회 | prompt 4,000자, 경험 50개, 분석 50개 |
| `/api/answer-drafts` | 96 KB | 70초 | 사용자당 10분 10회 | draftType 1개, 추천 1개, 선택 match 1개, 경험 1개, 분석 1개 |
| `/api/synthesize-activity` | 512 KB | 50초 | 사용자당 10분 8회 | 일일 기록 1,000개, 기록당 2,000자, 총 400,000자 |

`Content-Length`가 없는 요청은 본문 크기 guard를 통과할 수 있으므로 route별 필드 상한을 함께 적용합니다.

## `/api/analyze` v2 응답 계약

`/api/analyze`는 OpenAI Responses API structured output의 schema name `campuslog_experience_analysis_v2`를 사용합니다. 서버는 응답을 다시 파싱하며, `evidence.quote`, `coverLetterAngles.supportingEvidence`, `competencyEvidence.evidence`가 입력 필드의 원본 문구에 근거하지 않으면 저장 결과에서 제외합니다.

성공 응답은 기존 네 필드와 v2 필드를 함께 반환합니다.

```json
{
  "ok": true,
  "analysis": {
    "experienceId": "experience-id",
    "schemaVersion": "v2",
    "promptVersion": "analysis-v2.0",
    "model": "gpt-4.1-mini",
    "summary": "2~3문장 요약",
    "competencyTags": ["문제 해결력"],
    "achievements": ["원본에서 확인된 성과"],
    "keywords": ["키워드"],
    "star": {
      "situation": "상황",
      "task": "과제",
      "action": "행동",
      "result": "결과"
    },
    "evidence": [
      {
        "source": "description",
        "quote": "원본 문구",
        "note": "분석과 연결되는 이유"
      }
    ],
    "evidenceGaps": [
      {
        "topic": "성과 수치",
        "reason": "현재 기록에 정량 결과가 없음",
        "question": "결과를 숫자나 비교 기준으로 설명할 수 있나요?"
      }
    ],
    "coverLetterAngles": [
      {
        "title": "문제 해결 경험",
        "angle": "지원서에서 풀어낼 관점",
        "supportingEvidence": ["원본 문구"],
        "caution": "없는 수치를 추가하지 않기"
      }
    ],
    "competencyEvidence": [
      {
        "competency": "문제 해결력",
        "evidence": ["원본 문구"],
        "explanation": "역량과 연결되는 이유"
      }
    ]
  }
}
```

하위 호환:

- 기존 `summary`, `competencyTags`, `achievements`, `keywords`는 계속 반환하고 저장합니다.
- 기존 저장 결과는 `schemaVersion: "v1"`로 보정해 읽으며 v2 전용 배열은 빈 값으로 표시합니다.
- STAR에서 확인되지 않는 항목은 빈 문자열로 두고, 억지로 채우지 않습니다.
- 원본에 없는 성과, 수치, 역할, 협업 여부, 리더십은 사실처럼 생성하지 않고 `evidenceGaps` 또는 `caution`으로 분리합니다.

## `/api/recommend` v2 응답 계약

`/api/recommend`는 OpenAI Responses API structured output의 schema name `campuslog_experience_recommendation_v2`를 사용합니다. 서버는 응답을 다시 파싱하며, `matches[].experienceId`가 입력으로 받은 경험에 없으면 제외하고, `experienceTitle`은 서버가 가진 실제 경험 제목으로 덮어씁니다.

성공 응답은 v2 필드와 기존 v1 필드를 함께 반환합니다.

```json
{
  "ok": true,
  "recommendation": {
    "schemaVersion": "v2",
    "promptVersion": "recommendation-v2.0",
    "model": "gpt-4.1-mini",
    "extractedRequirements": {
      "requiredCompetencies": ["문제 해결력"],
      "preferredCompetencies": ["협업 경험"],
      "keywords": ["백오피스", "자동화"],
      "intent": "문제 상황을 구조화하고 실행으로 개선한 경험을 증명",
      "constraints": ["자기소개서 문항"]
    },
    "matches": [
      {
        "experienceId": "experience-id",
        "experienceTitle": "활동 제목",
        "rank": 1,
        "score": 88,
        "fitLevel": "high",
        "matchReason": "요구 역량과 원본 근거가 연결되는 이유",
        "matchedEvidence": ["원본 또는 분석 v2에서 확인되는 근거"],
        "missingEvidence": ["보완하면 좋은 부족 근거"],
        "overclaimRisks": ["기록에 없는 수치나 역할을 추가하지 않기"],
        "suggestedAngle": "지원서에서 풀어낼 관점",
        "relatedCompetencies": ["문제 해결력"]
      }
    ],
    "recommendedExperienceId": "experience-id",
    "recommendedExperienceTitle": "활동 제목",
    "reason": "1순위 추천 이유",
    "relatedTags": ["문제 해결력"],
    "highlightedAchievement": "1순위에서 강조할 근거",
    "usageDirection": "1순위 활용 방향",
    "draftSentence": "짧은 참고 문장"
  }
}
```

하위 호환:

- 기존 v1 필드 `recommendedExperienceId`, `recommendedExperienceTitle`, `reason`, `relatedTags`, `highlightedAchievement`, `usageDirection`, `draftSentence`는 계속 반환하고 저장합니다.
- 기존 저장 결과는 `schemaVersion: "v1"`로 보정해 읽으며 `matches`는 1순위 1개로 변환합니다.
- `draftSentence`는 하위 호환용 짧은 참고 문장만 유지합니다. 긴 답변 초안은 `/api/answer-drafts` v1에서 별도로 생성하고 저장합니다.
- 분석 v2가 있으면 STAR, 원본 evidence, evidenceGaps, coverLetterAngles, competencyEvidence를 우선 사용합니다. 분석이 없거나 오래되었으면 원본 경험 내용을 fallback으로 사용합니다.
- 근거가 약한 내용은 `missingEvidence`, 기록 밖으로 과장하기 쉬운 내용은 `overclaimRisks`로 분리합니다.
- 원본에 없는 성과, 수치, 역할, 협업 규모, 사용 기술은 사실처럼 생성하지 않습니다.

## `/api/answer-drafts` v1 응답 계약

`/api/answer-drafts`는 OpenAI Responses API structured output의 schema name `campuslog_answer_drafts_v1`를 사용합니다. 입력은 `draftType`, 저장된 `RecommendationResult`, 사용자가 선택한 `RecommendationMatch`, 해당 `Experience`, 선택 경험의 `ExperienceAnalysis | null`입니다. 서버는 추천 id / 선택 경험 id / match rank가 서로 맞지 않으면 거부합니다.

서버는 추천에 사용된 원 질문 / 문항 / JD / 면접 질문인 `recommendation.prompt`를 초안이 직접 답해야 하는 대상으로 전달합니다. 면접 답변이면 해당 면접 질문을 기준으로, 자기소개서 분량이면 해당 문항과 추출 요구사항을 기준으로 작성합니다. experience 원본, 추천 match 근거, 분석 v2 근거로 `evidenceOptions`를 만들고, 모델이 반환한 `usedEvidence` 중 해당 option과 매칭되는 값만 저장합니다. 원본에 없는 성과, 수치, 역할, 협업 규모, 기술명은 본문에 사실처럼 넣지 않고 부족 근거 또는 과장 주의점으로 분리합니다.

성공 응답은 사용자가 선택한 초안 1종과 생성 메타데이터를 함께 반환합니다. 저장소는 같은 추천 / 경험 조합에서 이미 생성된 다른 버전을 보존하고, 새로 생성한 type만 교체합니다.

```json
{
  "ok": true,
  "answerDrafts": {
    "schemaVersion": "v1",
    "promptVersion": "answer-drafts-v1.0",
    "model": "gpt-4.1-mini",
    "recommendationId": "recommendation-id",
    "experienceId": "experience-id",
    "sourceMatchRank": 1,
    "drafts": [
      {
        "type": "cover_letter_500",
        "title": "500자 자기소개서 초안",
        "content": "사용자가 수정할 사실 기반 초안",
        "targetGuide": "430~500자 자기소개서 초안",
        "usedEvidence": ["원본 설명: 실제 기록 문구"],
        "missingEvidenceNotes": ["정량 성과가 없어 본문에 수치로 쓰지 않음"],
        "cautions": ["기록에 없는 협업 규모를 추가하지 않기"]
      }
    ],
    "generatedAt": "2026-07-14T00:00:00.000Z"
  }
}
```

요청 가능한 `draftType`은 아래 5개입니다. API 응답의 `drafts` 배열에는 요청한 type 1개만 들어갑니다.

| type | targetGuide |
| --- | --- |
| `cover_letter_500` | 430~500자 자기소개서 초안 |
| `cover_letter_800` | 700~800자 자기소개서 초안 |
| `cover_letter_1000` | 900~1000자 자기소개서 초안 |
| `interview` | 45~60초 말하기용 면접 답변 |
| `portfolio` | 프로젝트/활동 설명용 포트폴리오 문단 |

하위 호환:

- 추천 v1/v2 저장 row는 수정하지 않고, 초안은 별도 `answer_drafts` 저장소에 `(recommendationId, experienceId)` 기준으로 연결합니다.
- 같은 추천 / 경험에서 여러 type을 순차 생성하면 저장소의 `drafts` 배열에 생성된 버전들이 누적됩니다.
- 추천 v1 기록도 정규화된 1개 match와 원본 경험이 있으면 초안 생성 대상이 될 수 있습니다. 원본 경험이 삭제된 경우 생성 버튼 대신 기존 추천 기록 화면만 유지합니다.
- 분석 v2가 있으면 STAR, evidence, evidenceGaps, coverLetterAngles, competencyEvidence를 우선 활용하고, 없으면 원본 experience 필드와 추천 match 근거를 사용합니다.
- 기록 보완 질문과 사용자 답변 저장은 `ISSUE-044`의 후속 보완 루프 범위로 남깁니다.

## 남은 운영 방어

- 현재 rate guard는 단일 Next.js runtime 안에서만 동작합니다. Vercel 다중 인스턴스와 재시작을 견디는 durable rate limit은 Supabase table / RPC 또는 별도 rate limit store로 후속 구현합니다.
- 중복 요청 방지는 UI disabled 상태와 저장 repository의 일부 멱등성에 의존합니다. AI route 자체의 durable idempotency key, in-flight duplicate guard, `DUPLICATE_REQUEST` contract는 후속 결정이 필요합니다.
- OpenAI project spend limit과 alert는 코드가 아니라 OpenAI project 설정 / 운영 알림으로 적용하고, 설정 완료 여부를 별도 운영 체크리스트에 기록합니다.
- 사용자 소유 데이터 검증은 현재 세션 확인과 클라이언트가 보낸 payload 검증 단계까지입니다. 서버가 DB에서 직접 경험 / 활동을 읽어 AI에 전달하는 구조로 바꾸면 route에서 소유권을 더 강하게 재검증할 수 있습니다.
