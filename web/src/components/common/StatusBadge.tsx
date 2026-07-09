import type { AnalysisStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<AnalysisStatus, string> = {
  unanalyzed: "미분석",
  analyzed: "분석 완료",
  needs_reanalysis: "재분석 필요",
};

type StatusBadgeProps = {
  status: AnalysisStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn("status-badge", `status-badge-${status}`)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
