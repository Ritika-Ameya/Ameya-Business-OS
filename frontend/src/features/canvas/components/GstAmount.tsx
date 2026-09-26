import { formatCurrency } from "@/shared/utils";

export function splitInclusive(amount: number, taxPercent: number | null | undefined) {
  const percent = Number(taxPercent) || 0;
  if (percent <= 0) return { exclusive: amount, gst: 0, percent: 0 };
  const exclusive = Math.round((amount / (1 + percent / 100)) * 100) / 100;
  return { exclusive, gst: Math.round((amount - exclusive) * 100) / 100, percent };
}

export function GstPair({
  inclusive,
  exclusive,
  percent,
  compact = false,
}: {
  inclusive: number | null;
  exclusive: number | null;
  percent?: number | null;
  compact?: boolean;
}) {
  if (inclusive == null) {
    return <p className="text-sm text-muted-foreground">No amount yet</p>;
  }
  const without = exclusive ?? inclusive;
  const rateLabel =
    percent == null ? "" : percent > 0 ? `GST ${percent}%` : "No GST";

  if (compact) {
    return (
      <div className="mt-1 space-y-0.5">
        <p className="text-sm font-semibold tabular-nums leading-tight">
          {formatCurrency(inclusive)}{" "}
          <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            with GST
          </span>
        </p>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {formatCurrency(without)} without GST
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-muted/70 px-2 py-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Without GST</p>
          <p className="text-xs font-semibold tabular-nums">{formatCurrency(without)}</p>
        </div>
        <div className="rounded-lg bg-violet-500/12 px-2 py-1.5 ring-1 ring-violet-500/20">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            With GST
          </p>
          <p className="text-xs font-semibold tabular-nums text-violet-800 dark:text-violet-100">
            {formatCurrency(inclusive)}
          </p>
        </div>
      </div>
      {rateLabel ? <p className="mt-1 text-[10px] font-medium text-muted-foreground">{rateLabel}</p> : null}
    </div>
  );
}

export function GstHighlight({ exclusive, inclusive }: { exclusive: number; inclusive: number }) {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/8 to-transparent shadow-sm">
      <div className="px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Without GST</p>
        <p className="text-base font-semibold tabular-nums">{formatCurrency(exclusive)}</p>
      </div>
      <div className="w-px bg-violet-500/20" />
      <div className="bg-violet-500/10 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
          With GST
        </p>
        <p className="text-lg font-bold tabular-nums text-violet-800 dark:text-violet-100">
          {formatCurrency(inclusive)}
        </p>
      </div>
    </div>
  );
}
