import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">경험 목록 대시보드</p>
          <h1>나의 경험</h1>
          <p className="page-description">
            프로젝트, 공모전, 인턴, 대외활동 경험을 한곳에서 확인하는
            시작 화면입니다.
          </p>
        </div>

        <div className="header-actions">
          <Link href="/experiences/new" className="button button-primary">
            <Plus className="button-icon" aria-hidden="true" />
            새 경험 기록
          </Link>
          <Link href="/recommend" className="button button-secondary">
            <Sparkles className="button-icon" aria-hidden="true" />
            AI 추천
          </Link>
        </div>
      </section>

      <section className="empty-state" aria-labelledby="empty-dashboard-title">
        <div className="empty-state-icon" aria-hidden="true">
          <Plus />
        </div>
        <h2 id="empty-dashboard-title">아직 기록한 활동 경험이 없습니다</h2>
        <p>
          첫 경험을 기록하면 이후 이 화면에서 최근 수정한 경험부터 확인할 수
          있습니다.
        </p>
        <div className="empty-state-actions">
          <Link href="/experiences/new" className="button button-primary">
            첫 경험 기록하기
          </Link>
          <Link href="/recommend" className="button button-ghost">
            AI 추천 화면 보기
          </Link>
        </div>
      </section>
    </div>
  );
}
