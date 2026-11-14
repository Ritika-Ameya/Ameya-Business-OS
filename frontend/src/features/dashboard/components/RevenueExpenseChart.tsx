import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { FinanceCashDetailDialog } from "@/features/dashboard/components/FinanceCashDetailDialog";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import type { DashboardPeriod } from "@/features/dashboard/api/dashboard.dto";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import { DateInput } from "@/shared/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/utils";

const SERIES = [
  {
    key: "received",
    label: "Money in",
    hint: "Payments received, by payment date",
    bar: "from-emerald-600 to-teal-400",
    dot: "from-emerald-400 to-teal-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  {
    key: "expense",
    label: "Money out",
    hint: "Paid expenses, by expense date",
    bar: "from-rose-500 to-orange-300",
    dot: "from-rose-400 to-orange-400",
    text: "text-rose-700 dark:text-rose-300",
  },
  {
    key: "invoiced",
    label: "Invoiced",
    hint: "Invoices raised, by invoice date",
    bar: "from-indigo-600 to-violet-400",
    dot: "from-indigo-400 to-violet-500",
    text: "text-indigo-700 dark:text-indigo-300",
  },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

const PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "last-6-months", label: "Last 6 months" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "this-year", label: "This year" },
  { value: "year", label: "Pick a year" },
  { value: "month", label: "Pick a month" },
  { value: "custom", label: "Custom dates" },
  { value: "all", label: "All time" },
];

const MONTH_NAMES = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en-IN", { month: "long" }).format(new Date(2000, index, 1))
);

