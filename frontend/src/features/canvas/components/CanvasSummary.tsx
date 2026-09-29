import { ArrowUpRight, BellRing, CalendarClock, CheckCircle2, History, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import type { BreakdownKind } from "@/features/canvas/components/CanvasBreakdownDialog";
import type { CanvasRenewalReminder } from "@/features/canvas/types/canvas";
import { isRenewalDueSoon, type CanvasViewSummary } from "@/features/canvas/utils/canvas-utils";
import { cn, formatCurrency } from "@/shared/utils";

function Tile({
  icon,
  label,
  amount,
  detail,
  badge,
  tone,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  amount: number;
  detail: string;
  badge?: ReactNode;
  tone: { ring: string; icon: string; glow: string };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-2xl border bg-card px-3.5 py-3 text-left shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2",
        tone.ring
      )}
    >
      <span className={cn("pointer-events-none absolute -right-6 -top-6 size-20 rounded-full blur-2xl", tone.glow)} />
      <span className="relative flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", tone.icon)}>{icon}</span>
          <span className="truncate text-xs font-semibold text-muted-foreground">{label}</span>
        </span>
        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
      </span>
      <span className="relative mt-2 block truncate text-lg font-bold tabular-nums leading-tight sm:text-xl">
        {formatCurrency(amount)}
      </span>
      <span className="relative mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="truncate">{detail}</span>
        {badge}
      </span>
    </button>
  );
}

const items = (count: number, one = "item", many = "items") => `${count} ${count === 1 ? one : many}`;

export function CanvasSummary({
  summary,
  renewals,
  today,
  periodLabel,
  showCarried,
  onOpen,
}: {
  summary: CanvasViewSummary;
  renewals: CanvasRenewalReminder[];
  today: string;
  periodLabel: string;
  showCarried: boolean;
  onOpen: (kind: BreakdownKind) => void;
}) {
  const toCollect = summary.expected.amount + summary.carried.amount;
  const toCollectExGst = summary.expected.exGst + summary.carried.exGst;
  const dueSoon = renewals.filter((item) => isRenewalDueSoon(item, today)).length;

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-6">
      <button
        type="button"
        onClick={() => onOpen("outstanding")}
        className="group relative col-span-2 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 px-4 py-3.5 text-left text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <span className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/15 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-16 left-10 size-40 rounded-full bg-amber-300/20 blur-3xl" />
        <span className="relative flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/85">
            <Wallet className="size-4" />
            To collect · {periodLabel}
          </span>
          <ArrowUpRight className="size-4 opacity-70 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="relative mt-1.5 block text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          {formatCurrency(toCollect)}
        </span>
        <span className="relative mt-0.5 block text-xs text-white/80">
          {formatCurrency(toCollectExGst)} without GST · {items(summary.expected.count + summary.carried.count, "receipt", "receipts")}
        </span>
      </button>

      <Tile
        icon={<CalendarClock className="size-4" />}
        label="Due in period"
        amount={summary.expected.amount}
        detail={items(summary.expected.count)}
        tone={{ ring: "border-sky-500/25 focus-visible:ring-sky-400", icon: "bg-sky-500/15 text-sky-600", glow: "bg-sky-400/20" }}
        onClick={() => onOpen("expected")}
      />
      {showCarried ? (
        <Tile
          icon={<History className="size-4" />}
          label="Carried forward"
          amount={summary.carried.amount}
          detail={summary.carried.count ? `${items(summary.carried.count)} unpaid` : "Nothing pending"}
          tone={{ ring: "border-rose-500/25 focus-visible:ring-rose-400", icon: "bg-rose-500/15 text-rose-600", glow: "bg-rose-400/20" }}
          onClick={() => onOpen("carried")}
        />
      ) : null}
      <Tile
        icon={<CheckCircle2 className="size-4" />}
        label="Paid"
        amount={summary.paid.amount}
        detail={items(summary.paid.count, "payment", "payments")}
        tone={{ ring: "border-emerald-500/25 focus-visible:ring-emerald-400", icon: "bg-emerald-500/15 text-emerald-600", glow: "bg-emerald-400/20" }}
        onClick={() => onOpen("paid")}
      />
      <Tile
        icon={<BellRing className="size-4" />}
        label="Renewals"
        amount={renewals.reduce((sum, item) => sum + item.amount, 0)}
        detail={items(renewals.length, "plan", "plans")}
        badge={
          dueSoon > 0 ? (
            <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-px font-semibold text-amber-700 dark:text-amber-300">
              {dueSoon} due soon
            </span>
          ) : null
        }
        tone={{ ring: "border-amber-500/30 focus-visible:ring-amber-400", icon: "bg-amber-500/15 text-amber-600", glow: "bg-amber-400/25" }}
        onClick={() => onOpen("renewals")}
      />
    </div>
  );
}
