"use client";

import Image from "next/image";
import {
  CircleAlert,
  Images,
  Plus,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";

import { getRecommendationImageSelectionSummary } from "@/components/ai/recommendationImagePresentation";
import { formatAttachmentSize } from "@/lib/experienceAttachments";
import {
  RECOMMENDATION_IMAGE_ACCEPT,
  RECOMMENDATION_IMAGE_MAX_COUNT,
  validateRecommendationImageSelection,
} from "@/lib/recommendationImageInput";

type RecommendationImagePickerProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
};

function RecommendationImagePreview({
  file,
  onPreview,
  onRemove,
  disabled,
}: {
  file: File;
  onPreview: () => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsLoaded(false);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <li className="recommendation-image-item">
      <div className="recommendation-image-preview">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={`${file.name} 미리보기`}
            width={320}
            height={320}
            sizes="(max-width: 640px) 46vw, 280px"
            unoptimized
            data-loaded={isLoaded ? "true" : "false"}
            onLoad={() => setIsLoaded(true)}
          />
        ) : (
          <span className="recommendation-image-loading" aria-hidden="true">
            <Images />
          </span>
        )}
        <div className="recommendation-image-actions">
          <button
            type="button"
            onClick={onPreview}
            disabled={disabled || !previewUrl}
            aria-label={`${file.name} 이미지 크게 보기`}
            title="이미지 크게 보기"
          >
            <ZoomIn aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`${file.name} 이미지 삭제`}
            title="이미지 삭제"
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
  );
}

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
      aria-modal="true"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
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
        ) : (
          <span className="recommendation-image-dialog-loading">
            이미지를 불러오는 중이에요.
          </span>
        )}
      </div>
    </dialog>
  );
}

export function RecommendationImagePicker({
  files,
  onFilesChange,
  disabled = false,
}: RecommendationImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<File | null>(
    null,
  );
  const isAtLimit = files.length >= RECOMMENDATION_IMAGE_MAX_COUNT;
  const isDropDisabled = disabled || isAtLimit;
  const selectionSummary = getRecommendationImageSelectionSummary(
    files,
    RECOMMENDATION_IMAGE_MAX_COUNT,
  );

  useEffect(() => {
    if (!isDropDisabled) {
      return;
    }

    dragDepthRef.current = 0;
    setIsDragging(false);
  }, [isDropDisabled]);

  function addFiles(incomingFiles: File[]) {
    const validation = validateRecommendationImageSelection(
      files.length,
      incomingFiles,
    );

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
    const fileToRemove = files[index];

    if (selectedPreviewFile === fileToRemove) {
      setSelectedPreviewFile(null);
    }

    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
    setErrorMessage("");
  }

  function clearFiles() {
    setSelectedPreviewFile(null);
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
    <fieldset className="recommendation-image-fieldset">
      <legend className="sr-only">이미지 첨부</legend>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={RECOMMENDATION_IMAGE_ACCEPT}
        multiple
        tabIndex={-1}
        disabled={isDropDisabled}
        onChange={(event) => handleFileInput(event.currentTarget)}
      />

      {files.length === 0 ? (
        <div
          className="recommendation-image-dropzone"
          data-dragging={isDragging ? "true" : "false"}
          data-disabled={disabled ? "true" : "false"}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <span
            className="recommendation-image-upload-icon"
            aria-hidden="true"
          >
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
      ) : (
        <div
          className="recommendation-image-gallery"
          data-dragging={isDragging ? "true" : "false"}
          data-disabled={isDropDisabled ? "true" : "false"}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="recommendation-image-gallery-heading">
            <div>
              <h3>첨부 이미지</h3>
              <span>
                {files.length}/{RECOMMENDATION_IMAGE_MAX_COUNT} · 총{" "}
                {formatAttachmentSize(selectionSummary.totalBytes)}
              </span>
            </div>
            <button
              type="button"
              className="recommendation-image-clear"
              onClick={clearFiles}
              disabled={disabled}
            >
              <Trash2 aria-hidden="true" />
              전체 삭제
            </button>
          </div>
          <ul className="recommendation-image-list">
            {files.map((file, index) => (
              <RecommendationImagePreview
                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                file={file}
                onPreview={() => setSelectedPreviewFile(file)}
                onRemove={() => removeFile(index)}
                disabled={disabled}
              />
            ))}
            {!isAtLimit ? (
              <li className="recommendation-image-add-item">
                <button
                  type="button"
                  className="recommendation-image-add-tile"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled}
                >
                  <span aria-hidden="true">
                    <Plus />
                  </span>
                  <strong>이미지 추가</strong>
                  <small>
                    {files.length}/{RECOMMENDATION_IMAGE_MAX_COUNT}
                  </small>
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      )}

      {errorMessage ? (
        <div className="recommendation-image-error" role="alert">
          <CircleAlert aria-hidden="true" />
          <span>
            <strong>이미지를 추가하지 못했어요</strong>
            <span>{errorMessage}</span>
          </span>
        </div>
      ) : null}

      <RecommendationImageDialog
        file={selectedPreviewFile}
        onClose={() => setSelectedPreviewFile(null)}
      />
    </fieldset>
  );
}
