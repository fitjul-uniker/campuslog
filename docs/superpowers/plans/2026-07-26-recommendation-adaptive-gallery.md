# AI 추천 적응형 Gallery 이미지 첨부 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 추천의 이미지 입력을 빈 상태의 큰 ReUI Gallery 업로드 안내에서 첨부 상태의 compact Gallery로 자연스럽게 전환한다.

**Architecture:** 기존 controlled `File[]`, `validateRecommendationImageSelection`, 추천 폼의 붙여넣기와 AI 요청 계약을 유지한다. `RecommendationImagePicker`만 empty/selected UI를 분기하고, 각 타일은 로컬 object URL을 사용하며 native `dialog`가 확대 보기를 담당한다. 스타일은 기존 CampusLog 전역 토큰과 CSS를 사용하고 새 dependency를 추가하지 않는다.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS, Lucide React, Node test

## Global Constraints

- JPG·PNG·WebP, 최대 3장, 원본 장당 5MB 계약을 유지한다.
- 파일 선택, drag and drop, 추천 폼 안 `Cmd/Ctrl+V` 이미지 붙여넣기를 모두 유지한다.
- 원본 이미지는 저장하지 않고 기존 단일 vision 요청으로만 전달한다.
- 새 dependency와 ReUI 전용 hook을 추가하지 않는다.
- API, schema, repository, migration, Storage, AI payload를 수정하지 않는다.
- 실제 사용자가 선택한 파일만 표시하고 ReUI 예제의 기본 샘플 이미지를 넣지 않는다.
- `선명한 캡쳐일수록 정확해요` 문구를 사용하지 않는다.
- 제한 문구는 `JPG, PNG, WebP · 최대 3장 · 장당 5MB 이하`로 한 번만 표시한다.
- 데스크톱 Gallery는 3열, 640px 이하는 2열이며 가로 overflow가 없어야 한다.
- 모든 주요 동작은 최소 44×44px hit area, `focus-visible`, hover 없는 장치 대응을 제공한다.
- 개발 서버가 실행 중인 상태에서 `npm run build`를 실행하지 않는다.
- 사용자 승인 전 commit, push, PR을 실행하지 않는다.

---

### Task 1: 적응형 Gallery 사용자 가시 계약 테스트

**Files:**
- Modify: `web/src/components/ai/RecommendationForm.structure.test.mjs`
- Test: `web/src/components/ai/recommendationImagePresentation.test.mjs`

**Interfaces:**
- Consumes: `RecommendationImagePicker.tsx`, `globals.css`, `getRecommendationImageSelectionSummary(files, maxCount)`
- Produces: empty hero, selected gallery, 추가 타일, 전체 삭제, 확대 dialog, 반응형 grid를 고정하는 구조 테스트

- [ ] **Step 1: 기존 Basic + Gallery 구조 테스트를 적응형 계약으로 변경한다**

`RecommendationForm.structure.test.mjs`의 마지막 테스트를 아래 계약으로 교체한다.

```js
test("추천 이미지 입력은 빈 업로드 안내에서 선택 Gallery로 전환한다", () => {
  assert.match(pickerSource, /files\.length === 0/);
  assert.match(pickerSource, /질문 또는 JD 이미지를 추가하세요/);
  assert.match(
    pickerSource,
    /JPG, PNG, WebP · 최대 3장 · 장당 5MB 이하/,
  );
  assert.match(pickerSource, /className="recommendation-image-add-tile"/);
  assert.match(pickerSource, />전체 삭제</);
  assert.match(pickerSource, /이미지 크게 보기/);
  assert.match(pickerSource, /<dialog/);
  assert.doesNotMatch(pickerSource, /recommendation-image-help/);
  assert.match(
    styles,
    /\.recommendation-image-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*\.recommendation-image-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  );
});
```

- [ ] **Step 2: 테스트를 실행해 RED를 확인한다**

Run:

```bash
cd web
node --no-warnings --test src/components/ai/RecommendationForm.structure.test.mjs src/components/ai/recommendationImagePresentation.test.mjs
```

