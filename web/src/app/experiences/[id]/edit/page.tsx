import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

type EditExperiencePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditExperiencePage({
  params,
}: EditExperiencePageProps) {
  const { id } = await params;

  return (
    <div className="page-stack page-stack-narrow">
      <section className="page-header">
        <div>
          <p className="eyebrow">활동 경험 수정</p>
          <h1>경험 수정</h1>
          <p className="page-description">
            기존 경험 데이터를 불러와 편집하는 화면입니다.
          </p>
        </div>
      </section>

      <section className="placeholder-panel" aria-labelledby="edit-form-title">
        <div className="panel-heading">
          <div>
            <span className="route-chip">ID: {id}</span>
            <h2 id="edit-form-title">수정 폼 자리</h2>
          </div>
        </div>
        <div className="form-preview" aria-hidden="true">
          <div className="field-preview">
            <span>제목</span>
            <div />
          </div>
          <div className="field-grid">
            <div className="field-preview">
              <span>기간</span>
              <div />
            </div>
            <div className="field-preview">
              <span>역할</span>
              <div />
            </div>
          </div>
          <div className="field-preview field-preview-tall">
            <span>내용</span>
            <div />
          </div>
        </div>
        <div className="panel-actions">
          <button className="button button-primary" type="button" disabled>
            <Save className="button-icon" aria-hidden="true" />
            저장
          </button>
          <Link href={`/experiences/${id}`} className="button button-secondary">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            상세로 돌아가기
          </Link>
        </div>
      </section>
    </div>
  );
}
