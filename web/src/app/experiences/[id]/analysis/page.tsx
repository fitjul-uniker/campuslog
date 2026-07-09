import Link from "next/link";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";

type ExperienceAnalysisPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExperienceAnalysisPage({
  params,
}: ExperienceAnalysisPageProps) {
  const { id } = await params;

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">AI 경험 분석 결과</p>
          <h1>분석 결과</h1>
          <p className="page-description">
            특정 활동 경험에 연결된 요약, 역량 태그, 키워드를 확인하는
            화면입니다.
          </p>
        </div>
      </section>

      <section className="placeholder-panel" aria-labelledby="analysis-title">
        <div className="panel-heading">
          <div>
            <span className="route-chip">ID: {id}</span>
            <h2 id="analysis-title">분석 결과 자리</h2>
          </div>
          <span className="status-badge">결과 없음</span>
        </div>

        <div className="analysis-preview" aria-hidden="true">
          <div className="summary-line" />
          <div className="tag-row">
            <span />
            <span />
            <span />
          </div>
          <div className="detail-preview">
            <div />
            <div />
            <div />
          </div>
        </div>

        <div className="panel-actions">
          <button className="button button-primary" type="button" disabled>
            <RotateCcw className="button-icon" aria-hidden="true" />
            다시 분석
          </button>
          <Link href={`/experiences/${id}`} className="button button-secondary">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            상세로 돌아가기
          </Link>
          <Link href="/recommend" className="button button-ghost">
            <Sparkles className="button-icon" aria-hidden="true" />
            AI 추천
          </Link>
        </div>
      </section>
    </div>
  );
}
