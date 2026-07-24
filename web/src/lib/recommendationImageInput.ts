export const RECOMMENDATION_IMAGE_MAX_COUNT = 3;
export const RECOMMENDATION_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const RECOMMENDATION_IMAGE_PREPARED_MAX_BYTES = 750 * 1024;
export const RECOMMENDATION_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp";

const MAX_RECOMMENDATION_IMAGE_NAME_LENGTH = 200;
const ALLOWED_RECOMMENDATION_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type RecommendationImageFileCandidate = {
  name: string;
  type: string;
  size: number;
};

type RecommendationClipboardItem = {
  kind: string;
  getAsFile: () => File | null;
};

export type RecommendationOpenAiContent =
  | {
      type: "input_text";
      text: string;
    }
  | {
      type: "input_image";
      image_url: string;
      detail: "high";
    };

export function getRecommendationClipboardImages(
  items: readonly RecommendationClipboardItem[],
): File[] {
  return items
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file?.type.startsWith("image/")));
}

export function validateRecommendationImageSelection<
  FileCandidate extends RecommendationImageFileCandidate,
>(
  existingCount: number,
  files: FileCandidate[],
): { accepted: FileCandidate[]; error: string } {
  if (existingCount + files.length > RECOMMENDATION_IMAGE_MAX_COUNT) {
    return {
      accepted: [],
      error: `이미지는 최대 ${RECOMMENDATION_IMAGE_MAX_COUNT}장까지 첨부할 수 있어요.`,
    };
  }

  if (files.some((file) => !ALLOWED_RECOMMENDATION_IMAGE_TYPES.has(file.type))) {
    return {
      accepted: [],
      error: "JPG, PNG 또는 WebP 이미지만 첨부할 수 있어요.",
    };
  }

  if (files.some((file) => file.size <= 0)) {
    return {
      accepted: [],
      error: "내용이 없는 빈 이미지는 첨부할 수 없어요.",
    };
  }

  if (files.some((file) => file.size > RECOMMENDATION_IMAGE_MAX_BYTES)) {
    return {
      accepted: [],
      error: "이미지 하나의 크기는 5MB 이하여야 해요.",
    };
  }

  return {
    accepted: files,
    error: "",
  };
}

function getBase64ByteLength(base64: string): number {
  const paddingLength = base64.endsWith("==")
    ? 2
    : base64.endsWith("=")
      ? 1
      : 0;

  return Math.floor((base64.length * 3) / 4) - paddingLength;
}

function parseRecommendationImageInput(
  value: unknown,
): RecommendationImageInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.name !== "string" ||
    !candidate.name.trim() ||
    candidate.name.length > MAX_RECOMMENDATION_IMAGE_NAME_LENGTH ||
    typeof candidate.mediaType !== "string" ||
    !ALLOWED_RECOMMENDATION_IMAGE_TYPES.has(candidate.mediaType) ||
    typeof candidate.dataUrl !== "string"
  ) {
    return null;
  }

  const dataUrlMatch = candidate.dataUrl.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/,
  );

  if (
    !dataUrlMatch ||
    dataUrlMatch[1] !== candidate.mediaType ||
    dataUrlMatch[2].length % 4 !== 0 ||
    getBase64ByteLength(dataUrlMatch[2]) >
      RECOMMENDATION_IMAGE_PREPARED_MAX_BYTES
  ) {
    return null;
  }

  return {
    name: candidate.name.trim(),
    mediaType: candidate.mediaType as RecommendationImageInput["mediaType"],
    dataUrl: candidate.dataUrl,
  };
}

export function parseRecommendationImageInputs(
  value: unknown,
): RecommendationImageInput[] | null {
  if (value === undefined) {
    return [];
  }

  if (
    !Array.isArray(value) ||
    value.length > RECOMMENDATION_IMAGE_MAX_COUNT
  ) {
    return null;
  }

  const images = value.map(parseRecommendationImageInput);

  return images.every(
    (image): image is RecommendationImageInput => image !== null,
  )
    ? images
    : null;
}

export function createRecommendationOpenAiContent(
  text: string,
  images: RecommendationImageInput[],
): RecommendationOpenAiContent[] {
  return [
    {
      type: "input_text",
      text,
    },
    ...images.map(
      (image): RecommendationOpenAiContent => ({
        type: "input_image",
        image_url: image.dataUrl,
        detail: "high",
      }),
    ),
  ];
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 32_768;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }

  return btoa(binary);
}

async function blobToRecommendationImage(
  blob: Blob,
  name: string,
): Promise<RecommendationImageInput> {
  const mediaType = blob.type as RecommendationImageInput["mediaType"];
  const bytes = new Uint8Array(await blob.arrayBuffer());

  return {
    name,
    mediaType,
    dataUrl: `data:${mediaType};base64,${bytesToBase64(bytes)}`,
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("이미지를 변환하지 못했습니다."));
        }
      },
      "image/webp",
      quality,
    );
  });
}

async function compressRecommendationImage(file: File): Promise<Blob> {
  if (
    typeof createImageBitmap !== "function" ||
    typeof document === "undefined"
  ) {
    throw new Error("이 브라우저에서는 이미지 크기를 줄일 수 없습니다.");
  }

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const attempts = [
    { maxDimension: 2_400, quality: 0.9 },
    { maxDimension: 2_100, quality: 0.84 },
    { maxDimension: 1_800, quality: 0.78 },
    { maxDimension: 1_600, quality: 0.72 },
  ];

  try {
    let lastBlob: Blob | null = null;

    for (const attempt of attempts) {
      const scale = Math.min(
        1,
        attempt.maxDimension / Math.max(bitmap.width, bitmap.height),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("이미지 처리 화면을 준비하지 못했습니다.");
      }

      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      lastBlob = await canvasToBlob(canvas, attempt.quality);

      if (lastBlob.size <= RECOMMENDATION_IMAGE_PREPARED_MAX_BYTES) {
        return lastBlob;
      }
    }

    if (lastBlob && lastBlob.size <= RECOMMENDATION_IMAGE_PREPARED_MAX_BYTES) {
      return lastBlob;
    }
  } finally {
    bitmap.close();
  }

  throw new Error("이미지를 전송 가능한 크기로 줄이지 못했습니다.");
}

export async function prepareRecommendationImage(
  file: File,
): Promise<RecommendationImageInput> {
  if (file.size <= RECOMMENDATION_IMAGE_PREPARED_MAX_BYTES) {
    return blobToRecommendationImage(file, file.name);
  }

  const compressedImage = await compressRecommendationImage(file);
  return blobToRecommendationImage(compressedImage, file.name);
}
import type { RecommendationImageInput } from "@/lib/types";

export type { RecommendationImageInput } from "@/lib/types";
