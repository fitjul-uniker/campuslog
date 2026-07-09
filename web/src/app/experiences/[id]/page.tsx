import Link from "next/link";
import { ArrowLeft, BarChart3, PenLine } from "lucide-react";

type ExperienceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExperienceDetailPage({
  params,
}: ExperienceDetailPageProps) {
  const { id } = await params;

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">활동 경험 상세</p>
          <h1>경험 상세</h1>
          <p className="page-description">
            저장된 경험의 원본 내용과 분석 상태를 확인하는 화면입니다.
          </p>
        </div>
      </section>

      <section className="placeholder-panel" aria-labelledby="detail-title">
        <div className="panel-heading">
          <div>
            <span className="route-chip">ID: {id}</span>
            <h2 id="detail-title">활동 경험 상세 자리</h2>
          </div>
          <span className="status-badge">미분석</span>
        </div>
        <div className="detail-preview" aria-hidden="true">
          <div />
          <div />
          <div />
          <div />
        </div>
        <div className="panel-actions">
          <Link href={`/experiences/${id}/edit`} className="button button-primary">
            <PenLine className="button-icon" aria-hidden="true" />
            수정 화면
          </Link>
          <Link
            href={`/experiences/${id}/analysis`}
            className="button button-secondary"
          >
            <BarChart3 className="button-icon" aria-hidden="true" />
            분석 결과
          </Link>
          <Link href="/" className="button button-ghost">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            대시보드
          </Link>
        </div>
      </section>
    </div>
  );
}
