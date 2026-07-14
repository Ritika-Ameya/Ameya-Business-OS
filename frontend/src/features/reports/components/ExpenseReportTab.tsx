import {
  CalendarClock,
  IndianRupee,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { StatCard } from "@/shared/components/PageHeader";
import { ExpenseReportTable } from "@/features/reports/components/ExpenseReportTable";
import { reportsApi } from "@/features/reports/api/reports.api";
import {
  formatExpenseReportStats,
  mapReportExpense,
} from "@/features/reports/api/reports.mappers";
import { useReportQuery } from "@/features/reports/hooks/use-report-query";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import type { ReportFilters } from "@/features/reports/types/reports";

interface ExpenseReportTabProps {
  filters: ReportFilters;
}

export function ExpenseReportTab({ filters }: ExpenseReportTabProps) {
  const { categories } = useExpenses();
  const fetcher = useCallback(
    (nextFilters: ReportFilters) => reportsApi.getExpenses(nextFilters),
    []
  );
  const { data, loading, error } = useReportQuery(filters, fetcher);

  const transactions = useMemo(
    () => (data?.items ?? []).map(mapReportExpense),
    [data]
  );
  const stats = useMemo(
    () =>
      data
        ? formatExpenseReportStats(data.stats)
        : {
            totalExpense: "—",
            paid: "—",
            pending: "—",
            recurringExpenses: "—",
          },
    [data]
  );

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {loading && !data && (
        <p className="text-sm text-muted-foreground">Loading expense report…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Expense"
          value={stats.totalExpense}
          icon={<ReceiptText className="size-5 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-500/10"
        />
        <StatCard
          label="Paid"
          value={stats.paid}
          icon={<IndianRupee className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<CalendarClock className="size-5 text-amber-600 dark:text-amber-400" />}
          accent="bg-amber-500/10"
        />
        <StatCard
          label="Recurring Expenses"
          value={stats.recurringExpenses}
          icon={<RefreshCw className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
        />
      </div>

      <ExpenseReportTable transactions={transactions} categories={categories} />
    </div>
  );
}