Expected: `recommendation-image-add-tile`, `전체 삭제`, 확대 dialog가 없어 새 구조 테스트가 FAIL하고 기존 summary 테스트는 PASS한다.

- [ ] **Step 3: 실패 원인이 새 계약 때문인지 확인한다**

실패 출력에서 다음 항목을 확인한다.

```text
Expected input to match /className="recommendation-image-add-tile"/
Expected input to match />전체 삭제</
Expected input to match /<dialog/
```

다른 import 오류나 테스트 환경 오류가 있으면 구현 전에 해당 원인만 수정한다.

- [ ] **Step 4: 커밋은 실행하지 않는다**

저장소 규칙에 따라 RED 테스트는 작업 트리에 유지하되 commit은 사용자 승인 전 실행하지 않는다.

### Task 2: Adaptive Gallery 컴포넌트와 확대 보기 구현

**Files:**
- Modify: `web/src/components/ai/RecommendationImagePicker.tsx`
- Modify: `web/src/app/globals.css`
- Test: `web/src/components/ai/RecommendationForm.structure.test.mjs`
- Test: `web/src/components/ai/recommendationImagePresentation.test.mjs`

**Interfaces:**
- Consumes: `files: File[]`, `onFilesChange(files: File[]): void`, `disabled?: boolean`, `validateRecommendationImageSelection`, `formatAttachmentSize`
- Produces: empty upload hero, selected Gallery, add tile, `clearFiles(): void`, `selectedPreviewFile: File | null`, native preview dialog

- [ ] **Step 1: Lucide 아이콘과 preview 상태를 추가한다**

`RecommendationImagePicker.tsx`의 아이콘 import를 아래 구성으로 변경한다.

```ts
import {
  CircleAlert,
  Images,
  Plus,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
```

Picker 내부에는 선택된 확대 파일을 보관한다.

```ts
const [selectedPreviewFile, setSelectedPreviewFile] = useState<File | null>(
  null,
);
```

- [ ] **Step 2: 파일 타일을 Gallery overlay 구조로 변경한다**

`RecommendationImagePreview`가 `onPreview`를 추가로 받도록 한다.

```ts
type RecommendationImagePreviewProps = {
  file: File;
  onPreview: () => void;
  onRemove: () => void;
  disabled: boolean;
};
```

타일 내부는 다음 역할을 가진다.

```tsx
<li className="recommendation-image-item">
  <div className="recommendation-image-preview">
    {previewUrl ? (
      <Image
        src={previewUrl}
        alt={`${file.name} 미리보기`}
        width={480}
        height={480}
        sizes="(max-width: 640px) 46vw, 280px"
        unoptimized
      />
    ) : (
      <span className="recommendation-image-loading" aria-hidden="true" />
    )}
    <div className="recommendation-image-actions">
      <button
        type="button"
        onClick={onPreview}
        disabled={disabled || !previewUrl}
        aria-label={`${file.name} 이미지 크게 보기`}
      >
        <ZoomIn aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`${file.name} 이미지 삭제`}
      >
        <X aria-hidden="true" />
      </button>
    </div>
    <span className="recommendation-image-info">
      <strong title={file.name}>{file.name}</strong>
      <span>{formatAttachmentSize(file.size)}</span>
    </span>
  </div>
</li>
```

object URL 생성과 `URL.revokeObjectURL` 정리는 기존 effect를 유지한다.

- [ ] **Step 3: native preview dialog를 추가한다**

같은 파일 안에 `RecommendationImageDialog`를 추가한다. `file`이 존재할 때 object URL을 만들고 `showModal()`을 호출하며, `close`, backdrop click, `Esc`에서 `onClose`를 호출한다.

