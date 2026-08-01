import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  IndianRupee,
  Minus,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardKpis } from "@/features/dashboard/utils/dashboard-utils";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { moduleAccents, type ModuleAccentKey } from "@/shared/constants/theme";
import { cn } from "@/shared/utils";
import type { DashboardKpi } from "@/features/dashboard/types/dashboard";

const kpiVisual: Record<
  string,
  { accent: ModuleAccentKey; icon: typeof IndianRupee }
> = {
  revenue: { accent: "revenue", icon: IndianRupee },
  collections: { accent: "collections", icon: Wallet },
  renewals: { accent: "renewals", icon: RefreshCw },
  cash: { accent: "cash", icon: Banknote },
};

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
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        kpi.trendDirection === "up" &&
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        kpi.trendDirection === "down" &&
          "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        kpi.trendDirection === "neutral" && "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" />
      {kpi.trend}
    </span>
  );
}

function KpiCardContent({ kpi }: { kpi: DashboardKpi }) {
  const visual = kpiVisual[kpi.id] ?? { accent: "dashboard" as const, icon: IndianRupee };
  const accent = moduleAccents[visual.accent];
  const Icon = visual.icon;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/70 bg-card/95 p-5 shadow-card transition-all duration-300 dark:border-white/10",
        "hover:-translate-y-1 hover:shadow-elevated",
        accent.bar,
        kpi.href && "cursor-pointer"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity group-hover:opacity-100",
          accent.glow
        )}
      />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {kpi.label}
          </p>
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10",
              accent.iconBg
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-[1.7rem]">
          {kpi.value}
        </p>
        <TrendIndicator kpi={kpi} />
      </div>
    </div>
  );
}

export function DashboardKpiCards() {
  const { summary } = useDashboard();
  const kpis = getDashboardKpis(summary);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) =>
        kpi.href ? (
          <Link
            key={kpi.id}
            to={kpi.href}
            className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
