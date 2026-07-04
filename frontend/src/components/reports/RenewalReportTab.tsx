import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";
import { StatCard } from "@/components/customers/PageHeader";
import { RenewalReportTable } from "@/components/reports/RenewalReportTable";
import {
  computeRenewalReportStats,
  filterRenewalsForReport,
  getAllRenewals,
} from "@/lib/report-utils";
import type { ReportFilters } from "@/types/reports";

interface RenewalReportTabProps {
  filters: ReportFilters;
}

export function RenewalReportTab({ filters }: RenewalReportTabProps) {
  const renewals = useMemo(() => {
    const all = getAllRenewals();
    return filterRenewalsForReport(all, filters);
  }, [filters]);

  const stats = useMemo(() => computeRenewalReportStats(renewals), [renewals]);

  return (
    <div className="space-y-6">
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
