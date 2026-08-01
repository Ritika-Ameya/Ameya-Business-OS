import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import { cn } from "@/shared/utils";

export function RevenueExpenseChart() {
  const { summary } = useDashboard();
  const stats = summary?.chart.expenseStats ?? {
    monthlyExpense: 0,
    pendingExpense: 0,
    yearlyExpense: 0,
  };
  const chartData = summary?.chart.points ?? [];

  const maxValue = Math.max(
    ...chartData.map((point) => Math.max(point.revenue, point.expense)),
    1
  );

  return (
    <div className="rounded-2xl border border-white/70 bg-card/95 p-5 shadow-card accent-bar-emerald sm:p-6 dark:border-white/10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Revenue vs Expense</h3>
          <p className="text-sm text-muted-foreground">Last 6 months overview</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 shadow-sm" />
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
        {chartData.length === 0 ? (
          <p className="w-full self-center text-center text-sm text-muted-foreground">
            No chart data yet
          </p>
        ) : (
          chartData.map((point) => {
            const scale = Math.max(point.revenue, point.expense, maxValue);
            const revenueHeight = (point.revenue / scale) * 100;
            const expenseHeight = (point.expense / scale) * 100;

            return (
              <div
                key={point.yearMonth}
                className="group flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex h-40 w-full items-end justify-center gap-1 sm:gap-1.5">
                  <div
                    className={cn(
                      "w-full max-w-5 rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 transition-all group-hover:brightness-110",
                      "opacity-95 shadow-sm"
                    )}
                    style={{ height: `${revenueHeight}%` }}
                    title={`Revenue: ${formatInvoiceCurrency(point.revenue)}`}
                  />
                  <div
                    className="w-full max-w-5 rounded-t-lg bg-gradient-to-t from-rose-500 to-orange-300 opacity-90 shadow-sm transition-all group-hover:brightness-110"
                    style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                    title={`Expense: ${formatInvoiceCurrency(point.expense)}`}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {point.month}
                </span>
              </div>
            );
          })
        )}
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
    <div className="rounded-xl border border-border/50 bg-gradient-to-br from-muted/40 to-transparent px-4 py-3">
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
