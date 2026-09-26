import { useState } from "react";
import { CanvasCardView } from "@/features/canvas/components/CanvasCardView";
import {
  CANVAS_ROWS,
  ROW_LABELS,
  type CanvasCard,
  type CanvasRowKey,
} from "@/features/canvas/types/canvas";
import { GstPair } from "@/features/canvas/components/GstAmount";
import { cardsInCell, formatMonthLabel } from "@/features/canvas/utils/canvas-utils";
import { formatCurrency } from "@/shared/utils";
import { cn } from "@/shared/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export interface CanvasDragPayload {
  cardId: string;
  kind: CanvasCard["kind"];
  recordType: CanvasCard["recordType"];
  rowKey: CanvasRowKey;
  monthKey: string;
  customerId: string;
  originX: number;
  originY: number;
  axis: "x" | "y" | null;
}

const columnTone: Record<
  CanvasRowKey,
  { dot: string; header: string; shell: string; drop: string }
> = {
  unclassified: {
    dot: "bg-slate-400",
    header: "from-slate-500/10 to-transparent",
    shell: "bg-slate-500/[0.03]",
    drop: "bg-slate-500/10 ring-slate-400/40",
  },
  hot: {
    dot: "bg-rose-500",
    header: "from-rose-500/15 via-orange-400/10 to-transparent",
    shell: "bg-rose-500/[0.035]",
    drop: "bg-rose-500/10 ring-rose-400/40",
  },
  warm: {
    dot: "bg-amber-500",
    header: "from-amber-400/25 via-orange-300/10 to-transparent",
    shell: "bg-amber-500/[0.04]",
    drop: "bg-amber-500/15 ring-amber-400/50",
  },
  cold: {
    dot: "bg-sky-500",
    header: "from-sky-500/15 via-cyan-400/10 to-transparent",
    shell: "bg-sky-500/[0.04]",
    drop: "bg-sky-500/10 ring-sky-400/40",
  },
  customer: {
    dot: "bg-violet-500",
    header: "from-violet-500/15 via-fuchsia-400/10 to-transparent",
    shell: "bg-violet-500/[0.04]",
    drop: "bg-violet-500/10 ring-violet-400/40",
  },
};

const TEMPERATURE_ROWS: CanvasRowKey[] = ["unclassified", "hot", "warm", "cold"];

const laneCash = (cards: CanvasCard[]): { exclusive: number; inclusive: number } =>
  cards.reduce(
    (sum, card) => {
      if (card.kind !== "receipt" || (card.status !== "expected" && card.status !== "overdue")) return sum;
      return {
        exclusive: sum.exclusive + (card.amountExGst ?? card.expectedAmount ?? 0),
        inclusive: sum.inclusive + (card.expectedAmount ?? 0),
      };
    },
    { exclusive: 0, inclusive: 0 }
  );

