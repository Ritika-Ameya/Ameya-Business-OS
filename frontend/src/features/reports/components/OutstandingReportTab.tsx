import {
  AlertCircle,
  CalendarClock,
  Clock,
  IndianRupee,
} from "lucide-react";
import { useMemo } from "react";
import { StatCard } from "@/shared/components/PageHeader";
import { OutstandingReportTable } from "@/features/reports/components/OutstandingReportTable";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import {
  computeOutstandingReportStats,
  filterOutstandingForReport,
  getOutstandingRows,
} from "@/features/reports/utils/report-utils";
import type { ReportFilters } from "@/features/reports/types/reports";

interface OutstandingReportTabProps {
  filters: ReportFilters;
}

export function OutstandingReportTab({ filters }: OutstandingReportTabProps) {
  const { invoices: allInvoices } = useRevenue();
  const invoices = useMemo(
    () => filterOutstandingForReport(allInvoices, filters),
    [allInvoices, filters]
  );

  const rows = useMemo(() => getOutstandingRows(invoices), [invoices]);
  const stats = useMemo(
    () => computeOutstandingReportStats(invoices),
    [invoices]
  );

  return (
    <div className="space-y-6">
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
