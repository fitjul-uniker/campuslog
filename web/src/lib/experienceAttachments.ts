export const EXPERIENCE_ATTACHMENTS_BUCKET = "experience-attachments";
export const EXPERIENCE_ATTACHMENT_MAX_COUNT = 3;
export const EXPERIENCE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const EXPERIENCE_PHOTO_ACCEPT =
  "image/jpeg,image/png,image/webp";
export const EXPERIENCE_MATERIAL_ACCEPT = "application/pdf";

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export type AttachmentFileCandidate = {
  name: string;
  type: string;
  size: number;
};

export function getAttachmentKind(
  file: AttachmentFileCandidate,
): "photo" | "material" | null {
  if (
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp"
  ) {
    return "photo";
  }

  return file.type === "application/pdf" ? "material" : null;
}

export function validateAttachmentSelection<
  FileCandidate extends AttachmentFileCandidate,
>(
  existingCount: number,
  files: FileCandidate[],
): { accepted: FileCandidate[]; error: string } {
  if (existingCount + files.length > EXPERIENCE_ATTACHMENT_MAX_COUNT) {
    return {
      accepted: [],
      error: `첨부 파일은 경험당 최대 ${EXPERIENCE_ATTACHMENT_MAX_COUNT}개까지 저장할 수 있어요.`,
    };
  }

  const unsupportedFile = files.find(
    (file) => !ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type),
  );

  if (unsupportedFile) {
    return {
      accepted: [],
      error: "JPG, PNG, WebP 또는 PDF 파일만 첨부할 수 있어요.",
    };
  }

  const emptyFile = files.find((file) => file.size <= 0);

  if (emptyFile) {
    return {
      accepted: [],
      error: "내용이 없는 빈 파일은 첨부할 수 없어요.",
    };
  }

  const oversizedFile = files.find(
    (file) => file.size > EXPERIENCE_ATTACHMENT_MAX_BYTES,
  );

  if (oversizedFile) {
    return {
      accepted: [],
      error: "파일 하나의 크기는 5MB 이하여야 해요.",
    };
  }

  return {
    accepted: files,
    error: "",
  };
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  const megabytes = bytes / (1024 * 1024);
  const formattedMegabytes = Number.isInteger(megabytes)
    ? megabytes.toFixed(0)
    : megabytes.toFixed(1);

  return `${formattedMegabytes} MB`;
}

export function getStorageFileExtension(file: AttachmentFileCandidate): string {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return "";
  }
}
