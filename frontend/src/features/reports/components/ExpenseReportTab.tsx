import {
  CalendarClock,
  IndianRupee,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { StatCard } from "@/shared/components/PageHeader";
import { StatDetailDialog, type StatDetailRow } from "@/shared/components/StatDetailDialog";
import { ExpenseReportTable } from "@/features/reports/components/ExpenseReportTable";
import { reportsApi } from "@/features/reports/api/reports.api";
import {
  formatExpenseReportStats,
  mapReportExpense,
} from "@/features/reports/api/reports.mappers";
import { useReportQuery } from "@/features/reports/hooks/use-report-query";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { toExpenseCategoryItems } from "@/features/settings/utils/app-config-utils";
import type { ReportFilters } from "@/features/reports/types/reports";
import { getReportFilterPeriod } from "@/features/reports/utils/report-utils";
import { countLabel, sumBy, type ReportDetail } from "@/features/reports/utils/report-detail";
import { formatExpenseCurrency } from "@/features/expenses/utils/expense-utils";
import type { ExpenseTransaction } from "@/features/expenses/types/expense";
import { formatDate } from "@/shared/utils";

interface ExpenseReportTabProps {
  filters: ReportFilters;
}

type ExpenseCard = "total" | "paid" | "pending" | "recurring";

const STATUS_LABEL: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  partial: "Partially paid",
  cancelled: "Cancelled",
};

export function ExpenseReportTab({ filters }: ExpenseReportTabProps) {
  const { expenseCategories } = useAppConfig();
  const categories = toExpenseCategoryItems(expenseCategories);
  const fetcher = useCallback(
    (nextFilters: ReportFilters) => reportsApi.getExpenses(nextFilters),
    []
  );
  const { data, loading, error } = useReportQuery(filters, fetcher);
  const [openCard, setOpenCard] = useState<ExpenseCard | null>(null);

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
  const period = getReportFilterPeriod(filters);

  const detail = useMemo<ReportDetail | null>(() => {
    if (!openCard) return null;
    const categoryName = new Map(
      expenseCategories.map((category) => [category.id, category.name])
    );
    const toRow = (txn: ExpenseTransaction): StatDetailRow => ({
      id: txn.id,
      title: txn.name || txn.vendorOrEmployee || "Expense",
      subtitle: [
        formatDate(txn.date),
        categoryName.get(txn.categoryId) || "",
        txn.vendorOrEmployee,
      ]
        .filter(Boolean)
        .join(" · "),
      detail: [STATUS_LABEL[txn.status] ?? txn.status, txn.recurring ? "Recurring" : ""]
        .filter(Boolean)
        .join(" · "),
      value: formatExpenseCurrency(txn.amount),
    });
    const build = (title: string, list: ExpenseTransaction[], rule: string): ReportDetail => ({
      title,
      description: `${formatExpenseCurrency(sumBy(list, (t) => t.amount))} = ${rule} (${countLabel(list.length, "expense")} in ${period}).`,
      rows: [...list].sort((a, b) => b.date.localeCompare(a.date)).map(toRow),
      empty: "No expenses here.",
      nameLabel: "Expense",
      valueLabel: "Amount",
    });
    switch (openCard) {
      case "total":
        return build("Total Expense", transactions, "sum of every expense in this view");
      case "paid":
        return build(
          "Paid",
          transactions.filter((t) => t.status === "paid"),
          "sum of expenses marked Paid"
        );
      case "pending":
        return build(
          "Pending",
          transactions.filter((t) => t.status === "pending" || t.status === "partial"),
          "sum of expenses still Pending or Partially paid"
        );
      case "recurring": {
        const list = transactions.filter((t) => t.recurring);
        return {
          ...build("Recurring Expenses", list, "sum of recurring expenses"),
          description: `${countLabel(list.length, "recurring expense")} in ${period}, worth ${formatExpenseCurrency(sumBy(list, (t) => t.amount))}.`,
        };
      }
      default:
        return null;
    }
  }, [openCard, transactions, expenseCategories, period]);

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
          period={period}
          onClick={data ? () => setOpenCard("total") : undefined}
        />
        <StatCard
          label="Paid"
          value={stats.paid}
          icon={<IndianRupee className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
          period={period}
          onClick={data ? () => setOpenCard("paid") : undefined}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<CalendarClock className="size-5 text-amber-600 dark:text-amber-400" />}
          accent="bg-amber-500/10"
          period={period}
          onClick={data ? () => setOpenCard("pending") : undefined}
        />
        <StatCard
          label="Recurring Expenses"
          value={stats.recurringExpenses}
          icon={<RefreshCw className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
          period={period}
          onClick={data ? () => setOpenCard("recurring") : undefined}
        />
      </div>

      <ExpenseReportTable transactions={transactions} categories={categories} />

      <StatDetailDialog
        open={Boolean(detail)}
        title={detail?.title ?? ""}
        description={detail?.description}
        rows={detail?.rows ?? []}
        empty={detail?.empty ?? ""}
        nameLabel={detail?.nameLabel}
        valueLabel={detail?.valueLabel}
        onOpenChange={(open) => {
          if (!open) setOpenCard(null);
        }}
      />
    </div>
  );
}
