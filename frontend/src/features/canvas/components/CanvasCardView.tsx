import { type DragEvent } from "react";
import { SOURCE_LABELS, type CanvasCard, type CanvasRowKey } from "@/features/canvas/types/canvas";
import { formatMonthLabel } from "@/features/canvas/utils/canvas-utils";
import { cn, formatCurrency, formatDate } from "@/shared/utils";

const accent: Record<CanvasRowKey, string> = {
  unclassified: "border-l-slate-400",
  hot: "border-l-rose-500",
  warm: "border-l-amber-500",
  cold: "border-l-sky-500",
  customer: "border-l-violet-500",
};

export function CanvasCardView({
  card,
  draggable,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  card: CanvasCard;
  draggable: boolean;
  onOpen: () => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
}) {
  const source = card.sourceType ? SOURCE_LABELS[card.sourceType] : "Account";
  const detail = card.reason || card.invoiceNumber || card.dealTitle;
  const overdue = card.status === "overdue";
  const paid = card.status === "received";
  const statusLabel = paid ? "Paid" : card.status;
  const exGst = card.amountExGst ?? card.expectedAmount;
  const showExGst = card.expectedAmount != null && exGst != null && Math.abs(card.expectedAmount - exGst) > 0.009;

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        "w-full rounded-xl border border-border/70 border-l-[3px] bg-card px-3 py-2.5 text-left shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        accent[card.rowKey],
        card.kind === "account" && "border-dashed bg-muted/30",
        overdue && "bg-rose-500/[0.05]",
        paid && "opacity-75"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{card.companyName}</p>
        {card.status !== "expected" ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              overdue
                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                : paid
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>

      {card.expectedAmount != null ? (
        <p className="mt-1.5 text-base font-bold tabular-nums leading-tight">
          {formatCurrency(card.expectedAmount)}
          {showExGst ? (
            <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">
              {formatCurrency(exGst)} + GST {formatCurrency((card.expectedAmount ?? 0) - (exGst ?? 0))}
            </span>
          ) : (
            <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">No GST</span>
          )}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-muted-foreground">No expected receipt yet</p>
      )}

      {card.kind === "receipt" ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
          <span>{card.expectedDate ? formatDate(card.expectedDate) : "No date"}</span>
          <span className="text-border">•</span>
          <span>{source}</span>
          {card.carriedFrom ? (
            <span className="rounded-md bg-rose-500/10 px-1.5 py-px font-semibold text-rose-700 dark:text-rose-300">
              Carried from {formatMonthLabel(card.carriedFrom)}
            </span>
          ) : null}
        </p>
      ) : null}
      {detail && card.kind === "receipt" ? (
        <p className="mt-0.5 truncate text-[11px] text-foreground/70">{detail}</p>
      ) : null}
    </button>
  );
}
