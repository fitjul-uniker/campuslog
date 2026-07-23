"use client";

import { Sparkles } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

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
import type { RecommendationPurpose } from "@/lib/types";

type RecommendationFormInput = {
  purpose: RecommendationPurpose;
  prompt: string;
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
  const [errorMessage, setErrorMessage] = useState("");
  const selectedPurpose =
    PURPOSE_OPTIONS.find((option) => option.value === purpose) ??
    PURPOSE_OPTIONS[0];
  const selectedConfig = getRecommendationPurposeConfig(purpose);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim()) {
      setErrorMessage("추천받을 내용을 입력해 주세요.");
      return;
    }

    setErrorMessage("");
    onSubmit({
      purpose,
      prompt: prompt.trim(),
    });
  }

  return (
    <form className="experience-form" onSubmit={handleSubmit} noValidate>
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
            disabled={isLoading}
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
          disabled={isLoading}
          placeholder={selectedConfig.placeholder}
          required
        />
        <p className="period-help">
          {selectedConfig.promptDescription}
        </p>
      </div>

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
              disabled={isLoading}
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
          disabled={isLoading}
          aria-busy={isLoading}
          icon={<Sparkles />}
        >
          {isLoading ? "AI 분석 중..." : "AI 분석"}
        </AnimatedGradientActionButton>
      </div>
    </form>
  );
}
