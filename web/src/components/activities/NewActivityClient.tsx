"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ActivityCreateForm } from "@/components/activities/ActivityCreateForm";

export function NewActivityClient() {
  return (
    <div className="activity-form-page">
      <header className="activity-form-header">
        <Link href="/dashboard" className="activity-back-link">
          <ArrowLeft aria-hidden="true" />
          오늘의 기록
        </Link>
        <div className="activity-form-heading">
          <div>
            <h1>활동 추가</h1>
            <p>활동을 만들고, 하루하루 한 일을 이어서 기록하세요.</p>
          </div>
        </div>
      </header>

      <section
        className="activity-form-surface"
        aria-labelledby="activity-form-title"
      >
        <div className="activity-form-intro">
          <h2 id="activity-form-title">활동 정보</h2>
          <p>지금 알고 있는 만큼만 적어도 괜찮아요.</p>
        </div>

        <ActivityCreateForm />
      </section>
    </div>
  );
}
