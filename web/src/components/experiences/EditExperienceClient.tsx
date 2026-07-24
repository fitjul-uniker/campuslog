"use client";

import { PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
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
import type { Experience, ExperienceFormInput } from "@/lib/types";

type EditExperienceClientProps = {
  id: string;
};

function hasExperienceContentChanges(
  experience: Experience,
  input: ExperienceFormInput,
): boolean {
  return (
    experience.title !== input.title.trim() ||
    experience.period !== input.period.trim() ||
    experience.role !== input.role.trim() ||
    experience.description !== input.description.trim() ||
    experience.achievements !== input.achievements.trim() ||
    JSON.stringify(experience.relatedLinks) !==
      JSON.stringify(input.relatedLinks)
  );
}

export function EditExperienceClient({ id }: EditExperienceClientProps) {
  const router = useRouter();
  const [experience, setExperience] = useState<Experience | null | undefined>(
    undefined,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [attachmentsReady, setAttachmentsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadExperience() {
      try {
        const repository = getCampusLogRepository();
        const storedExperience = await repository.experiences.getById(id);
        let storedAttachmentCount = 0;
        let canAttach =
          repository.source === "supabase" || isDevelopmentUiPreview();

        try {
          const storedAttachments =
            await repository.attachments.listByExperienceId(id);
          storedAttachmentCount = storedAttachments.length;
        } catch {
          canAttach = false;
        }

        if (isMounted) {
          setExperience(storedExperience);
          setAttachmentCount(storedAttachmentCount);
          setAttachmentsReady(canAttach);
        }
      } catch {
        if (isMounted) {
          setExperience(null);
          setAttachmentsReady(false);
        }
      }
    }

    loadExperience();

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleSubmit(
    input: ExperienceFormInput,
    attachmentFiles: File[],
  ) {
    if (!experience) {
      throw new Error("수정할 경험을 찾을 수 없어요.");
    }

    const repository = getCampusLogRepository();
    const updatedExperience = hasExperienceContentChanges(experience, input)
      ? await repository.experiences.update(id, input)
      : experience;

    if (!updatedExperience) {
      setErrorMessage("경험을 저장하지 못했습니다. 입력값을 다시 확인해주세요.");
      return;
    }

    if (attachmentFiles.length > 0) {
      try {
        await repository.attachments.upload(id, attachmentFiles);
      } catch {
        throw new Error(
          "경험 내용은 저장했지만 첨부 파일을 저장하지 못했어요. 파일을 확인한 뒤 다시 시도해 주세요.",
        );
      }
    }

    router.push(`/experiences/${updatedExperience.id}`);
  }

  if (experience === undefined) {
    return (
      <div className="page-stack page-stack-narrow">
        <section className="placeholder-panel">
          <p className="muted-text">저장된 경험을 불러오는 중입니다.</p>
        </section>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="page-stack">
        <EmptyState
          title="경험을 찾을 수 없습니다"
          description="삭제되었거나 저장소에서 불러오지 못한 경험입니다."
          icon={<PenLine />}
          primaryAction={{
            href: "/experiences",
            label: "나의 활동으로 돌아가기",
          }}
        />
      </div>
    );
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
            <BreadcrumbLink href={`/experiences/${experience.id}`}>
              경험 상세
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>경험 수정</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="page-header sub-page-heading">
        <div>
          <h1>경험 수정</h1>
          <p className="page-description">
            저장된 경험 원본 내용을 수정합니다.
          </p>
        </div>
      </section>

      <section className="form-panel" aria-labelledby="edit-form-title">
        <h2 id="edit-form-title">경험 정보</h2>
        {errorMessage ? (
          <p className="form-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <ExperienceForm
          mode="edit"
          initialValue={experience}
          cancelHref={`/experiences/${experience.id}`}
          attachmentCount={attachmentCount}
          attachmentsEnabled={attachmentsReady}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
