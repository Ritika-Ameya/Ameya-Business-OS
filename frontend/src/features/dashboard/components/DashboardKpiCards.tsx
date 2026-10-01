import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  IndianRupee,
  Minus,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { DashboardKpiDetailDialog } from "@/features/dashboard/components/DashboardKpiDetailDialog";
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
  received: { accent: "revenue", icon: IndianRupee },
  invoiced: { accent: "invoices", icon: FileText },
  collections: { accent: "collections", icon: Wallet },
  renewals: { accent: "renewals", icon: RefreshCw },
  renewed: { accent: "cash", icon: CheckCircle2 },
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
        "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:text-xs",
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
        "group relative flex h-full overflow-hidden rounded-2xl border border-white/70 bg-card/95 p-4 text-left shadow-card transition-all duration-300 sm:p-5 dark:border-white/10",
        "hover:-translate-y-1 hover:shadow-elevated",
        accent.bar
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity group-hover:opacity-100",
          accent.glow
        )}
      />
      <div className="relative space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
            {kpi.period ? (
              <p className="text-[11px] font-medium leading-tight text-muted-foreground">
                {kpi.period}
              </p>
            ) : null}
          </div>
          <div
            className={cn(
              "hidden size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 sm:flex dark:ring-white/10",
              accent.iconBg
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
        <p className="break-words text-lg font-bold tracking-tight tabular-nums sm:text-2xl">
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
  const [selectedKpi, setSelectedKpi] = useState<DashboardKpi | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-5">
        {kpis.map((kpi) => (
          <button
            key={kpi.id}
            type="button"
            disabled={!summary}
            aria-haspopup="dialog"
            className="block h-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default"
            onClick={() => setSelectedKpi(kpi)}
          >
            <KpiCardContent kpi={kpi} />
          </button>
        ))}
      </div>
      <DashboardKpiDetailDialog
        kpi={selectedKpi}
        summary={summary}
        onOpenChange={(open) => {
          if (!open) setSelectedKpi(null);
        }}
      />
    </>
  );
}
