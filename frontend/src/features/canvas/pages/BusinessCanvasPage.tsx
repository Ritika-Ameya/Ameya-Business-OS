import { useEffect, useMemo, useState } from "react";
import { canvasApi } from "@/features/canvas/api/canvas.api";
import { CanvasDrawer, type CreateDraft } from "@/features/canvas/components/CanvasDrawer";
import { CanvasFilters } from "@/features/canvas/components/CanvasFilters";
import { CanvasMatrix } from "@/features/canvas/components/CanvasMatrix";
import { GstHighlight } from "@/features/canvas/components/GstAmount";
import {
  defaultCanvasFilters,
  type CanvasBoard,
  type CanvasCard,
  type CanvasRowKey,
  type RangePreset,
} from "@/features/canvas/types/canvas";
import {
  cardsInMonths,
  filterCanvasCards,
  visibleMonthKeys,
} from "@/features/canvas/utils/canvas-utils";
import { ApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";

export function BusinessCanvasPage() {
  const [board, setBoard] = useState<CanvasBoard | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultCanvasFilters);
  const [preset, setPreset] = useState<RangePreset>("this-month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selected, setSelected] = useState<CanvasCard | null>(null);
  const [draft, setDraft] = useState<CreateDraft | null>(null);
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
    () => visibleMonthKeys(preset, today, customFrom, customTo, filtered, filters.status),
    [preset, today, customFrom, customTo, filtered, filters.status]
  );
  const visible = useMemo(() => cardsInMonths(filtered, months), [filtered, months]);
  const viewTotal = visible.reduce(
    (sum, card) => {
      if (card.status !== "expected" && card.status !== "overdue") return sum;
      return {
        exclusive: sum.exclusive + (card.amountExGst ?? card.expectedAmount ?? 0),
        inclusive: sum.inclusive + (card.expectedAmount ?? 0),
      };
    },
    { exclusive: 0, inclusive: 0 }
  );
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-1 w-10 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500" />
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Business Canvas</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GstHighlight exclusive={viewTotal.exclusive} inclusive={viewTotal.inclusive} />
          <Button
            type="button"
            onClick={() => {
              setSelected(null);
              setDraft({ customerId: "", expectedDate: "" });
            }}
          >
            Add expected receipt
          </Button>
        </div>
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
        onClear={clearFilters}
      />

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
        />
      ) : null}
    </div>
  );
}
