# CampusLog AI API Contract

## 상태

- 브랜치: `feature/ai-api-protection`
- 범위: `/api/analyze`, `/api/recommend`, `/api/synthesize-activity` 보호 foundation
- 제외: AI 분석 품질 개선, JD / 질문 기반 추천, OCR, 부족 경험 비교, 답변 초안 생성

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

## 남은 운영 방어

- 현재 rate guard는 단일 Next.js runtime 안에서만 동작합니다. Vercel 다중 인스턴스와 재시작을 견디는 durable rate limit은 Supabase table / RPC 또는 별도 rate limit store로 후속 구현합니다.
- 중복 요청 방지는 UI disabled 상태와 저장 repository의 일부 멱등성에 의존합니다. AI route 자체의 durable idempotency key, in-flight duplicate guard, `DUPLICATE_REQUEST` contract는 후속 결정이 필요합니다.
- OpenAI project spend limit과 alert는 코드가 아니라 OpenAI project 설정 / 운영 알림으로 적용하고, 설정 완료 여부를 별도 운영 체크리스트에 기록합니다.
- 사용자 소유 데이터 검증은 현재 세션 확인과 클라이언트가 보낸 payload 검증 단계까지입니다. 서버가 DB에서 직접 경험 / 활동을 읽어 AI에 전달하는 구조로 바꾸면 route에서 소유권을 더 강하게 재검증할 수 있습니다.
