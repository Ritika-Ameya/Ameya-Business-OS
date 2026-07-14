import {
  AlertCircle,
  CalendarClock,
  Clock,
  IndianRupee,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { StatCard } from "@/shared/components/PageHeader";
import { OutstandingReportTable } from "@/features/reports/components/OutstandingReportTable";
import { reportsApi } from "@/features/reports/api/reports.api";
import {
  formatOutstandingReportStats,
  mapOutstandingRow,
} from "@/features/reports/api/reports.mappers";
import { useReportQuery } from "@/features/reports/hooks/use-report-query";
import type { ReportFilters } from "@/features/reports/types/reports";

interface OutstandingReportTabProps {
  filters: ReportFilters;
}

export function OutstandingReportTab({ filters }: OutstandingReportTabProps) {
  const fetcher = useCallback(
    (nextFilters: ReportFilters) => reportsApi.getOutstanding(nextFilters),
    []
  );
  const { data, loading, error } = useReportQuery(filters, fetcher);

  const rows = useMemo(
    () => (data?.items ?? []).map(mapOutstandingRow),
    [data]
  );
  const stats = useMemo(
    () =>
      data
        ? formatOutstandingReportStats(data.stats)
        : {
            outstandingAmount: "—",
            invoicesPending: "—",
            overdueInvoices: "—",
            averageOutstanding: "—",
          },
    [data]
  );

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {loading && !data && (
        <p className="text-sm text-muted-foreground">Loading outstanding report…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Outstanding Amount"
          value={stats.outstandingAmount}
          icon={<IndianRupee className="size-5 text-amber-600 dark:text-amber-400" />}
          accent="bg-amber-500/10"
        />
        <StatCard
          label="Invoices Pending"
          value={stats.invoicesPending}
          icon={<CalendarClock className="size-5 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-500/10"
        />
        <StatCard
          label="Overdue Invoices"
          value={stats.overdueInvoices}
          icon={<AlertCircle className="size-5 text-red-600 dark:text-red-400" />}
          accent="bg-red-500/10"
        />
        <StatCard
          label="Average Outstanding"
          value={stats.averageOutstanding}
          icon={<Clock className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
        />
      </div>

      <OutstandingReportTable rows={rows} />
    </div>
  );
}
