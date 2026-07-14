# CampusLog AI API Contract

## 상태

- 브랜치: `feature/ai-analysis-v2`
- 범위: `/api/analyze` AI 경험 분석 v2 schema, prompt, 저장 호환성, 결과 표시 / `/api/recommend`, `/api/synthesize-activity` 보호 foundation 유지
- 제외: 추천 v2 Top 3, JD / 질문 요구사항 추출, 답변 초안 생성, 기록 보완 루프, OCR

## 후속 AI 고도화 순서

현재 문서는 AI API 보호 foundation과 AI 경험 분석 v2의 계약입니다. 후속 AI 결과 구조 고도화는 아래 순서로 별도 작은 PR에서 진행합니다.

1. AI 경험 분석 v2 — 구현 완료
   - STAR, 원본 근거, 부족한 정보, 자소서 소재 각도 추가
   - 기존 분석 결과와 새 분석 결과를 `schemaVersion`으로 구분
2. 추천 v2
   - 자기소개서 문항 / JD 요구사항 추출
   - 경험 Top 3 매칭, 부족 근거, 과장 위험 표시
3. 답변 초안 생성
   - 300자 / 700자 / 면접 / 포트폴리오 버전
   - 기록에 없는 사실은 생성하지 않고 부족 근거를 보완 안내로 분리
4. 기록 보완 루프
   - AI 보완 질문, 사용자 답변 저장 위치, 분석 재생성 contract 결정
5. OCR / JD 이미지 입력
   - 텍스트 붙여넣기 흐름 안정화 후 Optional
   - 원본 이미지 저장 없이 일회성 입력을 기본값으로 검토

## 보호 순서

세 AI API Route는 모두 아래 순서로 요청을 처리합니다.

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

## 남은 운영 방어

- 현재 rate guard는 단일 Next.js runtime 안에서만 동작합니다. Vercel 다중 인스턴스와 재시작을 견디는 durable rate limit은 Supabase table / RPC 또는 별도 rate limit store로 후속 구현합니다.
- 중복 요청 방지는 UI disabled 상태와 저장 repository의 일부 멱등성에 의존합니다. AI route 자체의 durable idempotency key, in-flight duplicate guard, `DUPLICATE_REQUEST` contract는 후속 결정이 필요합니다.
- OpenAI project spend limit과 alert는 코드가 아니라 OpenAI project 설정 / 운영 알림으로 적용하고, 설정 완료 여부를 별도 운영 체크리스트에 기록합니다.
- 사용자 소유 데이터 검증은 현재 세션 확인과 클라이언트가 보낸 payload 검증 단계까지입니다. 서버가 DB에서 직접 경험 / 활동을 읽어 AI에 전달하는 구조로 바꾸면 route에서 소유권을 더 강하게 재검증할 수 있습니다.
