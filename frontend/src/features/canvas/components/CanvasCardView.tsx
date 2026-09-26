import { type DragEvent } from "react";
import { GstPair } from "@/features/canvas/components/GstAmount";
import { SOURCE_LABELS, type CanvasCard, type CanvasRowKey } from "@/features/canvas/types/canvas";
import { formatDate } from "@/shared/utils";
import { cn } from "@/shared/utils";

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
  const reference = card.dealTitle || card.invoiceNumber;
  const overdue = card.status === "overdue";

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
        overdue && "border-rose-400/60 bg-rose-500/[0.06]"
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
                : "bg-muted text-muted-foreground"
            )}
          >
            {card.status}
          </span>
        ) : null}
      </div>
      <GstPair inclusive={card.expectedAmount} exclusive={card.amountExGst} percent={card.gstPercent} />
      <p className="mt-1 text-xs text-muted-foreground">
        {card.expectedDate ? formatDate(card.expectedDate) : "No expected date"}
        <span className="px-1 text-border">·</span>
        {source}
      </p>
      {card.reason ? <p className="mt-1 truncate text-xs text-muted-foreground">{card.reason}</p> : null}
      {reference ? <p className="truncate text-xs font-medium text-foreground/80">{reference}</p> : null}
    </button>
  );
}
