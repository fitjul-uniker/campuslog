"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ExperienceForm } from "@/components/experiences/ExperienceForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type { ExperienceFormInput } from "@/lib/types";

export function NewExperienceClient() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(input: ExperienceFormInput) {
    setErrorMessage("");
    const repository = getCampusLogRepository();
    const createdExperience = await repository.experiences.create(input);

    if (!createdExperience) {
      setErrorMessage("경험을 저장하지 못했습니다. 입력값을 다시 확인해주세요.");
      return;
    }

    router.push(`/experiences/${createdExperience.id}`);
  }

  return (
    <div className="page-stack page-stack-narrow sub-page">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="breadcrumb-brand-link">
              CampusLog
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/experiences">나의 활동</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>새 경험 기록</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="page-header sub-page-heading">
        <div>
          <h1>새 경험 기록</h1>
          <p className="page-description">
            제목, 기간, 역할, 내용, 성과와 링크별 설명을 기록합니다.
          </p>
        </div>
      </section>

      <section className="form-panel" aria-labelledby="new-form-title">
        <h2 id="new-form-title">경험 정보</h2>
        {errorMessage ? (
          <p className="form-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <ExperienceForm
          mode="create"
          cancelHref="/experiences"
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