```tsx
function RecommendationImageDialog({
  file,
  onClose,
}: {
  file: File | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!file || !dialog || dialog.open) {
      return;
    }
    dialog.showModal();
  }, [file]);

  if (!file) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="recommendation-image-dialog"
      aria-label={`${file.name} 이미지 미리보기`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
    >
      <div className="recommendation-image-dialog-content">
        <button
          type="button"
          className="recommendation-image-dialog-close"
          onClick={() => dialogRef.current?.close()}
          aria-label="이미지 미리보기 닫기"
        >
          <X aria-hidden="true" />
        </button>
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={`${file.name} 크게 보기`}
            width={1400}
            height={1000}
            sizes="90vw"
            unoptimized
          />
        ) : null}
      </div>
    </dialog>
  );
}
```

- [ ] **Step 4: empty 상태를 ReUI Gallery형 hero로 변경한다**

숨김 input은 fieldset 바로 아래에 한 번만 렌더링한다. `files.length === 0`일 때 dropzone은 다음 순서로 표시한다.

```tsx
<div className="recommendation-image-dropzone" ...dragHandlers>
  <span className="recommendation-image-upload-icon" aria-hidden="true">
    <Images />
  </span>
  <div className="recommendation-image-upload-copy">
    <h3>질문 또는 JD 이미지를 추가하세요</h3>
    <p>여기에 끌어다 놓거나 이미지 선택을 눌러 주세요.</p>
    <span>JPG, PNG, WebP · 최대 3장 · 장당 5MB 이하</span>
  </div>
  <button
    type="button"
    className="recommendation-image-select"
    onClick={() => inputRef.current?.click()}
    disabled={disabled}
  >
    <Upload aria-hidden="true" />
    이미지 선택
  </button>
</div>
```

업로드 영역 아래의 기존 `.recommendation-image-help` 문단은 삭제한다.

- [ ] **Step 5: selected 상태를 Gallery와 add tile로 변경한다**

`files.length > 0`이면 큰 dropzone 대신 아래 구조를 렌더링한다.

```tsx
<div className="recommendation-image-gallery" ...dragHandlers>
  <div className="recommendation-image-gallery-heading">
    <div>
      <h3>첨부 이미지</h3>
      <span>
        {files.length}/{RECOMMENDATION_IMAGE_MAX_COUNT} · 총{" "}
        {formatAttachmentSize(selectionSummary.totalBytes)}
      </span>
    </div>
    <button type="button" onClick={clearFiles} disabled={disabled}>
      <Trash2 aria-hidden="true" />
      전체 삭제
    </button>
  </div>
  <ul className="recommendation-image-list">
    {files.map(/* RecommendationImagePreview */)}
    {!isAtLimit ? (
      <li className="recommendation-image-add-item">
        <button
          type="button"
          className="recommendation-image-add-tile"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Plus aria-hidden="true" />
          <span>이미지 추가</span>
        </button>
      </li>
    ) : null}
  </ul>
</div>
```

`clearFiles`는 `setSelectedPreviewFile(null)`, `setErrorMessage("")`, `onFilesChange([])`를 순서대로 실행한다. 개별 삭제 시 해당 파일이 확대 중이면 preview 상태도 비운다.

- [ ] **Step 6: Gallery reference와 CampusLog 토큰을 결합한 CSS를 작성한다**

기존 `.recommendation-image-dropzone`부터 `.recommendation-image-remove`까지의 블록을 아래 시각 계약으로 교체한다.

```css
.recommendation-image-dropzone {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border: 1px dashed #cfccc4;
  border-radius: 16px;
  background: #fbfaf7;
  padding: 32px 24px;
  text-align: center;
}

.recommendation-image-upload-icon {
  display: inline-flex;
  width: 58px;
  height: 58px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e1ded7;
  border-radius: 999px;
  background: #f2f0eb;
}

.recommendation-image-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.recommendation-image-preview,
.recommendation-image-add-tile {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 14px;
}

.recommendation-image-info {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  display: grid;
  gap: 2px;
  background: linear-gradient(transparent, rgb(0 0 0 / 78%));
  color: #ffffff;
  padding: 34px 12px 11px;
}
```

추가로 다음 상태를 구현한다.

