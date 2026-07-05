import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import {
  getDashboardExpenseStats,
  getMonthlyExpenseChartData,
} from "@/features/expenses/utils/expense-utils";
import { cn } from "@/shared/utils";

export function RevenueExpenseChart() {
  const { transactions } = useExpenses();
  const stats = getDashboardExpenseStats(transactions);
  const expenseData = getMonthlyExpenseChartData(transactions);

  const maxValue = Math.max(
    ...expenseData.map((point) => point.expense),
    1
  );

  const revenuePlaceholder = expenseData.map((point, index) => ({
    month: point.month,
    revenue: [420000, 385000, 510000, 475000, 530000, 485000][index] ?? 450000,
    expense: point.expense,
  }));

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Revenue vs Expense</h3>
          <p className="text-sm text-muted-foreground">Last 6 months overview</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/40" />
            Expense
          </span>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <ExpenseMetric label="Monthly Expense" value={formatInvoiceCurrency(stats.monthlyExpense)} />
        <ExpenseMetric
          label="Pending Expense"
          value={formatInvoiceCurrency(stats.pendingExpense)}
          highlight
        />
        <ExpenseMetric label="Yearly Expense" value={formatInvoiceCurrency(stats.yearlyExpense)} />
      </div>

      <div className="flex h-48 items-end justify-between gap-2 sm:gap-4">
        {revenuePlaceholder.map((point) => {
          const scale = Math.max(point.revenue, point.expense, maxValue);
          const revenueHeight = (point.revenue / scale) * 100;
          const expenseHeight = (point.expense / scale) * 100;

          return (
            <div
              key={point.month}
              className="group flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-40 w-full items-end justify-center gap-1 sm:gap-1.5">
                <div
                  className={cn(
                    "w-full max-w-5 rounded-t-md bg-emerald-500/80 transition-opacity group-hover:opacity-100",
                    "opacity-90 dark:bg-emerald-500/70"
                  )}
                  style={{ height: `${revenueHeight}%` }}
                  title={`Revenue: ${formatInvoiceCurrency(point.revenue)}`}
                />
                <div
                  className="w-full max-w-5 rounded-t-md bg-muted-foreground/25 transition-opacity group-hover:opacity-100"
                  style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                  title={`Expense: ${formatInvoiceCurrency(point.expense)}`}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {point.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExpenseMetric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-base font-semibold tracking-tight",
          highlight && "text-amber-700 dark:text-amber-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}
