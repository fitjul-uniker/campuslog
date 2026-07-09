import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function RecommendPage() {
  return (
    <div className="page-stack page-stack-narrow">
      <section className="page-header">
        <div>
          <p className="eyebrow">AI 경험 추천 및 활용</p>
          <h1>AI 추천</h1>
          <p className="page-description">
            저장된 경험 전체와 분석 결과를 바탕으로 활용할 경험을 고르는
            화면입니다.
          </p>
        </div>
      </section>

      <section className="placeholder-panel" aria-labelledby="recommend-title">
        <h2 id="recommend-title">추천 입력 자리</h2>
        <div className="form-preview" aria-hidden="true">
          <div className="field-preview">
            <span>활용 목적</span>
            <div />
          </div>
          <div className="field-preview field-preview-tall">
            <span>질문 / 문항</span>
            <div />
          </div>
          <div className="recommendation-preview">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="panel-actions">
          <button className="button button-primary" type="button" disabled>
            <Sparkles className="button-icon" aria-hidden="true" />
            추천 요청
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
