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
import type { Experience, ExperienceFormInput } from "@/lib/types";

type EditExperienceClientProps = {
  id: string;
};

export function EditExperienceClient({ id }: EditExperienceClientProps) {
  const router = useRouter();
  const [experience, setExperience] = useState<Experience | null | undefined>(
    undefined,
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadExperience() {
      try {
        const repository = getCampusLogRepository();
        const storedExperience = await repository.experiences.getById(id);

        if (isMounted) {
          setExperience(storedExperience);
        }
      } catch {
        if (isMounted) {
          setExperience(null);
        }
      }
    }

    loadExperience();

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleSubmit(input: ExperienceFormInput) {
    const repository = getCampusLogRepository();
    const updatedExperience = await repository.experiences.update(id, input);

    if (!updatedExperience) {
      setErrorMessage("경험을 저장하지 못했습니다. 입력값을 다시 확인해주세요.");
      return;
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
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
