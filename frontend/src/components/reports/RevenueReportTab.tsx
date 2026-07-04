import {
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { StatCard } from "@/components/customers/PageHeader";
import { RevenueReportTable } from "@/components/reports/RevenueReportTable";
import { seedInvoices } from "@/data/seed-invoices";
import {
  computeRevenueReportStats,
  filterInvoicesForReport,
} from "@/lib/report-utils";
import type { ReportFilters } from "@/types/reports";

interface RevenueReportTabProps {
  filters: ReportFilters;
}

export function RevenueReportTab({ filters }: RevenueReportTabProps) {
  const invoices = useMemo(
    () => filterInvoicesForReport(seedInvoices, filters),
    [filters]
  );
  const stats = useMemo(() => computeRevenueReportStats(invoices), [invoices]);

  return (
    <div className="space-y-6">
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
