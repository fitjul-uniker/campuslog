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
import { isDevelopmentUiPreview } from "@/lib/supabase/env";
import type { ExperienceFormInput } from "@/lib/types";

export function NewExperienceClient() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [attachmentsEnabled] = useState(
    () =>
      getCampusLogRepository().source === "supabase" ||
      isDevelopmentUiPreview(),
  );

  async function handleSubmit(
    input: ExperienceFormInput,
    attachmentFiles: File[],
  ) {
    setErrorMessage("");
    const repository = getCampusLogRepository();
    const createdExperience = await repository.experiences.create(input);

    if (!createdExperience) {
      setErrorMessage("경험을 저장하지 못했습니다. 입력값을 다시 확인해주세요.");
      return;
    }

    if (attachmentFiles.length > 0) {
      try {
        await repository.attachments.upload(
          createdExperience.id,
          attachmentFiles,
        );
      } catch {
        try {
          await repository.experiences.delete(createdExperience.id);
        } catch {
          // The original upload error is more useful to the user.
        }
        throw new Error(
          "첨부 파일을 저장하지 못해 경험 저장을 취소했어요. 잠시 후 다시 시도해 주세요.",
        );
      }
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
            활동 내용과 성과, 관련 자료를 한곳에 기록합니다.
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
          attachmentsEnabled={attachmentsEnabled}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