export function CanvasMatrix({
  cards,
  months,
  coarse,
  onOpen,
  onSchedule,
  onTemperature,
  onCreateInMonth,
  onRejectedDrop,
}: {
  cards: CanvasCard[];
  months: string[];
  coarse: boolean;
  onOpen: (card: CanvasCard) => void;
  onSchedule: (card: CanvasCard, monthKey: string) => void;
  onTemperature: (card: CanvasCard, rowKey: CanvasRowKey) => void;
  onCreateInMonth: (card: CanvasCard, monthKey: string) => void;
  onRejectedDrop: (message: string) => void;
}) {
  const [drag, setDrag] = useState<CanvasDragPayload | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const scheduledMonths = months.filter((monthKey) => monthKey !== "unscheduled");
  const showMonthLabels = scheduledMonths.length > 1;

  const axisFor = (clientX: number, clientY: number, current: CanvasDragPayload) => {
    const dx = Math.abs(clientX - current.originX);
    const dy = Math.abs(clientY - current.originY);
    if (dx < 14 && dy < 14) return null;
    if (dx > dy * 1.35) return "x" as const;
    if (dy > dx * 1.35) return "y" as const;
    return null;
  };

  const dropAllowed = (rowKey: CanvasRowKey, monthKey: string, current: CanvasDragPayload) => {
    if (!current.axis) return false;
    if (current.axis === "x") {
      if (monthKey !== current.monthKey) return false;
      if (current.recordType !== "opportunity") return false;
      if (rowKey === "customer" || rowKey === current.rowKey) return false;
      return TEMPERATURE_ROWS.includes(rowKey);
    }
    if (rowKey !== current.rowKey) return false;
    if (monthKey === "unscheduled" || monthKey === current.monthKey) return false;
    if (current.kind === "account") return true;
    return current.kind === "receipt";
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto lg:hidden">
        {CANVAS_ROWS.map((rowKey) => (
          <a
            key={rowKey}
            href={`#canvas-col-${rowKey}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold"
          >
            <span className={cn("size-2 rounded-full", columnTone[rowKey].dot)} />
            {ROW_LABELS[rowKey]}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border/50 bg-muted/25 p-2 sm:p-3">
        <div className="flex min-w-max gap-3 lg:min-w-0">
          {CANVAS_ROWS.map((rowKey) => {
            const tone = columnTone[rowKey];
            const columnCards = cards.filter((card) => card.rowKey === rowKey);
            const visibleCards = columnCards.filter((card) => months.includes(card.monthKey));
            const scheduledCash = laneCash(
              visibleCards.filter((card) => card.monthKey !== "unscheduled")
            );
            const unscheduled = cardsInCell(cards, rowKey, "unscheduled");

            return (
              <section
                id={`canvas-col-${rowKey}`}
                key={rowKey}
                className={cn(
                  "flex w-[78vw] max-w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm sm:w-[280px] lg:w-auto lg:min-w-0 lg:flex-1"
                )}
              >
                <header className={cn("bg-gradient-to-r px-3 py-3", tone.header)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={cn("size-2.5 shrink-0 rounded-full", tone.dot)} />
                      <p className="truncate text-sm font-semibold">{ROW_LABELS[rowKey]}</p>
                    </div>
                    <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                      {visibleCards.length}
                    </span>
                  </div>
                  <GstPair inclusive={scheduledCash.inclusive} exclusive={scheduledCash.exclusive} compact />
                </header>

                <div className={cn("flex max-h-[calc(100svh-168px)] min-h-[240px] flex-1 flex-col gap-3 overflow-y-auto p-2.5", tone.shell)}>
                  {scheduledMonths.map((monthKey) => {
                    const laneCards = cardsInCell(cards, rowKey, monthKey);
                    if (laneCards.length === 0 && !drag) return null;
                    return (
                      <MonthLane
                        key={monthKey}
                        rowKey={rowKey}
                        monthKey={monthKey}
                        label={showMonthLabels ? formatMonthLabel(monthKey) : ""}
                        cards={laneCards}
                        allCards={cards}
                        drag={drag}
                        overKey={overKey}
                        coarse={coarse}
                        months={months}
                        tone={tone}
                        dropAllowed={dropAllowed}
                        axisFor={axisFor}
                        setDrag={setDrag}
                        setOverKey={setOverKey}
                        onOpen={onOpen}
                        onSchedule={onSchedule}
                        onTemperature={onTemperature}
                        onCreateInMonth={onCreateInMonth}
                        onRejectedDrop={onRejectedDrop}
                      />
                    );
                  })}

                  {scheduledMonths.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                      Choose a start and end month.
                    </p>
                  ) : null}

                  {visibleCards.every((card) => card.monthKey === "unscheduled") &&
                  unscheduled.length === 0 &&
                  scheduledMonths.length > 0 &&
                  !drag ? (
                    <p className="px-2 py-6 text-center text-xs leading-relaxed text-muted-foreground">
                      Nothing in this column for these months.
                    </p>
                  ) : null}

                  {months.includes("unscheduled") && unscheduled.length > 0 ? (
                    <div className="space-y-2 border-t border-dashed border-border/80 pt-3">
                      <div className="flex items-center justify-between px-0.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Unscheduled
                        </p>
                        <p className="text-[11px] tabular-nums text-muted-foreground">{unscheduled.length}</p>
                      </div>
                      <MonthLane
                        rowKey={rowKey}
                        monthKey="unscheduled"
                        label=""
                        cards={unscheduled}
                        allCards={cards}
                        drag={drag}
                        overKey={overKey}
                        coarse={coarse}
                        months={months}
                        tone={tone}
                        dropAllowed={dropAllowed}
                        axisFor={axisFor}
                        setDrag={setDrag}
                        setOverKey={setOverKey}
                        onOpen={onOpen}
                        onSchedule={onSchedule}
                        onTemperature={onTemperature}
                        onCreateInMonth={onCreateInMonth}
                        onRejectedDrop={onRejectedDrop}
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthLane({
  rowKey,
  monthKey,
  label,
  cards,
  allCards,
  drag,
  overKey,
  coarse,
  months,
  tone,
  dropAllowed,
  axisFor,
  setDrag,
  setOverKey,
  onOpen,
  onSchedule,
  onTemperature,
  onCreateInMonth,
  onRejectedDrop,
}: {
  rowKey: CanvasRowKey;
  monthKey: string;
  label: string;
  cards: CanvasCard[];
  allCards: CanvasCard[];
  drag: CanvasDragPayload | null;
  overKey: string | null;
  coarse: boolean;
  months: string[];
  tone: { drop: string };
  dropAllowed: (rowKey: CanvasRowKey, monthKey: string, current: CanvasDragPayload) => boolean;
  axisFor: (clientX: number, clientY: number, current: CanvasDragPayload) => "x" | "y" | null;
  setDrag: (drag: CanvasDragPayload | null) => void;
  setOverKey: (key: string | null) => void;
  onOpen: (card: CanvasCard) => void;
  onSchedule: (card: CanvasCard, monthKey: string) => void;
  onTemperature: (card: CanvasCard, rowKey: CanvasRowKey) => void;
  onCreateInMonth: (card: CanvasCard, monthKey: string) => void;
  onRejectedDrop: (message: string) => void;
}) {
  const cellId = `${rowKey}:${monthKey}`;
  const laneTotals = laneCash(cards);
  const allowed = drag ? dropAllowed(rowKey, monthKey, drag) : false;
  const customerBlocked =
    drag?.axis === "x" &&
    drag.recordType === "opportunity" &&
    rowKey === "customer" &&
    monthKey === drag.monthKey;

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl",
        allowed && overKey === cellId && cn("p-1.5 ring-2 ring-inset", tone.drop),
        customerBlocked && overKey === cellId && "bg-rose-500/10 p-1.5 ring-2 ring-inset ring-rose-400/50"
      )}
      onDragOver={(event) => {
        if (!drag) return;
        const axis = axisFor(event.clientX, event.clientY, drag);
        const next = { ...drag, axis };
        setDrag(next);
        setOverKey(cellId);
        if (dropAllowed(rowKey, monthKey, next) || (axis === "x" && rowKey === "customer" && monthKey === drag.monthKey)) {
          event.preventDefault();
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (!drag) return;
        const axis = axisFor(event.clientX, event.clientY, drag) ?? drag.axis;
        const next = { ...drag, axis };
        const match = allCards.find((item) => item.id === drag.cardId) ?? null;
        setDrag(null);
        setOverKey(null);
        if (!axis || !match) {
          onRejectedDrop("Drag left or right for Hot, Warm, or Cold. Drag between months to change the expected month.");
          return;
        }
        if (axis === "x" && rowKey === "customer") {
          onRejectedDrop(
            "Dropping on Customers does not convert an opportunity. Open the card and use Convert to customer."
          );
          return;
        }
        if (!dropAllowed(rowKey, monthKey, next)) return;
        if (axis === "y" && match.kind === "account") {
          onCreateInMonth(match, monthKey);
          return;
        }
        if (axis === "y") onSchedule(match, monthKey);
        if (axis === "x") onTemperature(match, rowKey);
      }}
    >
      {label ? (
        <div className="flex items-baseline justify-between gap-2 px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-right text-[11px] font-medium tabular-nums text-muted-foreground">
            {formatCurrency(laneTotals.exclusive)} ex · {formatCurrency(laneTotals.inclusive)} with GST
          </p>
        </div>
      ) : null}
      {cards.length === 0 ? (
        <div className="grid min-h-16 place-items-center rounded-lg border border-dashed border-border/70 px-2 text-center text-[11px] text-muted-foreground">
          {drag ? "Drop" : label ? "—" : "Nothing here"}
        </div>
      ) : (
        cards.map((card) => (
          <div key={card.id} className="space-y-2">
            <CanvasCardView
              card={card}
              draggable={!coarse}
              onOpen={() => onOpen(card)}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", card.id);
                setDrag({
                  cardId: card.id,
                  kind: card.kind,
                  recordType: card.recordType,
                  rowKey: card.rowKey,
                  monthKey: card.monthKey,
                  customerId: card.customerId,
                  originX: event.clientX,
                  originY: event.clientY,
                  axis: null,
                });
              }}
              onDragEnd={() => {
                setDrag(null);
                setOverKey(null);
              }}
            />
            {coarse ? (
              <TouchMoves card={card} months={months} onSchedule={onSchedule} onTemperature={onTemperature} />
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}

function TouchMoves({
  card,
  months,
  onSchedule,
  onTemperature,
}: {
  card: CanvasCard;
  months: string[];
  onSchedule: (card: CanvasCard, monthKey: string) => void;
  onTemperature: (card: CanvasCard, rowKey: CanvasRowKey) => void;
}) {
  const monthChoices = months.filter((month) => month !== "unscheduled");
  const showMonth = card.kind === "receipt" && card.status !== "received" && card.status !== "cancelled";
  if (card.recordType !== "opportunity" && !showMonth) return null;

  return (
    <div className={cn("grid gap-2", card.recordType === "opportunity" && showMonth && "grid-cols-2")}>
      {card.recordType === "opportunity" ? (
        <Select
          value={card.temperature || "unclassified"}
          onValueChange={(value) =>
            onTemperature(card, value === "unclassified" ? "unclassified" : (value as CanvasRowKey))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Temperature" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unclassified">Unclassified</SelectItem>
            <SelectItem value="hot">Hot</SelectItem>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="cold">Cold</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
      {showMonth ? (
        <Select value={card.monthKey} onValueChange={(value) => onSchedule(card, value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Expected month" />
          </SelectTrigger>
          <SelectContent>
            {monthChoices.map((monthKey) => (
              <SelectItem key={monthKey} value={monthKey}>
                {formatMonthLabel(monthKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
