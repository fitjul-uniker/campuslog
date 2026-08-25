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
        className="activity-create-expanded-card liquid-workspace"
        aria-labelledby="activity-create-expanded-heading"
      >
        <header>
          <span className="activity-create-expanded-kicker">새 활동 추가</span>
          <h2 id="activity-create-expanded-heading">
            어떤 활동을 기록할까요?
          </h2>
          <p>
            활동의 내용과 기간을 정하면 오늘부터 기록을 차곡차곡 쌓을 수
            있어요.
          </p>
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
