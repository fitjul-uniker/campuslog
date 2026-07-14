"use client";

import { Sparkles } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import type { RecommendationPurpose } from "@/lib/types";

type RecommendationFormInput = {
  purpose: RecommendationPurpose;
  prompt: string;
};

type RecommendationFormProps = {
  isLoading: boolean;
  onSubmit: (input: RecommendationFormInput) => void;
};

const PURPOSE_OPTIONS: Array<{
  value: RecommendationPurpose;
  label: string;
}> = [
  { value: "cover_letter", label: "자기소개서" },
  { value: "portfolio", label: "포트폴리오" },
  { value: "interview", label: "면접" },
  { value: "activity_application", label: "대외활동/지원서" },
  { value: "other", label: "기타" },
];

export function RecommendationForm({
  isLoading,
  onSubmit,
}: RecommendationFormProps) {
  const [purpose, setPurpose] =
    useState<RecommendationPurpose>("cover_letter");
  const [prompt, setPrompt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim()) {
      setErrorMessage("추천받고 싶은 질문이나 활용 목적을 입력해주세요.");
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
      <div className="form-field">
        <label htmlFor="recommendation-purpose">활용 목적</label>
        <select
          id="recommendation-purpose"
          name="purpose"
          value={purpose}
          onChange={(event) =>
            setPurpose(event.target.value as RecommendationPurpose)
          }
          disabled={isLoading}
          required
        >
          {PURPOSE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="recommendation-prompt">질문 / 문항</label>
        <textarea
          id="recommendation-prompt"
          name="prompt"
          rows={7}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          aria-invalid={Boolean(errorMessage && !prompt.trim())}
          disabled={isLoading}
          placeholder="예: 문제 해결 역량을 보여주는 자기소개서 문항이나 JD 원문을 붙여넣어 주세요"
          required
        />
        <p className="period-help">
          자기소개서 문항, 면접 질문, JD, 지원서 원문을 입력하면 요구사항과
          적합한 경험 Top 3를 함께 정리합니다.
        </p>
      </div>

      {errorMessage ? (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="panel-actions">
        <button
          className="button button-primary"
          type="submit"
          disabled={isLoading}
        >
          <Sparkles className="button-icon" aria-hidden="true" />
          {isLoading ? "추천할 활동을 찾는 중..." : "AI 기반 활동 추천"}
        </button>
      </div>
    </form>
  );
}
