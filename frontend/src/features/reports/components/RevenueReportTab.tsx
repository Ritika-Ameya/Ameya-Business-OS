import {
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { StatCard } from "@/shared/components/PageHeader";
import { RevenueReportTable } from "@/features/reports/components/RevenueReportTable";
import { reportsApi } from "@/features/reports/api/reports.api";
import {
  formatRevenueReportStats,
  mapReportInvoice,
} from "@/features/reports/api/reports.mappers";
import { useReportQuery } from "@/features/reports/hooks/use-report-query";
import type { ReportFilters } from "@/features/reports/types/reports";

interface RevenueReportTabProps {
  filters: ReportFilters;
}

export function RevenueReportTab({ filters }: RevenueReportTabProps) {
  const fetcher = useCallback(
    (nextFilters: ReportFilters) => reportsApi.getRevenue(nextFilters),
    []
  );
  const { data, loading, error } = useReportQuery(filters, fetcher);

  const invoices = useMemo(
    () => (data?.items ?? []).map(mapReportInvoice),
    [data]
  );
  const stats = useMemo(
    () =>
      data
        ? formatRevenueReportStats(data.stats)
        : {
            totalRevenue: "—",
            collected: "—",
            outstanding: "—",
            averageInvoiceValue: "—",
          },
    [data]
  );

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {loading && !data && (
        <p className="text-sm text-muted-foreground">Loading revenue report…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={stats.totalRevenue}
          icon={<TrendingUp className="size-5 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-500/10"
        />
        <StatCard
          label="Collected"
          value={stats.collected}
          icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
        />
        <StatCard
          label="Outstanding"
          value={stats.outstanding}
          icon={<IndianRupee className="size-5 text-amber-600 dark:text-amber-400" />}
          accent="bg-amber-500/10"
        />
        <StatCard
          label="Average Invoice Value"
          value={stats.averageInvoiceValue}
          icon={<AlertCircle className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
        />
      </div>

      <RevenueReportTable invoices={invoices} />
    </div>
  );
}
