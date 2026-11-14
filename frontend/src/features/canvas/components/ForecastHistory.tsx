import { Edit } from "lucide-react";
import type { CanvasForecastHistory, CanvasForecastPayment } from "@/features/canvas/types/canvas";
import { PAYMENT_ACCOUNT_LABELS } from "@/features/revenue/types/payment";
import { Button } from "@/shared/ui/button";
import { cn, formatCurrency, formatDate } from "@/shared/utils";

function paymentLabel(index: number): string {
  return index === 0 ? "First payment" : `Payment ${index + 1}`;
}

function tdsLine(payment: CanvasForecastPayment): string {
  if (!payment.tdsAmount || payment.tdsAmount <= 0.009) return "";
  const money = formatCurrency(payment.tdsAmount);
  return payment.tdsSettles
    ? `Client cut ${money} as tax. Counted in the bill.`
    : `Client cut ${money} as tax. Not counted.`;
}

function accountLine(payment: CanvasForecastPayment): string {
  if (payment.receivedAccount === "gst") return PAYMENT_ACCOUNT_LABELS.gst;
  if (payment.receivedAccount === "other") return "Other account (non-GST)";
  return "";
}

function HistoryBox({
  label,
  date,
  amount,
  note,
  account,
  tone,
  compact,
  wide,
  onEdit,
}: {
  label: string;
  date?: string;
  amount: string;
  note?: string;
  account?: string;
  tone: "created" | "payment" | "remaining";
  compact?: boolean;
  wide?: boolean;
  onEdit?: () => void;
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
      <div className="flex items-start justify-between gap-2">
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
        {onEdit && !compact ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0"
            aria-label={`Edit ${label}`}
            onClick={onEdit}
          >
            <Edit className="size-3.5" />
          </Button>
        ) : null}
      </div>
      {date ? (
        <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "mt-1 text-xs")}>{date}</p>
      ) : null}
      <p className={cn("font-semibold tabular-nums", compact ? "text-[11px]" : "text-base")}>{amount}</p>
      {account ? <p className="text-[10px] text-muted-foreground">{account}</p> : null}
      {note ? <p className="text-[10px] text-muted-foreground">{note}</p> : null}
    </div>
  );
}

/** Payment story for a forecast that still has a balance. */
export function ForecastHistory({
  history,
  compact = false,
  onEditPayment,
}: {
  history: CanvasForecastHistory;
  compact?: boolean;
  onEditPayment?: (payment: CanvasForecastPayment, index: number) => void;
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
            account={accountLine(payment)}
            note={tdsLine(payment)}
            onEdit={
              onEditPayment && payment.receiptPaymentIndex != null
                ? () => onEditPayment(payment, index)
                : undefined
            }
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
