# CampusLog 최신 테스트 결과

## 실행 요약

> 이 파일은 가장 최근 전체 실행 상태만 유지합니다. 실제로 확인하지 않은 항목은 `NOT_RUN`입니다.

| 항목 | 값 |
| --- | ---: |
| 전체 테스트 케이스 | 35 |
| PASS | 32 |
| FAIL | 0 |
| BLOCKED | 0 |
| NOT_RUN | 0 |
| NOT_IMPLEMENTED | 3 |

- 실행 일시: 2026-08-20, Asia/Seoul
- 실행 환경: macOS, Node v23.11.0, npm 10.9.2, Next.js 15.5.20
- 브라우저: Codex in-app Chromium
- 자동화 명령: `node --test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`
- 로컬 UI 실행: `NEXT_PUBLIC_CAMPUSLOG_UI_PREVIEW=1 npm run dev -- --port 3100`
- 실제 통합 실행: `env -u OPENAI_API_KEY npm run dev`
- 실제 AI 호출: TC-022 분석 1회, TC-027 답변 초안 1회. 두 요청 모두 `retry: false`로 추가 호출 없음
- 비밀정보: 환경 변수 값·계정 비밀번호·세션 cookie는 기록하지 않음

## 현재 PASS

| Test ID | 검증 결과 | 증거 |
| --- | --- | --- |
| TC-001 | Node 테스트 전체 통과 | 최신 186 tests, 186 pass, 0 fail, 약 695ms |
| TC-002 | ESLint 통과 | `npm run lint`, exit 0 |
| TC-003 | TypeScript 통과 | `npx tsc --noEmit`, exit 0 |
| TC-004 | Production build 통과 | compile 성공, 19개 static page 생성, exit 0 |
| TC-005 | 보호 화면 redirect | `/dashboard` HTTP 307, 안전한 로그인 `returnTo` |
| TC-006 | 비로그인 AI API 보호 | 5개 route 모두 HTTP 401 `SESSION_REQUIRED` |
| TC-007 | 로그인 예외 처리 | 빈 제출 차단, 잘못된 비밀번호 일반 오류 문구, Server Action 오류 없음 |
| TC-008 | 정상 로그인·세션 복구 | QA 계정 로그인, 대시보드 진입, 새로고침·새 탭 session 유지 |
| TC-009 | 사용자별 데이터 격리 | 두 QA 계정 목록 분리, 상대 experience 직접 URL 원문·첨부 미노출 |
| TC-010 | 대시보드 빈 상태 | 실제 브라우저 DOM에서 0개·활동 추가·기록 안내 확인 |
| TC-011 | 활동 빈 입력 차단 | dialog 유지와 제목 필수 alert 확인 |
| TC-012 | 활동 정상 생성 | UUID 상세 이동, 입력값·진행 중·0개 기록 확인 |
| TC-013 | 기록 없는 활동 종료 차단 | 실제 DB 활동에서 안내 후 진행 상태 보존, AI 호출 없음 |
| TC-014 | 날짜별 기록 저장·새로고침 | 빈 제출 차단, 캘린더 1개·이벤트·타임라인·재시작 뒤 유지 |
| TC-015 | 미래 기록 차단 | 현재일 다음 날짜 button disabled 확인 |
| TC-016 | 기록 수정·개별 삭제·연속 사용 | 2개→1개에서 수정 기록·활동 관계 보존, 최종 정리 뒤 기록 없음 |
| TC-017 | 완료 경험 정상 저장 | 실제 DB UUID 상세, 필수 입력·기간·내용·성과 새로고침 유지 |
| TC-018 | 경험 긴 입력 상한 | 경계·90% 안내·초과량 자동 테스트 통과 |
| TC-019 | 관련 링크 검증·저장 | 잘못된 URL·중복 차단, 정상 URL·설명 저장·재조회 |
| TC-020 | 첨부 선택 validation | 형식·개수·용량·빈 파일 자동 테스트 통과 |
| TC-021 | 실제 private PDF 업로드·조회·개별 삭제 | 첨부 1개→0개, 새로고침 유지, 경험 원문·성과·미분석 상태 보존 |
| TC-022 | 실제 AI 분석·DB 저장 | OpenAI 정확히 1회·HTTP 200·summary/STAR/성과/부족 근거/키워드, 새로고침 재조회 |
| TC-023 | AI 분석 실패·취소 보존 | mock 실패·취소 2 PASS, 저장 0회, 원문·마지막 정상 분석 불변 |
| TC-024 | 실제 자기소개서 추천·자동 저장 | OpenAI 1회·HTTP 200·Top 3 필수 구조, 기록 24→25, 새로고침 유지 |
| TC-025 | 추천 빈 상태·중복 task | 관련 구조/회귀 테스트 통과 |
| TC-026 | 추천 이미지 contract | 형식·data URL·원본 비저장 자동 테스트 통과 |
| TC-027 | 실제 500자 답변 초안·저장 | OpenAI 1회·`retry: false`·451자·본문/근거/보완/주의 구조, 새로고침 재조회 |
| TC-028 | 로그인 AI 사전 guard | 400·413·422·429와 Retry-After, OpenAI 호출 0회 |
| TC-029 | 추천·기록 빈 상태와 검색 미일치 | 빈 QA 계정 2개 route CTA, 데이터 계정 검색 결과 0 상태 |
| TC-030 | 존재하지 않는 경험 ID | 찾을 수 없음 상태와 목록 복귀 링크, 다른 데이터 미노출 |
| TC-031 | 390px 반응형 | preview 4개와 로그인 실데이터 5개 route overflow 0 |
| TC-032 | reduced motion·초점 회귀 | 관련 구조/controller 테스트 통과 |

