import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { StatCard } from "@/shared/components/PageHeader";
import { RenewalReportTable } from "@/features/reports/components/RenewalReportTable";
import { reportsApi } from "@/features/reports/api/reports.api";
import {
  formatRenewalReportStats,
  mapReportRenewal,
} from "@/features/reports/api/reports.mappers";
import { useReportQuery } from "@/features/reports/hooks/use-report-query";
import type { ReportFilters } from "@/features/reports/types/reports";

interface RenewalReportTabProps {
  filters: ReportFilters;
}

export function RenewalReportTab({ filters }: RenewalReportTabProps) {
  const fetcher = useCallback(
    (nextFilters: ReportFilters) => reportsApi.getRenewals(nextFilters),
    []
  );
  const { data, loading, error } = useReportQuery(filters, fetcher);

  const renewals = useMemo(
    () => (data?.items ?? []).map(mapReportRenewal),
    [data]
  );
  const stats = useMemo(
    () =>
      data
        ? formatRenewalReportStats(data.stats)
        : {
            upcomingRenewals: "—",
            overdueRenewals: "—",
            renewed: "—",
            renewalValue: "—",
          },
    [data]
  );

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {loading && !data && (
        <p className="text-sm text-muted-foreground">Loading renewal report…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Upcoming Renewals"
          value={stats.upcomingRenewals}
          icon={<CalendarClock className="size-5 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-500/10"
        />
        <StatCard
          label="Overdue Renewals"
          value={stats.overdueRenewals}
          icon={<AlertCircle className="size-5 text-red-600 dark:text-red-400" />}
          accent="bg-red-500/10"
        />
        <StatCard
          label="Renewed"
          value={stats.renewed}
          icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
        />
        <StatCard
          label="Renewal Value"
          value={stats.renewalValue}
          icon={<RefreshCw className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
        />
      </div>

      <RenewalReportTable renewals={renewals} />
    </div>
  );
}
