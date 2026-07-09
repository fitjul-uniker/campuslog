"use client";

import { useRouter } from "next/navigation";

import { ExperienceForm } from "@/components/experiences/ExperienceForm";
import { createExperience } from "@/lib/storage";
import type { ExperienceFormInput } from "@/lib/types";

export function NewExperienceClient() {
  const router = useRouter();

  function handleSubmit(input: ExperienceFormInput) {
    const createdExperience = createExperience(input);

    if (!createdExperience) {
      return;
    }

    router.push(`/experiences/${createdExperience.id}`);
  }

  return (
    <div className="page-stack page-stack-narrow">
      <section className="page-header">
        <div>
          <p className="eyebrow">활동 경험 작성</p>
          <h1>새 경험 기록</h1>
          <p className="page-description">
            제목, 기간, 역할, 내용, 성과, 관련 링크를 기록합니다.
          </p>
        </div>
      </section>

      <section className="form-panel" aria-labelledby="new-form-title">
        <h2 id="new-form-title">경험 정보</h2>
        <ExperienceForm
          mode="create"
          cancelHref="/"
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
