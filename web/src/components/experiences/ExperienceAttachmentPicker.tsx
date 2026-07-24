"use client";

import Image from "next/image";
import {
  FileText,
  ImagePlus,
  Paperclip,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  EXPERIENCE_ATTACHMENT_MAX_COUNT,
  EXPERIENCE_MATERIAL_ACCEPT,
  EXPERIENCE_PHOTO_ACCEPT,
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

type SelectedAttachmentProps = {
  file: File;
  index: number;
  onRemove: () => void;
};

function SelectedAttachment({
  file,
  index,
  onRemove,
}: SelectedAttachmentProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const isPhoto = getAttachmentKind(file) === "photo";

  useEffect(() => {
    if (!isPhoto) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isPhoto]);

  return (
    <li className="attachment-picker-item">
      <span className="attachment-picker-preview" aria-hidden="true">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            width={52}
            height={52}
            unoptimized
          />
        ) : (
          <FileText />
        )}
      </span>
      <span className="attachment-picker-copy">
        <strong title={file.name}>{file.name}</strong>
        <span>{formatAttachmentSize(file.size)}</span>
      </span>
      <button
        type="button"
        className="attachment-picker-remove"
        onClick={onRemove}
        aria-label={`${index + 1}번째 선택 파일 삭제`}
        title="선택 파일 삭제"
      >
        <Trash2 aria-hidden="true" />
      </button>
    </li>
  );
}

export function ExperienceAttachmentPicker({
  existingCount,
  files,
  onFilesChange,
  disabled = false,
}: ExperienceAttachmentPickerProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const totalCount = existingCount + files.length;
  const isAtLimit = totalCount >= EXPERIENCE_ATTACHMENT_MAX_COUNT;

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

  return (
    <fieldset className="attachment-picker-fieldset">
      <legend>첨부 파일</legend>
      <div className="attachment-picker-toolbar">
        <div className="attachment-picker-actions">
          <button
            type="button"
            className="attachment-picker-button"
            onClick={() => photoInputRef.current?.click()}
            disabled={disabled || isAtLimit}
          >
            <ImagePlus aria-hidden="true" />
            사진 첨부
          </button>
          <button
            type="button"
            className="attachment-picker-button"
            onClick={() => materialInputRef.current?.click()}
            disabled={disabled || isAtLimit}
          >
            <Paperclip aria-hidden="true" />
            자료 첨부
          </button>
        </div>
        <span>
          {totalCount}/{EXPERIENCE_ATTACHMENT_MAX_COUNT}
        </span>
      </div>

      <input
        ref={photoInputRef}
        className="sr-only"
        type="file"
        accept={EXPERIENCE_PHOTO_ACCEPT}
        multiple
        tabIndex={-1}
        onChange={(event) => handleFileInput(event.currentTarget)}
      />
      <input
        ref={materialInputRef}
        className="sr-only"
        type="file"
        accept={EXPERIENCE_MATERIAL_ACCEPT}
        multiple
        tabIndex={-1}
        onChange={(event) => handleFileInput(event.currentTarget)}
      />

      <p className="attachment-picker-help">
        JPG, PNG, WebP 사진과 PDF 자료를 파일당 5MB까지 저장할 수 있어요.
        첨부 내용은 AI 분석에는 사용되지 않아요.
      </p>

      {files.length > 0 ? (
        <ul className="attachment-picker-list">
          {files.map((file, index) => (
            <SelectedAttachment
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              file={file}
              index={index}
              onRemove={() => removeFile(index)}
            />
          ))}
        </ul>
      ) : null}

      {disabled ? (
        <p className="attachment-picker-status">
          첨부 파일 정보를 불러오는 중이거나 로그인 저장소를 사용할 수 없어요.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="attachment-picker-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}
