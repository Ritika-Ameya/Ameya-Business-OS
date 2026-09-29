import { ArrowRight, BellRing, CalendarClock, CheckCircle2, History, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  SOURCE_LABELS,
  type CanvasCard,
  type CanvasPaidEntry,
  type CanvasRenewalReminder,
} from "@/features/canvas/types/canvas";
import {
  RENEWAL_REMINDER_DAYS,
  formatMonthLabel,
  isRenewalDueSoon,
  ownMonthOf,
  timeRemainingLabel,
  type CanvasViewSummary,
} from "@/features/canvas/utils/canvas-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { cn, formatCurrency, formatDate } from "@/shared/utils";

export type BreakdownKind = "outstanding" | "expected" | "carried" | "paid" | "renewals";

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  "half-yearly": "Half-yearly",
  yearly: "Yearly",
  biennial: "Every 2 years",
  custom: "Custom cycle",
};

const HEADERS: Record<BreakdownKind, { title: string; icon: ReactNode; tone: string }> = {
  outstanding: {
    title: "To collect",
    icon: <Wallet className="size-4" />,
    tone: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  expected: {
    title: "Due in period",
    icon: <CalendarClock className="size-4" />,
    tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  carried: {
    title: "Carried forward",
    icon: <History className="size-4" />,
    tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
  paid: {
    title: "Paid",
    icon: <CheckCircle2 className="size-4" />,
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  renewals: {
    title: "Renewals",
    icon: <BellRing className="size-4" />,
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
};

const sum = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;

function groupBy<T>(items: T[], key: (item: T) => string): Array<[string, T[]]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const value = key(item);
    groups.set(value, [...(groups.get(value) ?? []), item]);
  }
  return [...groups.entries()];
}

export function CanvasBreakdownDialog({
  kind,
  summary,
  renewals,
  periodLabel,
  firstMonth,
  today,
  onClose,
  onOpenCard,
}: {
  kind: BreakdownKind | null;
  summary: CanvasViewSummary;
  renewals: CanvasRenewalReminder[];
  periodLabel: string;
  firstMonth: string;
  today: string;
  onClose: () => void;
  onOpenCard: (card: CanvasCard) => void;
}) {
  const header = kind ? HEADERS[kind] : null;
  const toCollect = sum([summary.expected.amount, summary.carried.amount]);

  const description: Record<BreakdownKind, string> = {
    outstanding: `Everything still to collect for ${periodLabel}: ${formatCurrency(toCollect)} across ${
      summary.expected.count + summary.carried.count
    } receipts.`,
    expected: `${summary.expected.count} unpaid ${
      summary.expected.count === 1 ? "receipt" : "receipts"
    } dated in ${periodLabel}.`,
    carried: `${summary.carried.count} unpaid ${
      summary.carried.count === 1 ? "receipt" : "receipts"
    } from before ${firstMonth ? formatMonthLabel(firstMonth) : "this period"}, still waiting to be paid.`,
    paid: `${summary.paid.count} ${summary.paid.count === 1 ? "payment" : "payments"} received in ${periodLabel}.`,
    renewals: `${renewals.length} ${renewals.length === 1 ? "plan renews" : "plans renew"} in or before ${periodLabel}.`,
  };

  return (
    <Dialog open={Boolean(kind)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="flex max-h-[88svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl sm:p-0">
        {kind && header ? (
          <>
            <DialogHeader className="border-b border-border/60 px-5 pb-4 pt-5 text-left">
              <div className="flex items-center gap-2.5">
                <span className={cn("grid size-8 place-items-center rounded-xl", header.tone)}>
                  {header.icon}
                </span>
                <DialogTitle className="text-lg">{header.title}</DialogTitle>
              </div>
              <DialogDescription className="pt-1">{description[kind]}</DialogDescription>
            </DialogHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {kind === "outstanding" ? (
                <OutstandingBody summary={summary} toCollect={toCollect} onOpenCard={onOpenCard} />
              ) : null}
              {kind === "expected" ? (
                <CardsBody
                  cards={summary.items.expected}
                  total={summary.expected}
                  empty={`Nothing unpaid is dated in ${periodLabel}.`}
                  onOpenCard={onOpenCard}
                  rules={[
                    `Counts every unpaid expected receipt whose expected date is in ${periodLabel}.`,
                    "Invoice balance = invoice total minus the payments already received on it.",
                    "Renewal, licence and subscription = the plan's amount with GST, only while it is not invoiced yet. Once invoiced, the invoice balance is counted instead, never both.",
                    "Instalments and manual receipts use the amount entered on the receipt.",
                    "Paid and cancelled receipts are not counted.",
                  ]}
                />
              ) : null}
              {kind === "carried" ? (
                <CardsBody
                  cards={summary.items.carried}
                  total={summary.carried}
                  empty="Nothing is unpaid from earlier months."
                  groupLabel={(month) => `From ${formatMonthLabel(month)}`}
                  onOpenCard={onOpenCard}
                  rules={[
                    `Counts unpaid receipts whose expected date is before ${
                      firstMonth ? formatMonthLabel(firstMonth) : "this period"
                    }.`,
                    "An unpaid receipt stays outstanding in every later month until it is paid. It is the same receipt each time, never a copy, and it is counted once here.",
                    "On the board it sits in one column, tagged “Carried forward from …”.",
                    "It leaves this list as soon as the payment is recorded (Mark as paid, or a payment on the invoice).",
                  ]}
                />
              ) : null}
              {kind === "paid" ? (
                <PaidBody entries={summary.items.paid} total={summary.paid.amount} periodLabel={periodLabel} />
              ) : null}
              {kind === "renewals" ? (
                <RenewalsBody renewals={renewals} today={today} periodLabel={periodLabel} />
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Rules({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">How this is counted</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={cn("min-w-0 flex-1 rounded-xl px-3 py-2", tone)}>
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="truncate text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function OutstandingBody({
  summary,
  toCollect,
  onOpenCard,
}: {
  summary: CanvasViewSummary;
  toCollect: number;
  onOpenCard: (card: CanvasCard) => void;
}) {
  const cards = [...summary.items.carried, ...summary.items.expected];
  return (
    <>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Pill label="Due in period" value={formatCurrency(summary.expected.amount)} tone="bg-sky-500/10 text-sky-800 dark:text-sky-200" />
        <span className="text-center text-lg font-semibold text-muted-foreground">+</span>
        <Pill label="Carried forward" value={formatCurrency(summary.carried.amount)} tone="bg-rose-500/10 text-rose-800 dark:text-rose-200" />
        <span className="text-center text-lg font-semibold text-muted-foreground">=</span>
        <Pill label="To collect" value={formatCurrency(toCollect)} tone="bg-violet-500/15 text-violet-800 dark:text-violet-100" />
      </div>
      <p className="text-xs text-muted-foreground">
        Without GST: {formatCurrency(sum([summary.expected.exGst, summary.carried.exGst]))}. Each receipt is counted
        once.
      </p>

      {summary.byMonth.length > 1 ? (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Month</th>
                <th className="px-3 py-2 text-right font-semibold">Due</th>
                <th className="px-3 py-2 text-right font-semibold">Unpaid from before</th>
                <th className="px-3 py-2 text-right font-semibold">Paid</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {summary.byMonth.map((month) => (
                <tr key={month.monthKey} className="border-t border-border/50">
                  <td className="px-3 py-2 font-medium">{formatMonthLabel(month.monthKey)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(month.expected)}</td>
                  <td className="px-3 py-2 text-right text-rose-700 dark:text-rose-300">{formatCurrency(month.carried)}</td>
                  <td className="px-3 py-2 text-right text-emerald-700 dark:text-emerald-300">{formatCurrency(month.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-border/50 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            “Unpaid from before” is the balance still open at the start of each month, so the same receipt shows in
            every later month until paid. Don't add these rows together; the total above counts each receipt once.
          </p>
        </div>
      ) : null}

      <CardList cards={cards} onOpenCard={onOpenCard} empty="Nothing left to collect in this period." />
      <Rules
        items={[
          "To collect = Due in period + Carried forward.",
          "Due in period: unpaid receipts dated in the chosen months.",
          "Carried forward: unpaid receipts from earlier months. They stay until paid.",
          "Amounts include GST. Paid, cancelled and replaced receipts are left out.",
        ]}
      />
    </>
  );
}

function CardsBody({
  cards,
  total,
  empty,
  rules,
  groupLabel,
  onOpenCard,
}: {
  cards: CanvasCard[];
  total: { count: number; amount: number; exGst: number };
  empty: string;
  rules: string[];
  groupLabel?: (month: string) => string;
  onOpenCard: (card: CanvasCard) => void;
}) {
  const bySource = groupBy(cards, (card) => card.sourceType || "other");
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-2xl font-bold tabular-nums">{formatCurrency(total.amount)}</p>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(total.exGst)} without GST · {total.count} {total.count === 1 ? "item" : "items"}
        </p>
      </div>
      {bySource.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {bySource.map(([source, items]) => (
            <span key={source} className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px]">
              <span className="font-semibold">{SOURCE_LABELS[source as keyof typeof SOURCE_LABELS] ?? source}</span>
              <span className="text-muted-foreground">
                {" "}
                · {items.length} · {formatCurrency(sum(items.map((card) => card.expectedAmount ?? 0)))}
              </span>
            </span>
          ))}
        </div>
      ) : null}
      <CardList cards={cards} onOpenCard={onOpenCard} empty={empty} groupLabel={groupLabel} />
      <Rules items={rules} />
    </>
  );
}

function CardList({
  cards,
  empty,
  groupLabel = formatMonthLabel,
  onOpenCard,
}: {
  cards: CanvasCard[];
  empty: string;
  groupLabel?: (month: string) => string;
  onOpenCard: (card: CanvasCard) => void;
}) {
  if (cards.length === 0) {
    return <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="space-y-3">
      {groupBy(cards, ownMonthOf).map(([month, items]) => (
        <section key={month} className="overflow-hidden rounded-2xl border border-border/60">
          <header className="flex items-baseline justify-between gap-2 bg-muted/40 px-3 py-2">
            <p className="text-xs font-semibold">{month === "unscheduled" ? "No date" : groupLabel(month)}</p>
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {items.length} · {formatCurrency(sum(items.map((card) => card.expectedAmount ?? 0)))}
            </p>
          </header>
          <ul className="divide-y divide-border/50">
            {items.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => onOpenCard(card)}
                  className="group flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{card.companyName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {card.sourceType ? SOURCE_LABELS[card.sourceType] : "Receipt"}
                      {card.reason ? ` · ${card.reason}` : card.invoiceNumber ? ` · ${card.invoiceNumber}` : ""}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      {card.expectedDate ? formatDate(card.expectedDate) : "No date"}
                      {card.status === "overdue" ? (
                        <span className="rounded-full bg-rose-500/15 px-1.5 py-px font-semibold text-rose-700 dark:text-rose-300">
                          Overdue
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(card.expectedAmount ?? 0)}</p>
                      <p className="text-[11px] tabular-nums text-muted-foreground">
                        {formatCurrency(card.amountExGst ?? card.expectedAmount ?? 0)} ex-GST
                      </p>
                    </div>
                    <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PaidBody({
  entries,
  total,
  periodLabel,
}: {
  entries: CanvasPaidEntry[];
  total: number;
  periodLabel: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{formatCurrency(total)}</p>
        <p className="text-xs text-muted-foreground">
          {entries.length} {entries.length === 1 ? "payment" : "payments"}
        </p>
      </div>
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No payment was received in {periodLabel}.
        </p>
      ) : (
        <div className="space-y-3">
          {groupBy(entries, (entry) => entry.paidAt.slice(0, 7)).map(([month, items]) => (
            <section key={month} className="overflow-hidden rounded-2xl border border-border/60">
              <header className="flex items-baseline justify-between gap-2 bg-muted/40 px-3 py-2">
                <p className="text-xs font-semibold">{formatMonthLabel(month)}</p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {items.length} · {formatCurrency(sum(items.map((entry) => entry.amount)))}
                </p>
              </header>
              <ul className="divide-y divide-border/50">
                {items.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <Link
                        to={`/customers/${entry.customerId}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {entry.companyName}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(entry.paidAt)} ·{" "}
                        <Link to={`/invoices/${entry.invoiceId}`} className="text-primary hover:underline">
                          {entry.invoiceNumber || "Invoice"}
                        </Link>
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(entry.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <Rules
        items={[
          `Counts payments with status Received and a payment date in ${periodLabel}.`,
          "Every payment is recorded against an invoice, whether it was entered on the invoice or with Mark as paid on this board.",
          "The amount is what was received, with GST.",
          "Paid receipts are already left out of Due and Carried forward, so nothing is subtracted twice.",
        ]}
      />
    </>
  );
}

function RenewalsBody({
  renewals,
  today,
  periodLabel,
}: {
  renewals: CanvasRenewalReminder[];
  today: string;
  periodLabel: string;
}) {
  const soon = renewals.filter((item) => isRenewalDueSoon(item, today));
  const later = renewals.filter((item) => !isRenewalDueSoon(item, today));
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-2xl font-bold tabular-nums">{formatCurrency(sum(renewals.map((item) => item.amount)))}</p>
        <p className="text-xs text-muted-foreground">
          {renewals.length} {renewals.length === 1 ? "renewal" : "renewals"} · {soon.length} need attention
        </p>
      </div>
      {renewals.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No plan renews in {periodLabel}.
        </p>
      ) : null}
      {soon.length > 0 ? (
        <RenewalGroup title={`Needs attention · overdue or due within ${RENEWAL_REMINDER_DAYS} days`} items={soon} today={today} highlight />
      ) : null}
      {later.length > 0 ? <RenewalGroup title="Later" items={later} today={today} /> : null}
      <Rules
        items={[
          "Lists every plan (a deal item with a renewal cycle) whose next unpaid renewal falls in or before the chosen months. An unpaid renewal stays listed until it is paid.",
          `Needs attention = overdue, or due within ${RENEWAL_REMINDER_DAYS} days, so you get about a month's notice.`,
          "Amount = the plan's price with GST. When the renewal invoice is raised, it is shown here and the board counts the invoice balance instead.",
          "When the renewal invoice is fully paid, the plan moves to its next renewal date (for example next year). Nothing is stored for reminders, so they can't duplicate.",
          "Board columns also include invoice balances and instalments, so a month on the board can hold more cards than it has renewals.",
        ]}
      />
    </>
  );
}

function RenewalGroup({
  title,
  items,
  today,
  highlight = false,
}: {
  title: string;
  items: CanvasRenewalReminder[];
  today: string;
  highlight?: boolean;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border",
        highlight ? "border-amber-500/40 bg-amber-500/[0.04]" : "border-border/60"
      )}
    >
      <header className={cn("px-3 py-2 text-xs font-semibold", highlight ? "bg-amber-500/10" : "bg-muted/40")}>
        {title}
      </header>
      <ul className="divide-y divide-border/50">
        {items.map((item) => {
          const overdue = item.status === "overdue";
          return (
            <li key={item.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <Link to={`/customers/${item.customerId}`} className="block truncate text-sm font-medium hover:underline">
                  {item.companyName}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {item.componentName}
                  {item.renewalFrequency ? ` · ${FREQUENCY_LABELS[item.renewalFrequency] ?? item.renewalFrequency}` : ""}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/80">{formatDate(item.renewalDate)}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px font-semibold",
                      overdue
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    )}
                  >
                    {timeRemainingLabel(item.renewalDate, today)}
                  </span>
                  {item.invoiceId ? (
                    <Link to={`/invoices/${item.invoiceId}`} className="text-primary hover:underline">
                      Invoiced · {item.invoiceNumber || "open"}
                    </Link>
                  ) : item.dealId ? (
                    <Link to={`/deals/${item.dealId}`} className="text-primary hover:underline">
                      Not invoiced yet
                    </Link>
                  ) : (
                    <span>Not invoiced yet</span>
                  )}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(item.amount)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
