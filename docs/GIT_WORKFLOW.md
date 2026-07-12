# CampusLog GitHub Workflow

## 1. 문서 목적

이 문서는 CampusLog 팀의 GitHub 협업 방식과 브랜치 전략을 설명합니다.

GitHub를 처음 쓰는 팀원도 안전하게 작업하고, Codex가 만든 코드도 바로 `main`에 반영하지 않고 작은 단위로 검토할 수 있게 하는 것이 목적입니다. 문제가 생겼을 때는 GitHub 기록을 기준으로 이전 상태를 확인하고 되돌릴 수 있도록 합니다.

## 2. 기본 원칙

- `main` 브랜치는 항상 안정적인 상태로 유지합니다.
- 작업은 작은 단위로 나눕니다.
- 하나의 브랜치에는 하나의 목적만 담습니다.
- Codex가 만든 코드도 사람이 반드시 검토합니다.
- 사용자가 승인한 범위 안에서만 작은 커밋과 푸시를 자주 합니다.
- Codex는 사용자의 명시적 승인 전에는 commit, push, PR 생성, merge를 진행하지 않습니다.
- 큰 변경은 바로 `main`에 반영하지 않습니다.
- 문제가 생기면 GitHub 기록을 기준으로 되돌립니다.

## 3. 브랜치 전략

| 브랜치 이름 | 용도 | 예시 |
| --- | --- | --- |
| `main` | 안정 버전 | `main` |
| `feature/*` | 기능 작업 | `feature/activity-form` |
| `docs/*` | 문서 작업 | `docs/add-git-workflow` |
| `fix/*` | 버그 수정 | `fix/localstorage-save-error` |
| `refactor/*` | 구조 개선 작업 | `refactor/component-structure` |

브랜치 이름은 작업 목적이 보이도록 짧고 명확하게 작성합니다.

예시:

- `docs/update-agents-rules`
- `docs/add-git-workflow`
- `feature/activity-form`
- `feature/ai-summary`
- `fix/localstorage-save-error`
- `refactor/component-structure`

## 3-1. 2차 MVP 병렬 작업 전략

v1.1 변경은 현재 `feature/progressive-experience-tracking`에서 안정화한 뒤 commit / review / merge합니다. 2차 MVP 기능은 v1.1이 반영된 최신 `main`에서 새 브랜치를 만들어 시작합니다.

### Track A — 인증·데이터·AI

담당: 다른 팀원

- `feature/auth-foundation`
- `feature/auth-contract`
- `feature/database-schema`
- `feature/user-data-sync`
- `feature/ai-analysis-enhancement`
- `feature/ai-recommendation-enhancement`

### Track B — 디자인·사용자 경험

담당: 사용자

- `design/tokens-and-components`
- `ux/auth-and-migration`
- `ux/activity-flow`
- `ux/campuslog-ai`
- `design/responsive-accessibility`

### 병렬 작업 규칙

- Track A는 schema, repository, 인증 상태, API error contract를 먼저 공유합니다.
- Track B는 공유 contract를 기준으로 화면 상태와 인터랙션을 구현합니다.
- 인증 화면은 Track A의 client/server 모듈·server action·validation·오류 contract를 먼저 merge하고, Track B가 `/login`, `/signup` route UI와 `components/auth/**`를 연결합니다.
- `types.ts`, 공통 layout, Navigation, 전역 style처럼 충돌 가능성이 큰 파일은 PR 시작 전에 담당과 merge 순서를 정합니다.
- schema / API contract와 대규모 디자인 token 변경을 하나의 PR에 섞지 않습니다.
- 사용자 흐름을 바꾸는 기능은 관련 `USER_FLOW.md`, `IA.md`, `SCREEN_SPEC.md`를 같은 PR에서 갱신합니다.
- 단계 또는 범위를 바꾸는 작업은 `CURRENT_PHASE.md`, `PRD.md`, `ISSUE_LOG.md`를 함께 갱신합니다.

### Release 기준선

- 팀이 승인한 v1.1 merge commit에는 release tag를 생성할지 검토합니다.
- tag 이름 예시: `v1.1.0`
- 2차 MVP 통합 전 v1.1 핵심 흐름 회귀 테스트를 기준으로 사용합니다.

## 4. 기본 작업 흐름

CampusLog 팀은 아래 순서로 작업합니다.

```text
작은 작업 선택
→ 브랜치 생성
→ 파일 수정
→ 변경 내용 확인
→ 커밋
→ 푸시
→ Pull Request 생성
→ 문기 검토
→ main merge
```

### 1. 작은 작업 선택

`docs/TODO.md`나 팀 논의 내용을 보고 한 번에 끝낼 수 있는 작은 작업을 고릅니다. 예를 들어 "GitHub 협업 규칙 문서 작성", "활동 경험 입력 폼 만들기"처럼 목적이 하나인 작업을 선택합니다.

### 2. 브랜치 생성

`main`에서 바로 작업하지 않고 새 브랜치를 만듭니다. 문서 작업이면 `docs/*`, 기능 작업이면 `feature/*`, 버그 수정이면 `fix/*` 형식을 사용합니다.