- dropzone과 gallery의 `data-dragging="true"` 경계·배경 강조
- gallery action overlay의 hover / focus-within 표시
- hover 없는 장치에서 action과 metadata 항상 표시
- dialog `::backdrop`, 최대 `90vw × 86vh`, `object-fit: contain`
- 640px 이하 2열, empty 최소 높이 190px
- `prefers-reduced-motion: reduce`에서 transition 제거

- [ ] **Step 7: 관련 테스트를 실행해 GREEN을 확인한다**

Run:

```bash
cd web
node --no-warnings --test \
  src/components/ai/RecommendationForm.structure.test.mjs \
  src/components/ai/recommendationImagePresentation.test.mjs \
  src/lib/recommendationImageInput.test.mjs \
  src/lib/recommendationImageInputMigration.test.mjs
```

Expected: 모든 관련 테스트 PASS.

- [ ] **Step 8: lint와 typecheck를 실행한다**

Run:

```bash
cd web
npm run lint
npx tsc --noEmit
```

Expected: 두 명령 exit 0. 개발 서버가 실행 중이므로 build는 실행하지 않는다.

- [ ] **Step 9: 커밋은 실행하지 않는다**

독립 검증 결과만 기록하고 commit은 사용자 승인 전 실행하지 않는다.

### Task 3: 활성 문서와 작업 기록 정합성 갱신

**Files:**
- Modify: `docs/CURRENT_PHASE.md`
- Modify: `docs/DESIGN.md`
- Modify: `docs/SCREEN_SPEC.md`
- Modify: `docs/WORK_STATUS.md`
- Modify: `docs/TODO.md`
- Modify: `docs/ISSUE_LOG.md`
- Modify: `docs/TASK_LOG.md`
- Modify: `design-qa.md`

**Interfaces:**
- Consumes: Task 2에서 확인된 UI 상태와 검증 결과
- Produces: 현재 단계와 사용자 결정이 한 번만 기록된 활성 문서

- [ ] **Step 1: 화면·디자인 기준을 적응형 Gallery로 교체한다**

기존 `Basic dropzone + Gallery` 또는 compact 업로드 문구를 다음 기준으로 대체한다.

```text
AI 추천 이미지 첨부는 비어 있을 때 중앙 정렬의 Gallery 업로드 영역으로
입력 방법과 JPG·PNG·WebP, 최대 3장, 장당 5MB 제한을 한 번만 안내한다.
첫 파일이 들어오면 큰 업로드 영역은 첨부 이미지 헤더, 전체 용량,
전체 삭제, 정사각형 Gallery와 이미지 추가 타일로 전환한다.
```

- [ ] **Step 2: 데이터 영향 없음과 접근성 기준을 기록한다**

관련 문서에 아래 내용을 반영한다.

```text
파일 선택·drop·폼 안 붙여넣기, validator, 원본 비저장, 단일 vision 요청
계약은 유지한다. Gallery는 데스크톱 3열·모바일 2열, 44px 동작 영역,
focus-visible, hover 없는 장치의 동작 노출, 확대 dialog의 Esc 닫기를 제공한다.
```

- [ ] **Step 3: 작업 기록 문서에 실제 검증 결과를 작성한다**

`WORK_STATUS`, `TASK_LOG`, `ISSUE_LOG`, `TODO`, `design-qa.md`에는 실제 실행한 테스트 수, lint/typecheck 결과, 브라우저 viewport, 콘솔·overflow·상태 확인 결과만 기록한다. 실행하지 않은 검증을 완료로 표시하지 않는다.

- [ ] **Step 4: 문서 diff를 검증한다**

Run:

```bash
git diff --check -- \
  docs/CURRENT_PHASE.md \
  docs/DESIGN.md \
  docs/SCREEN_SPEC.md \
  docs/WORK_STATUS.md \
  docs/TODO.md \
  docs/ISSUE_LOG.md \
  docs/TASK_LOG.md \
  design-qa.md
```

Expected: whitespace error 없음.

