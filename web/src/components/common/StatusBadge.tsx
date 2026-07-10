import type { AnalysisStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<AnalysisStatus, { label: string; className: string }> = {
  unanalyzed: {
    label: "미분석",
    className: "status-badge-unanalyzed",
  },
  analyzed: {
    label: "분석 완료",
    className: "status-badge-analyzed",
  },
  needs_reanalysis: {
    label: "재분석 필요",
    className: "status-badge-needs_reanalysis",
  },
};

type StatusBadgeProps = {
  status?: AnalysisStatus | string | null;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config =
    status && status in STATUS_CONFIG
      ? STATUS_CONFIG[status as AnalysisStatus]
      : { label: "상태 확인 필요", className: "status-badge-unknown" };

  return (
    <span className={cn("status-badge", config.className)}>{config.label}</span>
  );
}
