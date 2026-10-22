import type { CanvasForecastHistory, CanvasForecastPayment } from "@/features/canvas/types/canvas";
import { cn, formatCurrency, formatDate } from "@/shared/utils";

function paymentLabel(index: number): string {
  return index === 0 ? "First payment" : `Payment ${index + 1}`;
}

function tdsLine(payment: CanvasForecastPayment): string {
  if (!payment.tdsAmount || payment.tdsAmount <= 0.009) return "";
  return `TDS ${formatCurrency(payment.tdsAmount)}`;
}

function HistoryBox({
  label,
  date,
  amount,
  note,
  tone,
  compact,
  wide,
}: {
  label: string;
  date?: string;
  amount: string;
  note?: string;
  tone: "created" | "payment" | "remaining";
  compact?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border",
        compact ? "px-1.5 py-1" : "px-2.5 py-2",
        wide && !compact && "col-span-2",
        tone === "created" && "border-slate-300/80 bg-white dark:border-slate-600 dark:bg-slate-950",
        tone === "payment" && "border-emerald-300/80 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
        tone === "remaining" && "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
      )}
    >
      <p
        className={cn(
          "font-semibold uppercase tracking-wide",
          compact ? "text-[9px]" : "text-[10px]",
          tone === "created" && "text-slate-500",
          tone === "payment" && "text-emerald-700 dark:text-emerald-300",
          tone === "remaining" && "text-amber-700 dark:text-amber-300"
        )}
      >
        {label}
      </p>
      {date ? (
        <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "mt-1 text-xs")}>{date}</p>
      ) : null}
      <p className={cn("font-semibold tabular-nums", compact ? "text-[11px]" : "text-base")}>{amount}</p>
      {note ? <p className="text-[10px] text-muted-foreground">{note}</p> : null}
    </div>
  );
}

/** Payment story for a forecast that still has a balance. */
export function ForecastHistory({
  history,
  compact = false,
}: {
  history: CanvasForecastHistory;
  compact?: boolean;
}) {
  return (
    <div className={cn(compact ? "mt-1.5" : "rounded-2xl border border-border/70 bg-muted/20 p-2.5")}>
      {compact ? null : (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Payment history
        </p>
      )}
      <div className={cn("grid", compact ? "grid-cols-1 gap-1" : "grid-cols-2 gap-2")}>
        <HistoryBox
          compact={compact}
          tone="created"
          label="Created on"
          date={history.createdOn ? formatDate(history.createdOn) : undefined}
          amount={formatCurrency(history.originalAmount)}
        />
        {history.payments.map((payment, index) => (
          <HistoryBox
            key={`${payment.date}-${index}`}
            compact={compact}
            tone="payment"
            label={paymentLabel(index)}
            date={formatDate(payment.date)}
            amount={formatCurrency(payment.amount)}
            note={tdsLine(payment)}
          />
        ))}
        <HistoryBox
          compact={compact}
          wide
          tone="remaining"
          label="Remaining"
          amount={formatCurrency(history.remaining)}
        />
      </div>
    </div>
  );
}
