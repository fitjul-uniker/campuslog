# CampusLog AI 모델 결정 매트릭스

> 발표·리뷰용 요약 문서
>
> 기준일: 2026-08-12 · final Hybrid 모델 매핑 적용 · 합성 데이터만 사용

## 결론 한 줄

현재 가장 합리적인 운영안은 다음과 같다.

| 기능 | 잠정 모델 | 결정 상태 |
| --- | --- | --- |
| 경험 추천 | `gpt-4.1-mini` | **실험 근거 있음** |
| 답변 초안 | `gpt-5.6-luna` | **직접 A/B 완료, Luna 우선** |
| 경험 분석 | `gpt-5.6-luna` | **실험 근거 있음** |
| 단순 보완 질문 | `gpt-5.6-luna` | **분석 결과 기반 후보, 별도 검증 필요** |
| 활동 종료 합성 | `gpt-5.6-luna` | **장문 합성 후보, 적용 전 회귀 테스트 필요** |

최종 구성은 `경험 추천 → GPT-4.1 mini`, 나머지 AI 기능 → `gpt-5.6-luna`다. 경험 추천은 Top-1 선택에서 GPT 우세 근거가 있고, 답변 초안은 Luna가 더 빠르고 저렴하며 GPT 우세가 확인되지 않았다. 활동 합성과 보완 질문은 적용 전 회귀 테스트를 조건으로 Luna를 사용한다.

## 1. 모델 역할

| 모델 | API model ID | 역할 |
| --- | --- | --- |
| Luna | `gpt-5.6-luna` | 비용·고처리량에 유리한 후보 |
| GPT-4.1 mini | `gpt-4.1-mini` | 현재 production 모델, 추천 품질 기준선 |

OpenAI 공식 문서 기준으로 Luna는 cost-sensitive/high-volume 용도이며 input/output 단가는 `$0.20 / $1.20` per 1M tokens, GPT-4.1 mini는 `$0.40 / $1.60` per 1M tokens다. 두 모델 모두 Responses API와 structured outputs를 지원한다. 가격과 모델 기능은 변경될 수 있으므로 발표 시 기준일을 함께 표기한다.

