import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardKpis } from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";
import type { DashboardKpi } from "@/types/dashboard";

function TrendIndicator({ kpi }: { kpi: DashboardKpi }) {
  const Icon =
    kpi.trendDirection === "up"
      ? ArrowUpRight
      : kpi.trendDirection === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        kpi.trendDirection === "up" && "text-emerald-600 dark:text-emerald-400",
        kpi.trendDirection === "down" && "text-amber-600 dark:text-amber-400",
        kpi.trendDirection === "neutral" && "text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" />
      {kpi.trend}
    </span>
  );
}

function KpiCardContent({ kpi }: { kpi: DashboardKpi }) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300",
        kpi.href && "hover:border-border hover:shadow-md cursor-pointer"
      )}
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
        <p className="text-2xl font-semibold tracking-tight">{kpi.value}</p>
        <TrendIndicator kpi={kpi} />
      </div>
    </div>
  );
}

export function DashboardKpiCards() {
  const kpis = getDashboardKpis();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) =>
        kpi.href ? (
          <Link
            key={kpi.id}
            to={kpi.href}
            state={kpi.tab ? { tab: kpi.tab } : undefined}
            className="block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
          >
            <KpiCardContent kpi={kpi} />
          </Link>
        ) : (
          <div key={kpi.id}>
            <KpiCardContent kpi={kpi} />
          </div>
        )
      )}
    </div>
  );
}
