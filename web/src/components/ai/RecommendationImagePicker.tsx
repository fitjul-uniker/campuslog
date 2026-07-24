"use client";

import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <li className="recommendation-image-item">
      <span className="recommendation-image-preview" aria-hidden="true">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            width={64}
            height={64}
            unoptimized
          />
        ) : null}
      </span>
      <span className="recommendation-image-copy">
        <strong title={file.name}>{file.name}</strong>
        <span>{formatAttachmentSize(file.size)}</span>
      </span>
      <button
        type="button"
        className="recommendation-image-remove"
        onClick={onRemove}
        aria-label={`${file.name} 이미지 삭제`}
        title="이미지 삭제"
      >
        <Trash2 aria-hidden="true" />
      </button>
    </li>
  );
}

export function RecommendationImagePicker({
  files,
  onFilesChange,
  disabled = false,
}: RecommendationImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const isAtLimit = files.length >= RECOMMENDATION_IMAGE_MAX_COUNT;

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
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
    setErrorMessage("");
  }

  return (
    <fieldset className="recommendation-image-fieldset">
      <legend>이미지 첨부</legend>
      <div className="recommendation-image-toolbar">
        <button
          type="button"
          className="recommendation-image-add"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isAtLimit}
        >
          <ImagePlus aria-hidden="true" />
          이미지 첨부
        </button>
        <span>
          {files.length}/{RECOMMENDATION_IMAGE_MAX_COUNT}
        </span>
      </div>

      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={RECOMMENDATION_IMAGE_ACCEPT}
        multiple
        tabIndex={-1}
        onChange={(event) => handleFileInput(event.currentTarget)}
      />

      <p className="recommendation-image-help">
        선명한 캡쳐일수록 정확해요. 이미지를 첨부하거나 복사해 붙여넣을 수
        있어요. JPG, PNG, WebP 이미지를 최대 3장까지 사용할 수 있어요.
      </p>

      {files.length > 0 ? (
        <ul className="recommendation-image-list">
          {files.map((file, index) => (
            <RecommendationImagePreview
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              file={file}
              onRemove={() => removeFile(index)}
            />
          ))}
        </ul>
      ) : null}

      {errorMessage ? (
        <p className="recommendation-image-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}