const compact = (value: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export function RevenueExpenseChart() {
  const { summary, period, setPeriod, loading } = useDashboard();
  const stats = summary?.chart.expenseStats ?? {
    monthlyExpense: 0,
    pendingExpense: 0,
    yearlyExpense: 0,
  };
  const finance = summary?.finance;
  const points = (summary?.chart.points ?? []).map((point) => ({
    ...point,
    received: point.received ?? 0,
    invoiced: point.invoiced ?? 0,
  }));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [financeDetail, setFinanceDetail] = useState<
    "revenue" | "expense" | "difference" | null
  >(null);
  const selected =
    points.find((point) => point.yearMonth === selectedKey) ?? points[points.length - 1];

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const set = new Set<number>([period.year, current]);
    for (let year = current - 5; year <= current + 1; year += 1) set.add(year);
    for (const point of points) {
      const year = Number(point.yearMonth.slice(0, 4));
      if (Number.isInteger(year) && year > 2000) set.add(year);
    }
    return [...set].sort((a, b) => b - a);
  }, [period.year, points]);

  const maxValue = Math.max(
    ...points.map((point) => Math.max(point.received, point.invoiced, point.expense)),
    1
  );
  const valueOf = (point: (typeof points)[number], key: SeriesKey) => point[key];
  const difference = finance?.difference ?? 0;
  const periodLabel = finance?.periodLabel ?? "Selected period";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/70 bg-card/95 p-4 shadow-card accent-bar-emerald sm:p-6 dark:border-white/10">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight">Money in vs money out</h3>
            <p className="text-sm text-muted-foreground">
              Received payments vs paid expenses · {periodLabel}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
            <Select
              value={period.period}
              onValueChange={(value) =>
                setPeriod({ period: value as DashboardPeriod })
              }
            >
              <SelectTrigger aria-label="Period" className="h-9 w-full rounded-xl sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {period.period === "year" || period.period === "month" ? (
              <Select
                value={String(period.year)}
                onValueChange={(value) => setPeriod({ year: Number(value) })}
              >
                <SelectTrigger aria-label="Year" className="h-9 w-full rounded-xl sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {period.period === "month" ? (
              <Select
                value={String(period.month)}
                onValueChange={(value) => setPeriod({ month: Number(value) })}
              >
                <SelectTrigger aria-label="Month" className="h-9 w-full rounded-xl sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, index) => (
                    <SelectItem key={name} value={String(index + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {period.period === "custom" ? (
              <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
                <DateInput
                  aria-label="From date"
                  value={period.dateFrom}
                  onChange={(event) => setPeriod({ dateFrom: event.target.value })}
                  className="h-9 rounded-xl"
                />
                <DateInput
                  aria-label="To date"
                  value={period.dateTo}
                  onChange={(event) => setPeriod({ dateTo: event.target.value })}
                  className="h-9 rounded-xl"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <FinanceStat
            label="Money in"
            hint={`Marked received · ${periodLabel}`}
            value={formatInvoiceCurrency(finance?.totalRevenue ?? 0)}
            icon={<ArrowUpRight className="size-5" />}
            tone="emerald"
            onOpen={() => setFinanceDetail("revenue")}
          />
          <FinanceStat
            label="Money out"
            hint={`Marked paid · ${periodLabel}`}
            value={formatInvoiceCurrency(finance?.totalExpense ?? 0)}
            icon={<ArrowDownRight className="size-5" />}
            tone="rose"
            onOpen={() => setFinanceDetail("expense")}
          />
          <FinanceStat
            label="Difference"
            hint="Money in − money out"
            value={formatInvoiceCurrency(difference)}
            icon={<Scale className="size-5" />}
            tone={difference >= 0 ? "emerald" : "rose"}
            onOpen={() => setFinanceDetail("difference")}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium">
          {SERIES.map((series) => (
            <span key={series.key} className="flex items-center gap-1.5" title={series.hint}>
              <span className={cn("size-2.5 rounded-full bg-gradient-to-br shadow-sm", series.dot)} />
              {series.label}
            </span>
          ))}
          {loading ? (
            <span className="text-muted-foreground">Updating…</span>
          ) : null}
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
                      aria-label={`${point.month}: money in ${formatInvoiceCurrency(point.received)}, money out ${formatInvoiceCurrency(point.expense)}, invoiced ${formatInvoiceCurrency(point.invoiced)}`}
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
                        {points.length > 6 ? (
                          <span className="hidden sm:inline">
                            {" "}
                            {point.yearMonth.slice(2, 4)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selected ? (
              <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-3">
                <p className="text-xs font-semibold">
                  {new Intl.DateTimeFormat("en-IN", {
                    month: "long",
                    year: "numeric",
                  }).format(
                    new Date(
                      Number(selected.yearMonth.slice(0, 4)),
                      Number(selected.yearMonth.slice(5, 7)) - 1,
                      1
                    )
                  )}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · tap a month to compare
                  </span>
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
                  Net for month (money in − money out):{" "}
                  <span className="font-semibold text-foreground">
                    {formatInvoiceCurrency(selected.received - selected.expense)}
                  </span>
                </p>
              </div>
            ) : null}
          </>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
          <ExpenseMetric
            label="Paid expense this month"
            value={formatInvoiceCurrency(stats.monthlyExpense)}
          />
          <ExpenseMetric
            label="Pending expense"
            value={formatInvoiceCurrency(stats.pendingExpense)}
            highlight
          />
          <ExpenseMetric
            label="Paid expense this year"
            value={formatInvoiceCurrency(stats.yearlyExpense)}
          />
        </div>
      </div>

      <FinanceCashDetailDialog
        open={financeDetail != null}
        kind={financeDetail}
        periodLabel={periodLabel}
        total={
          financeDetail === "expense"
            ? finance?.totalExpense ?? 0
            : financeDetail === "difference"
              ? difference
              : finance?.totalRevenue ?? 0
        }
        items={
          financeDetail === "expense"
            ? finance?.expenseItems ?? []
            : financeDetail === "revenue"
              ? finance?.revenueItems ?? []
              : []
        }
        onOpenChange={(open) => {
          if (!open) setFinanceDetail(null);
        }}
      />
    </div>
  );
}

function FinanceStat({
  label,
  hint,
  value,
  icon,
  tone,
  onOpen,
}: {
  label: string;
  hint: string;
  value: string;
  icon: React.ReactNode;
  tone: "emerald" | "rose";
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className={cn(
        "w-full rounded-2xl border px-4 py-3 text-left transition-colors hover:brightness-[0.98]",
        tone === "emerald"
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-rose-500/20 bg-rose-500/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
          <p
            className={cn(
              "mt-2 text-xl font-bold tabular-nums tracking-tight",
              tone === "emerald"
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-rose-700 dark:text-rose-300"
            )}
          >
            {value}
          </p>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">Tap for payment list</p>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            tone === "emerald"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
          )}
        >
          {icon}
        </div>
      </div>
    </button>
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-gradient-to-br from-muted/40 to-transparent px-3.5 py-2.5 sm:block">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "shrink-0 text-base font-semibold tracking-tight tabular-nums sm:mt-1",
          highlight && "text-amber-700 dark:text-amber-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}
