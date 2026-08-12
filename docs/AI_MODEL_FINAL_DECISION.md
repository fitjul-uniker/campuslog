# CampusLog AI 모델 최종 결정

> 기준일: 2026-08-12 · final Hybrid 모델 매핑 적용 · 합성 데이터 benchmark 기준

## 최종안

**C. 기능별 Hybrid**

경험 추천에는 `gpt-4.1-mini`을 사용하고, 나머지 AI 기능에는 `gpt-5.6-luna`를 사용한다.

| 기능 | API route | 최종 모델 | 결정 근거 |
| --- | --- | --- | --- |
| 경험 추천(자소서·면접·직무·JD) | `/api/recommend` | `gpt-4.1-mini` | Top-1 기대 경험 선택이 Luna보다 안정적 |
| 경험 분석 | `/api/analyze` | `gpt-5.6-luna` | 품질·JSON 안정성 동률, 더 빠르고 저렴 |
| 답변 초안 | `/api/answer-drafts` | `gpt-5.6-luna` | GPT 우세 근거 없음, 예시의 구체성·근거 연결과 비용·속도에서 Luna 우선 |
| 보완 질문 | `/api/evidence-followups` | `gpt-5.6-luna` | 분석과 같은 사실 기반 구조화 경로로 분류 |
| 활동 기록 합성 | `/api/synthesize-activity` | `gpt-5.6-luna` | 장문 기록 정리·요약 경로로 분류 |

## 실험 근거

- 경험 분석: 양 모델 structured output 5/5, 핵심 사실 보존 5/5. Luna 평균 4.95초, GPT-4.1 mini 평균 7.00초.
- 경험 추천: GPT-4.1 mini Top-1 기대 일치 6/6, Luna 4/5. 추천은 CampusLog의 핵심 품질 경로이므로 GPT를 유지한다.
- 답변 초안: 4개 합성 케이스를 양 모델에 2회씩 실행. 초기 JSON과 repair JSON은 모두 성공했고, 핵심 근거 언급률은 11/12로 동률이었다. Luna 평균 8.09초·$0.00211, GPT-4.1 mini 평균 10.93초·$0.00294였다.
- 답변 초안 예시에서는 Luna가 문제·행동·검증 과정을 더 구체적으로 풀었고, GPT-4.1 mini가 우수하다고 판단할 직접 근거는 없었다.

## 비용 참고

답변 초안 benchmark는 16개 논리 비교, 초기 요청 16회와 분량 repair 8회로 총 24회 API 요청을 실행했으며 실제 비용은 약 `$0.0404`였다. 따라서 모델 비교를 위해 여러 케이스를 반복하는 비용은 프로젝트 API 기준으로 크지 않다.

## 적용 후 회귀 확인 항목

모델 매핑을 적용했으며, 다음 운영 회귀 확인을 이어서 수행한다.

1. 보완 질문: 기록에 없는 성과를 유도하지 않는지, 중복 질문이 없는지 확인
2. 활동 합성: 긴 입력, 날짜 순서, 정보 부족 상태에서 사실 보존 확인
3. 답변 초안: 한국어 자연스러움과 과장 여부를 사람 평가로 확인
4. 모든 route: schema 오류, timeout, repair 실패 시 오류 처리 확인

## 적용한 코드 구조

server-only `web/src/lib/aiModelConfig.ts`에서 `/api/recommend`만 `gpt-4.1-mini`, 나머지 route는 `gpt-5.6-luna`로 지정한다. Luna route에는 A/B와 같은 `reasoning.effort: "none"`을 명시하고, 기존 prompt·schema·timeout·streaming·저장 계약은 유지한다.

상세 분석과 원시 benchmark 결과 설명은 [`AI_MODEL_BENCHMARK.md`](./AI_MODEL_BENCHMARK.md), 발표용 요약은 [`AI_MODEL_DECISION_MATRIX.md`](./AI_MODEL_DECISION_MATRIX.md)에 보관한다.
