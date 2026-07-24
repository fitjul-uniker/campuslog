"use client";

import { Sparkles } from "lucide-react";
import type { ClipboardEvent, FormEvent } from "react";
import { useState } from "react";

import { RecommendationImagePicker } from "@/components/ai/RecommendationImagePicker";
import { AnimatedGradientActionButton } from "@/components/ui/AnimatedGradientActionButton";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field } from "@/components/ui/field";
import {
  ACTIVE_RECOMMENDATION_PURPOSES,
  getRecommendationPurposeConfig,
} from "@/lib/recommendationPurposeConfig";
import {
  getRecommendationClipboardImages,
  prepareRecommendationImage,
  type RecommendationImageInput,
  validateRecommendationImageSelection,
} from "@/lib/recommendationImageInput";
import type { RecommendationPurpose } from "@/lib/types";

type RecommendationFormInput = {
  purpose: RecommendationPurpose;
  prompt: string;
  images: RecommendationImageInput[];
};

type RecommendationFormProps = {
  isLoading: boolean;
  onSubmit: (input: RecommendationFormInput) => void;
};

const PURPOSE_OPTIONS = ACTIVE_RECOMMENDATION_PURPOSES.map((purpose) => {
  const config = getRecommendationPurposeConfig(purpose);

  return {
    value: purpose,
    label: config.label,
    inputLabel: config.inputLabel,
    description: config.description,
  };
});

export function RecommendationForm({
  isLoading,
  onSubmit,
}: RecommendationFormProps) {
  const [purpose, setPurpose] =
    useState<RecommendationPurpose>("cover_letter");
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isPreparingImages, setIsPreparingImages] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isInputDisabled = isLoading || isPreparingImages;
  const selectedPurpose =
    PURPOSE_OPTIONS.find((option) => option.value === purpose) ??
    PURPOSE_OPTIONS[0];
  const selectedConfig = getRecommendationPurposeConfig(purpose);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim() && images.length === 0) {
      setErrorMessage("추천받을 내용을 입력하거나 이미지를 첨부해 주세요.");
      return;
    }

    setErrorMessage("");
    setIsPreparingImages(true);

    try {
      const preparedImages = await Promise.all(
        images.map(prepareRecommendationImage),
      );

      onSubmit({
        purpose,
        prompt: prompt.trim(),
        images: preparedImages,
      });
    } catch {
      setErrorMessage(
        "이미지를 준비하지 못했어요. 더 선명한 이미지나 직접 입력을 사용해 주세요.",
      );
    } finally {
      setIsPreparingImages(false);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLFormElement>) {
    if (isInputDisabled) {
      return;
    }

    const clipboardImages = getRecommendationClipboardImages(
      Array.from(event.clipboardData.items),
    );

    if (clipboardImages.length === 0) {
      return;
    }

    event.preventDefault();

    const validation = validateRecommendationImageSelection(
      images.length,
      clipboardImages,
    );

    if (validation.error) {
      setErrorMessage(validation.error);
      return;
    }

    setImages([...images, ...validation.accepted]);
    setErrorMessage("");
  }

  return (
    <form
      className="experience-form"
      onSubmit={handleSubmit}
      onPaste={handlePaste}
      noValidate
    >
      <Field className="recommendation-purpose-field">
        <label id="recommendation-purpose-label">활용 목적</label>
        <Combobox
          items={PURPOSE_OPTIONS}
          filter={null}
          value={selectedPurpose}
          inputValue={selectedPurpose.inputLabel}
          onInputValueChange={() => undefined}
          onValueChange={(option) => {
            if (option) {
              setPurpose(option.value);
              setErrorMessage("");
            }
          }}
        >
          <ComboboxInput
            id="recommendation-purpose"
            name="purpose"
            readOnly
            triggerAriaLabel="활용 목적 목록 열기"
            aria-labelledby="recommendation-purpose-label"
            disabled={isInputDisabled}
          />
          <ComboboxContent>
            <ComboboxList>
              {(option: (typeof PURPOSE_OPTIONS)[number]) => (
                <ComboboxItem key={option.value} value={option}>
                  <span>{option.label}</span>
                  {option.value === "jd" ? (
                    <span className="recommendation-purpose-option-subtitle">
                      Job Description
                    </span>
                  ) : null}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>

      <div className="form-field">
        <label htmlFor="recommendation-prompt">
          {selectedConfig.promptTitle}
        </label>
        <textarea
          id="recommendation-prompt"
          name="prompt"
          rows={7}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          aria-invalid={Boolean(errorMessage && !prompt.trim())}
          disabled={isInputDisabled}
          placeholder={selectedConfig.placeholder}
        />
        <p className="period-help">
          {selectedConfig.promptDescription}
        </p>
      </div>

      <RecommendationImagePicker
        files={images}
        onFilesChange={(nextImages) => {
          setImages(nextImages);
          setErrorMessage("");
        }}
        disabled={isInputDisabled}
      />

      <div
        className="recommendation-example-list"
        aria-label={`${selectedConfig.label} 예시 문항`}
      >
        {selectedConfig.examples.map((example) => {
          const label = typeof example === "string" ? example : example.label;
          const input = typeof example === "string" ? example : example.input;

          return (
            <button
              key={label}
              type="button"
              disabled={isInputDisabled}
              onClick={() => {
                setPrompt(input);
                setErrorMessage("");
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {errorMessage ? (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="panel-actions">
        <AnimatedGradientActionButton
          className="recommendation-analysis-request"
          type="submit"
          disabled={isInputDisabled}
          aria-busy={isInputDisabled}
          icon={<Sparkles />}
        >
          {isPreparingImages
            ? "이미지 준비 중..."
            : isLoading
              ? "AI 분석 중..."
              : "AI 분석"}
        </AnimatedGradientActionButton>
      </div>
    </form>
  );
}
