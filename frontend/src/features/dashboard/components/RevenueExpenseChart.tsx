import { useState } from "react";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import { ALL_TIME, lastSixMonthsPeriod, thisMonthPeriod, thisYearPeriod } from "@/shared/utils/period-label";
import { cn } from "@/shared/utils";

const SERIES = [
  {
    key: "received",
    label: "Received",
    hint: "Payments received, by payment date",
    bar: "from-emerald-600 to-teal-400",
    dot: "from-emerald-400 to-teal-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  {
    key: "invoiced",
    label: "Invoiced",
    hint: "Invoices raised, by invoice date",
    bar: "from-indigo-600 to-violet-400",
    dot: "from-indigo-400 to-violet-500",
    text: "text-indigo-700 dark:text-indigo-300",
  },
  {
    key: "expense",
    label: "Expense",
    hint: "Expenses, by expense date",
    bar: "from-rose-500 to-orange-300",
    dot: "from-rose-400 to-orange-400",
    text: "text-rose-700 dark:text-rose-300",
  },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

const compact = (value: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export function RevenueExpenseChart() {
  const { summary } = useDashboard();
  const stats = summary?.chart.expenseStats ?? {
    monthlyExpense: 0,
    pendingExpense: 0,
    yearlyExpense: 0,
  };
  const points = (summary?.chart.points ?? []).map((point) => ({
    ...point,
    received: point.received ?? 0,
    invoiced: point.invoiced ?? 0,
  }));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = points.find((point) => point.yearMonth === selectedKey) ?? points[points.length - 1];

  const maxValue = Math.max(
    ...points.map((point) => Math.max(point.received, point.invoiced, point.expense)),
    1
  );
  const valueOf = (point: (typeof points)[number], key: SeriesKey) => point[key];

  return (
    <div className="rounded-2xl border border-white/70 bg-card/95 p-4 shadow-card accent-bar-emerald sm:p-6 dark:border-white/10">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Money in vs money out</h3>
          <p className="text-sm text-muted-foreground">Last 6 months · {lastSixMonthsPeriod()}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium">
          {SERIES.map((series) => (
            <span key={series.key} className="flex items-center gap-1.5" title={series.hint}>
              <span className={cn("size-2.5 rounded-full bg-gradient-to-br shadow-sm", series.dot)} />
              {series.label}
            </span>
          ))}
        </div>
      </div>

      {points.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No chart data yet</p>
      ) : (
        <>
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between text-[10px] text-muted-foreground">
              <span>₹{compact(maxValue)}</span>
            </div>
            <div className="flex h-52 items-end justify-between gap-1.5 pt-5 sm:gap-3">
              {points.map((point) => {
                const active = selected?.yearMonth === point.yearMonth;
                return (
                  <button
                    key={point.yearMonth}
                    type="button"
                    onClick={() => setSelectedKey(point.yearMonth)}
                    aria-pressed={active}
                    aria-label={`${point.month}: received ${formatInvoiceCurrency(point.received)}, invoiced ${formatInvoiceCurrency(point.invoiced)}, expense ${formatInvoiceCurrency(point.expense)}`}
                    className={cn(
                      "group flex h-full flex-1 flex-col items-center justify-end gap-2 rounded-xl px-0.5 pt-1 transition-colors",
                      active ? "bg-muted/60" : "hover:bg-muted/40"
                    )}
                  >
                    <div className="flex h-full w-full items-end justify-center gap-0.5 sm:gap-1">
                      {SERIES.map((series) => {
                        const value = valueOf(point, series.key);
                        const height = value > 0 ? Math.max((value / maxValue) * 100, 2) : 0;
                        return (
                          <div
                            key={series.key}
                            className={cn(
                              "w-full max-w-4 rounded-t-md bg-gradient-to-t shadow-sm transition-all group-hover:brightness-110",
                              series.bar,
                              value === 0 && "h-0.5 bg-none bg-border"
                            )}
                            style={value > 0 ? { height: `${height}%` } : undefined}
                          />
                        );
                      })}
                    </div>
                    <span
                      className={cn(
                        "max-w-full truncate pb-1 text-[10px] font-medium sm:text-xs",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {point.month}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selected ? (
            <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-3">
              <p className="text-xs font-semibold">
                {new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
                  new Date(Number(selected.yearMonth.slice(0, 4)), Number(selected.yearMonth.slice(5, 7)) - 1, 1)
                )}
                <span className="font-normal text-muted-foreground"> · tap a month to compare</span>
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {SERIES.map((series) => (
                  <div key={series.key} className="min-w-0">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {series.label}
                    </p>
                    <p className={cn("truncate text-sm font-bold tabular-nums", series.text)}>
                      {formatInvoiceCurrency(valueOf(selected, series.key))}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Net cash (received − expense):{" "}
                <span className="font-semibold text-foreground">
                  {formatInvoiceCurrency(selected.received - selected.expense)}
                </span>
              </p>
            </div>
          ) : null}
        </>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
        <ExpenseMetric label="Expense this month" value={formatInvoiceCurrency(stats.monthlyExpense)} period={thisMonthPeriod()} />
        <ExpenseMetric
          label="Pending expense"
          value={formatInvoiceCurrency(stats.pendingExpense)}
          highlight
          period={`${ALL_TIME} · not yet paid`}
        />
        <ExpenseMetric label="Expense this year" value={formatInvoiceCurrency(stats.yearlyExpense)} period={thisYearPeriod()} />
      </div>
    </div>
  );
}

function ExpenseMetric({
  label,
  value,
  highlight,
  period,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  period?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-gradient-to-br from-muted/40 to-transparent px-3.5 py-2.5 sm:block">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {period ? <p className="text-[11px] text-muted-foreground">{period}</p> : null}
      </div>
      <p className={cn("shrink-0 text-base font-semibold tracking-tight tabular-nums sm:mt-1", highlight && "text-amber-700 dark:text-amber-400")}>
        {value}
      </p>
    </div>
  );
}
