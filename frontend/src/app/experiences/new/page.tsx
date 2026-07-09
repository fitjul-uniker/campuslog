import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewExperiencePage() {
  return (
    <div className="page-stack page-stack-narrow">
      <section className="page-header">
        <div>
          <p className="eyebrow">활동 경험 작성</p>
          <h1>새 경험 기록</h1>
          <p className="page-description">
            제목, 기간, 역할, 내용, 성과, 관련 링크를 입력하는 화면입니다.
          </p>
        </div>
      </section>

      <section className="placeholder-panel" aria-labelledby="new-form-title">
        <h2 id="new-form-title">작성 폼 자리</h2>
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
          <div className="field-preview field-preview-tall">
            <span>성과</span>
            <div />
          </div>
        </div>
        <div className="panel-actions">
          <button className="button button-primary" type="button" disabled>
            <Save className="button-icon" aria-hidden="true" />
            저장
          </button>
          <Link href="/" className="button button-secondary">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            대시보드로 돌아가기
          </Link>
        </div>
      </section>
    </div>
  );
}
