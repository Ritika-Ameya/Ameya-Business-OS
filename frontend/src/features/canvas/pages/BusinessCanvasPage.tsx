import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import {
  CanvasBreakdownDialog,
  type BreakdownKind,
} from "@/features/canvas/components/CanvasBreakdownDialog";
import { CanvasDrawer, type CreateDraft } from "@/features/canvas/components/CanvasDrawer";
import { CanvasFilters } from "@/features/canvas/components/CanvasFilters";
import { CanvasMatrix } from "@/features/canvas/components/CanvasMatrix";
import { CanvasSummary } from "@/features/canvas/components/CanvasSummary";
import { MarkReceiptPaidDialog } from "@/features/canvas/components/MarkReceiptPaidDialog";
import {
  defaultCanvasFilters,
  type CanvasBoard,
  type CanvasCard,
  type CanvasRowKey,
  type PeriodPick,
  type RangePreset,
} from "@/features/canvas/types/canvas";
import {
  cardsInMonths,
  filterCanvasCards,
  formatMonthLabel,
  monthKeyOf,
  parseToday,
  periodPickFor,
  placeCarriedForward,
  quarterLabel,
  renewalsInView,
  summarizeView,
  visibleMonthKeys,
} from "@/features/canvas/utils/canvas-utils";
import { ApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { toLocalIsoDate } from "@/shared/utils";

const periodLabelFor = (months: string[]): string => {
  const scheduled = months.filter((month) => month !== "unscheduled");
  if (scheduled.length === 0) return "this period";
  if (scheduled.length === 1) return formatMonthLabel(scheduled[0]);
  const first = /^(\d{4})-(\d{2})$/.exec(scheduled[0]);
  if (first && scheduled.length === 3 && (Number(first[2]) - 1) % 3 === 0) {
    const quarterEnd = monthKeyOf(new Date(Number(first[1]), Number(first[2]) + 1, 1));
    if (scheduled[2] === quarterEnd) {
      return quarterLabel(Number(first[1]), Math.floor((Number(first[2]) - 1) / 3));
    }
  }
  return `${formatMonthLabel(scheduled[0])} – ${formatMonthLabel(scheduled[scheduled.length - 1])}`;
};

export function BusinessCanvasPage() {
  const [board, setBoard] = useState<CanvasBoard | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultCanvasFilters);
  const [preset, setPreset] = useState<RangePreset>("this-month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [pick, setPick] = useState<PeriodPick>(() => periodPickFor(toLocalIsoDate()));
  const [selected, setSelected] = useState<CanvasCard | null>(null);
  const [draft, setDraft] = useState<CreateDraft | null>(null);
  const [paying, setPaying] = useState<CanvasCard | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownKind | null>(null);
  const [coarse, setCoarse] = useState(false);

  const load = async () => {
    setError("");
    try {
      setBoard(await canvasApi.getBoard());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Business Canvas could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(query.matches || window.innerWidth < 768);
    update();
    query.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      query.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const today = board?.today ?? new Date().toISOString().slice(0, 10);
  const filtered = useMemo(
    () => filterCanvasCards(board?.cards ?? [], filters),
    [board?.cards, filters]
  );
  const months = useMemo(
    () => visibleMonthKeys(preset, today, customFrom, customTo, filtered, filters.status, pick),
    [preset, today, customFrom, customTo, filtered, filters.status, pick]
  );
  const overdueView = filters.status === "overdue";
  const visible = useMemo(
    () =>
      cardsInMonths(overdueView ? filtered : placeCarriedForward(filtered, months, today), months),
    [filtered, months, today, overdueView]
  );
  const summary = useMemo(
    () => summarizeView(visible, months, board?.paid ?? [], filters.q, filtered),
    [visible, months, board?.paid, filters.q, filtered]
  );
  const renewals = useMemo(
    () => renewalsInView(board?.renewals ?? [], months, overdueView, filters.q),
    [board?.renewals, months, overdueView, filters.q]
  );
  const periodLabel = overdueView ? "overdue months" : periodLabelFor(months);
  const firstMonth = months.filter((month) => month !== "unscheduled").sort()[0] ?? "";
  const years = useMemo(() => {
    const current = parseToday(today).getFullYear();
    const set = new Set<number>([pick.year]);
    for (let year = current - 3; year <= current + 2; year += 1) set.add(year);
    for (const card of board?.cards ?? []) {
      const year = Number(card.monthKey.slice(0, 4));
      if (Number.isInteger(year) && year > 2000) set.add(year);
    }
    return [...set].sort((a, b) => a - b);
  }, [today, pick.year, board?.cards]);
  const filtersActive =
    filters.q.trim() !== "" ||
    filters.status === "overdue" ||
    preset !== "this-month" ||
    customFrom !== "" ||
    customTo !== "";

  const clearFilters = () => {
    setFilters(defaultCanvasFilters());
    setPreset("this-month");
    setCustomFrom("");
    setCustomTo("");
    setPick(periodPickFor(today));
  };

  const mutate = async (action: () => Promise<CanvasBoard>) => {
    setNotice("");
    setError("");
    try {
      setBoard(await action());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That change could not be saved.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="h-1 w-10 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500" />
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Business Canvas</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Money to collect by month. Tap any total to see exactly what is counted.
          </p>
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={() => {
            setSelected(null);
            setDraft({ customerId: "", expectedDate: "" });
          }}
        >
          <Plus className="size-4" />
          Add expected receipt
        </Button>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">{notice}</p>
      ) : null}

      <CanvasFilters
        query={filters.q}
        preset={preset}
        overdue={filters.status === "overdue"}
        customFrom={customFrom}
        customTo={customTo}
        pick={pick}
        years={years}
        showClear={filtersActive}
        onQuery={(value) => setFilters((current) => ({ ...current, q: value }))}
        onMonth={(value) => {
          if (value === "overdue") {
            setFilters((current) => ({ ...current, status: "overdue" }));
            return;
          }
          setPreset(value);
          setFilters((current) => ({ ...current, status: "all" }));
        }}
        onCustomFrom={setCustomFrom}
        onCustomTo={setCustomTo}
        onPick={setPick}
        onClear={clearFilters}
      />

      {board && !loading ? (
        <>
          <CanvasSummary
            summary={summary}
            renewals={renewals}
            today={today}
            periodLabel={periodLabel}
            showCarried={!overdueView}
            onOpen={setBreakdown}
          />
          <CanvasBreakdownDialog
            kind={breakdown}
            summary={summary}
            renewals={renewals}
            periodLabel={periodLabel}
            firstMonth={firstMonth}
            today={today}
            onClose={() => setBreakdown(null)}
            onOpenCard={(card) => {
              setBreakdown(null);
              setDraft(null);
              setSelected(card);
            }}
          />
        </>
      ) : null}

      {loading || !board ? (
        <div className="rounded-2xl border px-4 py-10 text-sm text-muted-foreground">
          Loading Business Canvas…
        </div>
      ) : (
        <CanvasMatrix
          cards={visible}
          months={months}
          coarse={coarse}
          onOpen={(card) => {
            setDraft(null);
            setSelected(card);
          }}
          onSchedule={(card, monthKey) => {
            void mutate(() => canvasApi.schedule(card.id, monthKey));
          }}
          onTemperature={(card, rowKey: CanvasRowKey) => {
            const temperature = rowKey === "unclassified" ? "" : rowKey;
            if (temperature !== "hot" && temperature !== "warm" && temperature !== "cold" && temperature !== "") {
              return;
            }
            void mutate(() => canvasApi.setTemperature(card.customerId, temperature));
          }}
          onCreateInMonth={(card, monthKey) => {
            setSelected(card);
            setDraft({
              customerId: card.customerId,
              expectedDate: `${monthKey}-15`,
            });
          }}
          onRejectedDrop={setNotice}
        />
      )}

      {board ? (
        <CanvasDrawer
          board={board}
          card={selected}
          draft={draft}
          onClose={() => {
            setSelected(null);
            setDraft(null);
          }}
          onBoard={setBoard}
          onMarkPaid={(card) => {
            setSelected(null);
            setDraft(null);
            setPaying(card);
          }}
        />
      ) : null}

      <MarkReceiptPaidDialog
        card={paying}
        today={today}
        onOpenChange={(open) => {
          if (!open) setPaying(null);
        }}
        onBoard={(next) => {
          setBoard(next);
          setNotice("");
          setError("");
        }}
      />
    </div>
  );
}