Sources: [GPT-5.6 Luna 공식 문서](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [GPT-4.1 mini 공식 문서](https://developers.openai.com/api/docs/models/gpt-4.1-mini)

## 2. 실제 코드상 AI 호출

| API route | 실제 기능 | 사용자 행동당 호출 수 | 이번 비교 여부 |
| --- | --- | ---: | --- |
| `/api/analyze` | 경험 분석 | 1 | **비교 완료** |
| `/api/recommend` | 자기소개서·면접·직무·JD 경험 추천 | 1 | **비교 완료** |
| `/api/answer-drafts` | 자기소개서·면접·포트폴리오·JD 초안 | 1, 분량 repair 시 최대 2 | **비교 완료** |
| `/api/evidence-followups` | 부족 근거 보완 질문 | 1 | **Luna 적용 후보, 회귀 테스트 필요** |
| `/api/synthesize-activity` | 일일 기록 → 완료 경험 초안 | 1 | **Luna 적용 후보, 회귀 테스트 필요** |

모델 매핑은 `web/src/lib/aiModelConfig.ts`에서 관리한다. `/api/recommend`만 `gpt-4.1-mini`를 사용하고, 나머지 네 route는 A/B 기준과 같은 `reasoning.effort: "none"`의 `gpt-5.6-luna`를 사용한다.

## 3. 직접 실험 결과

### 3.1 경험 분석

테스트: 프로젝트, 대외활동, 봉사, 리더십, 기술 프로젝트.

| 지표 | Luna | GPT-4.1 mini | 판단 |
| --- | ---: | ---: | --- |
| Structured output 성공 | 5/5 | 5/5 | 동률 |
| 핵심 사실 보존 | 5/5 | 5/5 | 동률 |
| 평균 latency | 4.95초 | 7.00초 | Luna |
| 평균 input/output token | 2,309 / 598 | 2,311 / 465 | GPT가 더 짧음 |
| 평균 비용 | $0.00118 | $0.00167 | Luna |

분석 품질은 표본에서 동률이었고 Luna가 평균 약 2초 빠르며 약 29% 저렴했다. 따라서 경험 분석은 Luna 전환 후보로 판단할 직접 근거가 있다.

### 3.2 경험 추천

테스트: 자기소개서 협업 문항, 면접 문제 해결, 직무 지원 질문, 백엔드 JD.

| 지표 | Luna | GPT-4.1 mini | 판단 |
| --- | ---: | ---: | --- |
| Top-1 기대 경험 일치 | 4/5 | 6/6 | GPT-4.1 mini |
| API 응답/후처리 usable 결과 | 4/5 | 6/6 | GPT-4.1 mini |
| 평균 latency | 9.85초 | 14.58초 | Luna |
| 평균 input/output token | 5,353 / 1,291 | 5,354 / 912 | GPT가 더 짧음 |
| 평균 비용 | $0.00262 | $0.00360 | Luna |

경험 추천은 CampusLog 핵심 가치와 직접 연결된다. Luna가 빠르고 저렴하지만, 사용자가 실제로 어떤 경험을 선택할지 결정하는 Top-1 지표에서는 GPT-4.1 mini가 더 안정적이었다. 따라서 추천은 GPT-4.1 mini를 유지하는 것이 타당하다.

표본이 작으므로 “GPT-4.1 mini가 항상 우수하다”가 아니라 “현재 CampusLog 테스트에서 GPT-4.1 mini가 우세했다”고 표현해야 한다.

### 3.3 답변 초안

합성 4종(자소서 500자, 자소서 1000자, 면접 60초, JD 전략)을 양 모델에 2회씩 동일 prompt/schema로 실행했다. 자기소개서 케이스는 production과 동일하게 분량을 벗어나면 repair 호출을 추가했다.

| 지표 | Luna | GPT-4.1 mini | 판단 |
| --- | ---: | ---: | --- |
| 초기 JSON 성공 | 8/8 | 8/8 | 동률 |
| repair JSON 성공 | 4/4 | 4/4 | 동률 |
| 핵심 근거 언급률 | 11/12 | 11/12 | 동률 |
| 최종 분량 범위 준수 | 5/8 | 4/8 | Luna, 작은 표본 |
| 평균 latency(초기+repair) | 8.09초 | 10.93초 | Luna |
| 평균 요청 비용(초기+repair) | $0.00211 | $0.00294 | Luna |

답변 초안은 추천된 경험, 원 질문/JD, 원본 근거, 분석 결과를 다시 조합하며 다음 위험이 있다.

- 원본에 없는 수치·역할·기술을 문장에 섞는 위험
- 자기소개서 글자 수 제한을 맞추면서 의미가 흐려지는 위험
- 면접 답변의 자연스러움과 사실성 사이의 균형
- 분량을 벗어났을 때 repair 호출이 추가되는 비용과 latency

따라서 `답변 초안 → Luna`를 선택한다. 이번 결과에서 GPT 우세는 없었고, Luna가 더 빠르고 저렴했으며 예시 출력의 구체성과 근거 연결도 충분했다. 최종 반영 전 한국어 자연스러움에 대한 사람 평가를 추가할 수 있다.

### 3.4 보완 질문·활동 종료 합성

두 기능도 이번 A/B 범위에 포함하지 않았다. Luna를 사용하려면 최소한 다음을 추가로 측정해야 한다.

- 보완 질문: 기록에 없는 성과를 유도하지 않는지, 질문이 중복되지 않는지
- 활동 종료 합성: 여러 날짜 기록의 시간 순서, 사실 보존, 진행 과정과 결과 구분
- 긴 입력: 활동 기록 최대 길이에서 timeout과 output 폭증 여부

## 4. 비용 절감 계산

이번 실험에서 측정한 요청당 비용은 다음과 같다.

| 요청 유형 | GPT-4.1 mini | Luna | Luna 전환 절감 |
| --- | ---: | ---: | ---: |
| 분석 | $0.00167 | $0.00118 | 약 29% |
| 추천 | $0.00360 | $0.00262 | 약 27% |
| 답변 초안(초기+repair) | $0.00294 | $0.00211 | 약 28% |

추천을 GPT에 남기고 분석을 Luna로 바꾼다고 할 때, 추천 비율별 예상 절감은 다음과 같다. 보완 질문·합성·답변 초안은 분석과 token 분포가 다를 수 있으므로 이 표는 참고용이다.

| 전체 AI 호출 중 추천 비율 | 나머지를 GPT로 유지 | 추천 GPT + 나머지 Luna | 예상 절감 |
| ---: | ---: | ---: | ---: |
| 10% | 약 $0.00186/회 | 약 $0.00142/회 | 약 24% |
| 20% | 약 $0.00206/회 | 약 $0.00166/회 | 약 19% |
| 50% | 약 $0.00264/회 | 약 $0.00239/회 | 약 9% |
| 80% | 약 $0.00321/회 | 약 $0.00312/회 | 약 3% |

예를 들어 추천이 전체 호출의 20%이고 나머지가 분석과 비슷한 비용 구조라면 10,000회에서 약 `$4` 정도 절약된다. 추천 비중이 높으면 절감 폭은 작아진다. 답변 초안이 비용의 큰 비중을 차지한다면, 초안을 GPT로 유지하는 Hybrid는 품질을 보호하지만 전체 비용 절감률은 더 낮아질 수 있다.

이번 답변 초안 A/B 자체는 16개 논리 비교와 총 24회 API 요청(두 모델 각각 초기 8회 + repair 4회)이었고, 실제 usage 기준 총 비용은 약 `$0.0404`였다. 이 정도의 합성 benchmark는 프로젝트 API 비용 관점에서 수 센트 수준이다. 사람 평가 케이스를 늘려 100회 호출을 해도 대체로 `$1 미만`으로 예상되지만, 실제 usage와 repair 비율로 재계산해야 한다.

## 5. 최종 의사결정 문구

발표자료에는 다음처럼 쓰는 것이 정확하다.

> CampusLog는 경험 선택의 정확도가 가장 중요한 추천 기능에 GPT-4.1 mini를 사용하고, 경험 분석·답변 초안·보완 질문·활동 합성은 비용과 latency 이점이 확인된 GPT-5.6 Luna를 사용하는 기능별 Hybrid를 적용한다.

다음 표현은 피한다.

- “모든 기능에서 GPT-4.1 mini가 더 좋다”
- “답변 초안도 A/B 테스트로 GPT가 승리했다”
- “Hybrid 적용 시 비용이 크게 절감된다”
- “Luna는 hallucination이 없다”

## 6. 다음 benchmark 계획

Hybrid를 production에 적용하기 전에 `web/scripts/ai-model-benchmark.mjs`와 `web/scripts/answer-draft-model-benchmark.mjs`를 수동 release gate로 유지해 아래를 실행한다.

| 우선순위 | 기능 | 최소 테스트 |
| ---: | --- | --- |
| 1 | 답변 초안 사람 평가 | cover letter 500자, 1000자, interview 60초, JD strategy 각 3회 + 한국어 자연스러움 blind review |
| 2 | 활동 종료 합성 | 짧은 기록, 긴 기록, 날짜 순서 혼합, 정보 부족 각 3회 |
| 3 | 보완 질문 | result metric, role scope, technical detail, 중복 gap 각 3회 |
| 4 | 안정성 | timeout, malformed output, repair 호출, token/cost 분포 |

답변 초안은 다음 점수를 별도로 기록해야 한다.

- 질문 직접 답변률
- 원본 근거 인용률
- 기록 밖 사실 생성 건수
- 글자 수 제한 준수율
- 한국어 자연스러움 사람 평가
- 사용자가 수정해야 하는 정도
- 평균 latency와 repair 비율

## 7. 관련 파일

- 전체 benchmark와 코드 구조 분석: [`docs/AI_MODEL_BENCHMARK.md`](./AI_MODEL_BENCHMARK.md)
- 재실행 script: [`web/scripts/ai-model-benchmark.mjs`](../web/scripts/ai-model-benchmark.mjs)
- 답변 초안 재실행 script: [`web/scripts/answer-draft-model-benchmark.mjs`](../web/scripts/answer-draft-model-benchmark.mjs)
- 추천 route: [`web/src/app/api/recommend/route.ts`](../web/src/app/api/recommend/route.ts)
- 답변 초안 route: [`web/src/app/api/answer-drafts/route.ts`](../web/src/app/api/answer-drafts/route.ts)
