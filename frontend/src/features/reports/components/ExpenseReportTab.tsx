import {
  CalendarClock,
  IndianRupee,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";
import { StatCard } from "@/shared/components/PageHeader";
import { ExpenseReportTable } from "@/features/reports/components/ExpenseReportTable";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import {
  computeExpenseReportStats,
  filterExpensesForReport,
} from "@/features/reports/utils/report-utils";
import type { ReportFilters } from "@/features/reports/types/reports";

interface ExpenseReportTabProps {
  filters: ReportFilters;
}

export function ExpenseReportTab({ filters }: ExpenseReportTabProps) {
  const { transactions, categories } = useExpenses();

  const filtered = useMemo(
    () => filterExpensesForReport(transactions, filters, categories),
    [transactions, filters, categories]
  );

  const recurringCount = useMemo(
    () => filtered.filter((transaction) => transaction.recurring).length,
    [filtered]
  );

  const stats = useMemo(
    () => computeExpenseReportStats(filtered, recurringCount),
    [filtered, recurringCount]
  );

  return (
    <div className="space-y-6">
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

      <ExpenseReportTable transactions={filtered} categories={categories} />
    </div>
  );
}
