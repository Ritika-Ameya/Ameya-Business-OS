import { formatCurrency } from "@/shared/utils";

export function splitInclusive(amount: number, taxPercent: number | null | undefined) {
  const percent = Number(taxPercent) || 0;
  if (percent <= 0) return { exclusive: amount, gst: 0, percent: 0 };
  const exclusive = Math.round((amount / (1 + percent / 100)) * 100) / 100;
  return { exclusive, gst: Math.round((amount - exclusive) * 100) / 100, percent };
}

function gstPart(inclusive: number, exclusive: number): number {
  return Math.round((inclusive - exclusive) * 100) / 100;
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
  const gst = gstPart(inclusive, without);
  const hasGst = gst > 0.009;

  if (!hasGst) {
    if (compact) {
      return (
        <p className="mt-1 text-sm font-semibold tabular-nums leading-tight">
          {formatCurrency(inclusive)}{" "}
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            No GST
          </span>
        </p>
      );
    }
    return (
      <p className="mt-2 text-xs font-medium text-muted-foreground">
        <span className="font-semibold tabular-nums text-foreground">{formatCurrency(inclusive)}</span>
        {" · No GST"}
      </p>
    );
  }

  const rate = percent != null && percent > 0 ? ` ${percent}%` : "";
  const split = `${formatCurrency(without)} + GST${rate} ${formatCurrency(gst)}`;

  if (compact) {
    return (
      <div className="mt-1 space-y-0.5">
        <p className="text-sm font-semibold tabular-nums leading-tight">
          {formatCurrency(inclusive)}{" "}
          <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            Total
          </span>
        </p>
        <p className="text-[11px] tabular-nums text-muted-foreground">{split}</p>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg bg-violet-500/12 px-2 py-1.5 ring-1 ring-violet-500/20">
      <p className="text-[11px] font-medium tabular-nums text-muted-foreground">{split}</p>
      <p className="text-xs font-semibold tabular-nums text-violet-800 dark:text-violet-100">
        Total {formatCurrency(inclusive)}
      </p>
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