예시:

```bash
git switch main
git pull
git switch -c docs/add-git-workflow
```

### 3. 파일 수정

선택한 작업과 직접 관련된 파일만 수정합니다. 요청하지 않은 대규모 리팩토링이나 기능 추가는 별도 작업으로 분리합니다.

### 4. 변경 내용 확인

커밋하기 전에 어떤 파일이 바뀌었는지 확인합니다.

```bash
git status
git diff
```

문서 작업이면 오타, 제목 구조, 체크리스트가 맞는지 확인합니다. 기능 작업이면 실행 결과나 화면 동작을 확인합니다.

### 5. 커밋

하나의 커밋에는 하나의 목적만 담습니다. 커밋 메시지는 아래 커밋 메시지 규칙에 맞춰 작성합니다.

예시:

```bash
git add docs/GIT_WORKFLOW.md docs/WORK_STATUS.md docs/TASK_LOG.md docs/TODO.md
git commit -m "docs: add GitHub workflow guide"
```

### 6. 푸시

작업 브랜치를 GitHub에 올립니다.

```bash
git push origin docs/add-git-workflow
```

### 7. Pull Request 생성

GitHub에서 Pull Request를 만듭니다. PR 설명에는 작업 목적, 수정한 파일, 확인한 내용을 적습니다.
PR 본문은 한국어로 작성하고, PR 제목은 영어로 작성합니다.

### 8. 문기 검토

김문기가 최종 검토합니다. 필요한 경우 반건우, 하동현도 기능 검토, 문서 검토, 테스트에 참여합니다.

### 9. main merge

검토가 끝나고 문제가 없으면 `main`에 merge합니다. merge 후에는 `main`이 안정적으로 유지되는지 다시 확인합니다.

## 5. PR 규칙

Pull Request를 만들 때는 아래 내용을 적습니다.

- 작업 목적
- 수정한 파일
- 주요 변경 내용
- 확인한 내용
- 남은 작업
- 스크린샷 또는 실행 결과가 있으면 첨부

PR 제목은 영어로 작성하고, 작업 종류가 보이도록 작성합니다.

예시:

- `docs: add GitHub workflow guide`
- `feature: add activity record form`
- `fix: handle empty activity title`

## 6. 커밋 메시지 규칙

커밋 메시지는 아래 형식을 사용합니다.
커밋 메시지는 영어로 작성합니다.

| 말머리 | 의미 |
| --- | --- |
| `docs` | 문서 수정 |
| `feature` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 구조 개선 |
| `chore` | 설정, 폴더, 기타 작업 |
| `style` | UI 스타일 수정 |

예시:

- `docs: strengthen AGENTS working rules`
- `docs: add work tracking documents`
- `docs: add GitHub workflow guide`
- `feature: add activity record form`
- `fix: prevent empty title save`

## 7. Codex 작업 규칙

Codex로 작업할 때는 아래 규칙을 지킵니다.

- 작업 전 관련 문서를 먼저 읽게 합니다.
- 바로 수정하지 말고 계획을 먼저 세우게 합니다.
- 요청한 범위만 수정하게 합니다.
- 작업이 끝나면 수정 파일과 변경 내용을 요약하게 합니다.
- 작업 후 `WORK_STATUS.md`와 `TASK_LOG.md`를 업데이트하게 합니다.
- 큰 작업은 여러 개의 작은 브랜치로 나눕니다.

Codex가 만든 코드나 문서도 바로 `main`에 merge하지 않습니다. 사람이 변경 내용을 확인하고, 필요하면 PR에서 질문이나 수정 요청을 남긴 뒤 merge합니다.

## 8. 팀 역할

| 이름 | 역할 |
| --- | --- |
| 김문기 | 최종 검토, `main` merge, 전체 개발 방향 관리 |
| 반건우 | 기능 검토, 문서 검토, 테스트 참여 |
| 하동현 | 기능 검토, 문서 검토, 테스트 참여 |

위 역할은 고정이 아닙니다. 프로젝트 진행 상황, 작업량, 팀 논의에 따라 조정될 수 있습니다.

## 9. 하면 안 되는 것

- `main` 브랜치에 직접 큰 변경 push 금지
- 여러 기능을 한 커밋에 섞기 금지
- Codex가 수정한 코드를 검토 없이 merge 금지
- API Key, `.env`, 개인정보 커밋 금지
- 작동 여부를 확인하지 않고 PR merge 금지
- 요청하지 않은 대규모 리팩토링 금지

## 10. 작업 완료 체크리스트

- [ ] 작업 브랜치를 만들었는가?
- [ ] 한 가지 목적의 작업만 했는가?
- [ ] 변경 파일을 확인했는가?
- [ ] 실행 또는 문서 검토를 했는가?
- [ ] 커밋 메시지가 명확한가?
- [ ] 푸시했는가?
- [ ] PR 설명을 작성했는가?
- [ ] 리뷰 후 main에 merge했는가?