### Task 4: 브라우저 Design QA와 최종 회귀 검증

**Files:**
- Modify if findings require fixes: `web/src/components/ai/RecommendationImagePicker.tsx`
- Modify if findings require fixes: `web/src/app/globals.css`
- Modify after QA: `design-qa.md`
- Modify after QA: `docs/TASK_LOG.md`

**Interfaces:**
- Consumes: 실행 중인 `http://localhost:3000/recommend`, ReUI Gallery reference capture
- Produces: desktop/mobile의 empty·selected·max·preview·remove·clear·error 검증과 비교 캡처

- [ ] **Step 1: in-app browser에서 empty 상태를 확인한다**

1440×900에서 다음을 확인한다.

```text
- 이미지 첨부 legend 아래에 큰 Gallery 업로드 영역이 하나만 보인다.
- 제목, drag 안내, 형식·3장·장당 5MB 제한, 이미지 선택 CTA 순서가 맞다.
- 과거 선명한 캡쳐 안내와 별도 도움말 문단이 없다.
- 폼의 textarea, 예시 chip, AI 분석 CTA와 시각적으로 충돌하지 않는다.
```

- [ ] **Step 2: 실제 테스트 이미지로 selected·max 상태를 확인한다**

1장, 2장, 3장을 차례로 선택해 다음을 확인한다.

```text
- 첫 첨부 후 큰 upload hero가 사라진다.
- 첨부 이미지 n/3, 총 용량, 전체 삭제가 표시된다.
- n < 3일 때만 이미지 추가 타일이 보인다.
- 3장에서는 추가 타일이 사라진다.
- 파일명·용량과 확대·삭제가 타일 안에서 읽힌다.
```

- [ ] **Step 3: 상호작용과 오류를 확인한다**

다음을 직접 실행한다.

```text
- drag and drop 추가
- 개별 삭제 후 개수·전체 용량 갱신
- 전체 삭제 후 empty 상태 복귀
- 확대 dialog 열기, 닫기 버튼, 배경 클릭, Esc 닫기
- 잘못된 형식, 5MB 초과, 3장 초과 오류 alert
- 폼 안 이미지 붙여넣기와 일반 텍스트 붙여넣기
```

- [ ] **Step 4: 모바일·접근성·콘솔을 확인한다**

390×844에서 다음을 확인한다.

```text
- Gallery 2열
- scrollWidth === innerWidth
- 모든 버튼 키보드 focus-visible
- hover 없이 확대·삭제와 파일 정보 확인 가능
- dialog가 viewport를 넘지 않음
- console warning/error 0건
```

- [ ] **Step 5: reference와 구현을 같은 비교 이미지에서 점검한다**

ReUI Gallery reference와 CampusLog 구현을 같은 desktop viewport와 selected 상태로 나란히 배치해 다음을 확인한다.

```text
- 업로드 hero의 중앙 정렬과 계층
- Gallery header, 전체 용량, 전체 삭제 배치
- 정사각형 tile, overlay action, 하단 metadata
- CampusLog의 차콜·따뜻한 흰색·라운드·간격 유지
```

P0/P1/P2 차이가 있으면 Task 2 파일만 수정하고 Step 1부터 다시 확인한다.

- [ ] **Step 6: 전체 자동 회귀를 실행한다**

Run:

```bash
cd web
tests=(src/**/*.test.mjs)
node --no-warnings --test "${tests[@]}"
npm run lint
npx tsc --noEmit
```

Expected: 모든 테스트 PASS, lint/typecheck exit 0.

- [ ] **Step 7: 최종 diff를 검증한다**

Run:

```bash
git diff --check
git status --short --branch
```

Expected: whitespace error가 없고 기존 사용자 변경은 보존되어 있다.

- [ ] **Step 8: 커밋 메시지만 제안한다**

추천 커밋 메시지:

```text
style: refine recommendation image gallery
```

사용자의 별도 승인 전 `git add`, `git commit`, `git push`, PR 생성은 실행하지 않는다.