## 실패한 테스트

- 현재 남아 있는 `FAIL` 없음
- Run #5에서 TC-007이 최초 `FAIL`이었으나 수정 후 `PASS`로 전환했다. 과거 실패는 `TEST_HISTORY.md`에 보존한다.

## 수정이 필요한 기능

- 로그인 오류가 제품의 일반 오류 대신 Next.js Server Action runtime error overlay를 노출하던 결함은 수정 완료했다.
- `docs/AI_API_CONTRACT.md`의 이미지 입력 상태와 실제 구현이 불일치하지만, 이번 요청 범위에서는 테스트 문서에 차이를 명시하고 기존 제품 문서는 변경하지 않았습니다.

## 수정 후 재실행 결과

- 수정: `profile-actions.ts`의 비동기 함수 외 runtime export를 별도 `profile-action-state.ts`로 분리
- 동일 조건 재실행: 잘못된 비밀번호에서 일반 사용자 오류만 표시, TC-007 PASS
- 관련 회귀: profile action 구조 테스트와 AI 분석 실패·취소 보존 테스트 추가, 전체 Node 186개·lint·typecheck·production build 모두 PASS
- 최종 회귀 중 `.next/types`에 개발 서버가 남긴 `* 2.ts` 생성 파일 3개로 typecheck가 한 번 실패했으나, 소스가 아닌 `.next` 생성 캐시만 제거한 뒤 동일 명령이 PASS했고 production build도 19개 static page를 정상 생성했다.
- 마지막 확인에서 typecheck와 production build를 동시에 실행해 build가 `.next/types`를 교체하는 동안 typecheck가 TS6053을 반환했다. build 완료 뒤 `npx tsc --noEmit`을 단독 재실행해 exit 0을 확인했으며 제품 소스 수정은 없었다.

## 실행하지 않은 항목

- `NOT_RUN` 없음
- 현재 제품에 사용자 플로우가 없는 3개 항목만 `NOT_IMPLEMENTED`로 분리되어 있으며 실패 집계에 포함하지 않는다.

## 최종 상태

`COMPLETE`

핵심 사용자 흐름, 자동화 기준선과 production build, 로그인·RLS, 실제 DB 경험·링크·private PDF 업로드·개별 삭제, 활동·날짜별 기록의 생성·수정·개별 삭제, OpenAI 추천·경험 분석·답변 초안과 저장·재조회, preview·실데이터 모바일 검증을 완료했습니다. 로그인 AI 사전 guard와 mock 실패·취소 보존도 확인했습니다. 빈 QA 계정에 만든 합성 데이터는 최종적으로 활동·기록·경험·첨부·추천 기록 모두 0개로 정리했습니다. 실행 가능한 32개 테스트는 모두 `PASS`이며 `FAIL`, `BLOCKED`, `NOT_RUN`은 없습니다.
