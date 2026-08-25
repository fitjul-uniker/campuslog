"use client";

import {
  CircleAlert,
  FileText,
  Images,
  Trash2,
  Upload,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";

import {
  EXPERIENCE_ATTACHMENT_ACCEPT,
  EXPERIENCE_ATTACHMENT_MAX_COUNT,
  formatAttachmentSize,
  getAttachmentKind,
  validateAttachmentSelection,
} from "@/lib/experienceAttachments";

type ExperienceAttachmentPickerProps = {
  existingCount: number;
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
};

function getFileTypeLabel(file: File): string {
  return getAttachmentKind(file) === "photo" ? "이미지" : "PDF";
}

export function ExperienceAttachmentPicker({
  existingCount,
  files,
  onFilesChange,
  disabled = false,
}: ExperienceAttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const totalCount = existingCount + files.length;
  const isAtLimit = totalCount >= EXPERIENCE_ATTACHMENT_MAX_COUNT;
  const isDropDisabled = disabled || isAtLimit;

  useEffect(() => {
    if (!isDropDisabled) {
      return;
    }

    dragDepthRef.current = 0;
    setIsDragging(false);
  }, [isDropDisabled]);

  function addFiles(incomingFiles: File[]) {
    const validation = validateAttachmentSelection(totalCount, incomingFiles);

    if (validation.error) {
      setErrorMessage(validation.error);
      return;
    }

    setErrorMessage("");
    onFilesChange([...files, ...validation.accepted]);
  }

  function handleFileInput(input: HTMLInputElement) {
    addFiles(Array.from(input.files ?? []));
    input.value = "";
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
    setErrorMessage("");
  }

  function clearFiles() {
    setErrorMessage("");
    onFilesChange([]);
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isDropDisabled) {
      return;
    }

    dragDepthRef.current += 1;
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isDropDisabled) {
      return;
    }

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = isDropDisabled ? "none" : "copy";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);

    if (isDropDisabled) {
      return;
    }

    addFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <fieldset className="experience-attachment-fieldset liquid-section">
      <legend className="experience-attachment-legend">첨부 파일</legend>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={EXPERIENCE_ATTACHMENT_ACCEPT}
        multiple
        tabIndex={-1}
        disabled={isDropDisabled}
        onChange={(event) => handleFileInput(event.currentTarget)}
      />

      <div
        className="experience-attachment-dropzone"
        data-dragging={isDragging ? "true" : "false"}
        data-disabled={isDropDisabled ? "true" : "false"}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <span className="experience-attachment-upload-icon" aria-hidden="true">
          <Upload />
        </span>
        <div className="experience-attachment-upload-copy">
          <h3>사진 또는 파일을 추가하세요</h3>
          <p>여기에 파일을 끌어다 놓거나 선택해 주세요.</p>
          <span>JPG, PNG, WebP, PDF · 최대 3개 · 파일당 5MB 이하</span>
          <span>첨부 파일은 AI 분석에는 사용되지 않아요.</span>
        </div>
        <button
          type="button"
          className="experience-attachment-select"
          onClick={() => inputRef.current?.click()}
          disabled={isDropDisabled}
        >
          파일 선택
        </button>
      </div>

      {files.length > 0 ? (
        <section className="experience-attachment-table-section">
          <div className="experience-attachment-table-heading">
            <div>
              <h3>선택한 파일</h3>
              <span>
                {totalCount}/{EXPERIENCE_ATTACHMENT_MAX_COUNT}
              </span>
            </div>
            <div className="experience-attachment-table-actions">
              <button
                type="button"
                className="liquid-capsule experience-attachment-clear-button"
                onClick={clearFiles}
                disabled={disabled}
              >
                <Trash2 aria-hidden="true" />
                전체 삭제
              </button>
            </div>
          </div>

          <div className="experience-attachment-table-shell">
            <table className="experience-attachment-table">
              <thead>
                <tr>
                  <th scope="col">파일</th>
                  <th scope="col" className="experience-attachment-type-column">
                    형식
                  </th>
                  <th scope="col" className="experience-attachment-size-column">
                    용량
                  </th>
                  <th scope="col" className="experience-attachment-action-column">
                    <span className="sr-only">관리</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => {
                  const isPhoto = getAttachmentKind(file) === "photo";

                  return (
                    <tr
                      key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                    >
                      <td>
                        <div className="experience-attachment-file-cell">
                          <span aria-hidden="true">
                            {isPhoto ? <Images /> : <FileText />}
                          </span>
                          <div>
                            <strong title={file.name}>{file.name}</strong>
                            <small>
                              {getFileTypeLabel(file)} ·{" "}
                              {formatAttachmentSize(file.size)}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="experience-attachment-type-column">
                        <span className="experience-attachment-type-badge">
                          {getFileTypeLabel(file)}
                        </span>
                      </td>
                      <td className="experience-attachment-size-column">
                        {formatAttachmentSize(file.size)}
                      </td>
                      <td className="experience-attachment-action-column">
                        <button
                          type="button"
                          className="experience-attachment-remove-button"
                          onClick={() => removeFile(index)}
                          disabled={disabled}
                          aria-label={`${file.name} 첨부 파일 삭제`}
                          title="첨부 파일 삭제"
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {disabled && files.length === 0 ? (
        <p className="experience-attachment-status" role="status">
          첨부 파일을 지금 추가할 수 없어요.
        </p>
      ) : null}

      {errorMessage ? (
        <div className="recommendation-image-error" role="alert">
          <CircleAlert aria-hidden="true" />
          <span>
            <strong>파일을 추가하지 못했어요</strong>
            <span>{errorMessage}</span>
          </span>
        </div>
      ) : null}
    </fieldset>
  );
}
