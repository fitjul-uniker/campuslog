"use client";

import type { RefObject } from "react";

import { ActivityCreateForm } from "@/components/activities/ActivityCreateForm";

type ActivityCreateScreenProps = {
  onCancel: () => void;
  onSavingChange: (isSaving: boolean) => void;
  titleInputRef: RefObject<HTMLInputElement | null>;
};

export function ActivityCreateScreen({
  onCancel,
  onSavingChange,
  titleInputRef,
}: ActivityCreateScreenProps) {
  return (
    <div className="activity-create-expanded-layout">
      <section
        className="activity-create-expanded-card"
        aria-labelledby="activity-create-expanded-heading"
      >
        <header>
          <h2 id="activity-create-expanded-heading">
            어떤 활동을 기록할까요?
          </h2>
        </header>
        <ActivityCreateForm
          onCancel={onCancel}
          onSavingChange={onSavingChange}
          titleInputRef={titleInputRef}
          variant="expanded"
        />
      </section>
    </div>
  );
}
