import { useState, type ReactNode } from "react";
import { RenewalFilterChips, RenewalRows } from "@/features/dashboard/components/RenewalFilterList";
import {
  DEFAULT_RENEWAL_FILTER,
  filterRenewals,
  renewalFilterLabel,
  type RenewalFilter,
} from "@/features/dashboard/utils/renewal-filter";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatInvoiceCurrency, formatInvoiceDate } from "@/features/revenue/utils/invoice-utils";
import { formatDate } from "@/shared/utils/format-date";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type {
  DashboardMoneyFlowDto,
  DashboardSummaryDto,
} from "@/features/dashboard/api/dashboard.dto";
import type { DashboardKpi } from "@/features/dashboard/types/dashboard";
import { calendarMonthPeriod, quarterPeriod } from "@/shared/utils/period-label";

interface DashboardKpiDetailDialogProps {
  kpi: DashboardKpi | null;
  summary: DashboardSummaryDto | null;
  onOpenChange: (open: boolean) => void;
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function DetailList({
  empty,
  children,
}: {
  empty: string;
  children: ReactNode;
}) {
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60">
      {children}
    </div>
  );
}

function ListRow({
  title,
  subtitle,
  detail,
  value,
}: {
  title: string;
  subtitle?: string;
  detail?: string;
  value?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
        {detail ? (
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </div>
      {value ? (
        <p className="shrink-0 text-right text-xs font-semibold tabular-nums sm:text-sm">
          {value}
        </p>
      ) : null}
    </div>
  );
}

function RevenueBody({ summary }: { summary: DashboardSummaryDto }) {
  const items = summary.revenueThisMonthItems ?? [];
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <StatChip label="This month" value={formatInvoiceCurrency(summary.revenueThisMonth)} />
        <StatChip label="Last month" value={formatInvoiceCurrency(summary.revenueLastMonth)} />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Invoices issued this month
        </p>
        <DetailList empty="No invoices were issued this month.">
          {items.map((item) => (
            <ListRow
              key={item.id}
              title={item.invoiceNumber}
              subtitle={`${item.customer} · ${formatInvoiceDate(item.issueDate)}`}
              value={formatInvoiceCurrency(item.received)}
            />
          ))}
        </DetailList>
        {items.length >= 20 ? (
          <p className="mt-2 text-xs text-muted-foreground">Showing the top 20 by collected amount.</p>
        ) : null}
      </div>
    </>
  );
}

function CollectionsBody({ summary }: { summary: DashboardSummaryDto }) {
  const items = summary.pendingCollections ?? [];
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <StatChip
          label="Outstanding"
          value={formatInvoiceCurrency(summary.outstandingCollections)}
        />
        <StatChip
          label="Invoices pending"
          value={String(summary.pendingInvoiceCount)}
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Highest balances
        </p>
        <DetailList empty="There is no outstanding balance right now.">
          {items.map((item) => (
            <ListRow
              key={item.id}
              title={item.customer}
              subtitle={`Due ${formatInvoiceDate(item.dueDate)}`}
              value={formatInvoiceCurrency(item.outstanding)}
            />
          ))}
        </DetailList>
      </div>
    </>
  );
}

function MoneyFlowBody({
  flow,
  thisLabel,
  listTitle,
  empty,
}: {
  flow: DashboardMoneyFlowDto | undefined;
  thisLabel: string;
  listTitle: string;
  empty: string;
}) {
  const items = flow?.items ?? [];
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <StatChip label={thisLabel} value={formatInvoiceCurrency(flow?.thisMonth ?? 0)} />
        <StatChip label="Last month" value={formatInvoiceCurrency(flow?.lastMonth ?? 0)} />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {listTitle} · {items.length}
        </p>
        <DetailList empty={empty}>
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/invoices/${item.invoiceId}`}
              className="block transition-colors hover:bg-muted/50"
            >
              <ListRow
                title={item.company}
                subtitle={`${item.invoiceNumber} · ${formatInvoiceDate(item.date)}`}
                value={formatInvoiceCurrency(item.amount)}
              />
            </Link>
          ))}
        </DetailList>
      </div>
    </>
  );
}

function RenewalsBody({ summary }: { summary: DashboardSummaryDto }) {
  const [filter, setFilter] = useState<RenewalFilter>(DEFAULT_RENEWAL_FILTER);
  const all = summary.renewalsAll ?? [];
  const items = filterRenewals(all, filter);
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return (
    <>
      <RenewalFilterChips items={all} value={filter} onChange={setFilter} />
      <div className="grid grid-cols-2 gap-2">
        <StatChip label={renewalFilterLabel(filter)} value={`${items.length} ${items.length === 1 ? "plan" : "plans"}`} />
        <StatChip label="Value with GST" value={formatInvoiceCurrency(totalAmount)} />
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60">
        <RenewalRows items={items} empty={`No renewals for ${renewalFilterLabel(filter).toLowerCase()}.`} />
      </div>
    </>
  );
}

function RenewedBody({ summary }: { summary: DashboardSummaryDto }) {
  const items = summary.renewedCustomersList ?? [];
  return (
    <>
      <StatChip
        label="Unique customers"
        value={String(summary.renewedCustomersThisQuarter)}
      />
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Last renewed in {quarterPeriod()}
        </p>
        <DetailList empty="No customers have a last-renewed date in this quarter.">
          {items.map((item) => (
            <ListRow
              key={item.id}
              title={item.customer}
              subtitle={item.deal || "—"}
              detail={`${item.component || "—"} · Renewed ${formatDate(item.lastRenewedDate)}`}
              value={formatInvoiceCurrency(item.amount || 0)}
            />
          ))}
        </DetailList>
      </div>
    </>
  );
}

function getKpiCopy(id: string): { description: string; cta: string } {
  switch (id) {
    case "revenue":
      return {
        description: `Collected amount on invoices issued in ${calendarMonthPeriod()}, excluding cancelled invoices. This is not the billed total, and it does not include payments this month against older invoices.`,
        cta: "Open invoices",
      };
    case "received":
      return {
        description: `Payments recorded as received with a payment date in ${calendarMonthPeriod()}, whichever month the invoice was raised in. Amounts include GST.`,
        cta: "Open collections",
      };
    case "invoiced":
      return {
        description: `Total (with GST) of invoices raised in ${calendarMonthPeriod()}, by invoice date. Drafts and cancelled invoices are left out. Whether they are paid yet does not matter here.`,
        cta: "Open invoices",
      };
    case "collections":
      return {
        description:
          "Sum of remaining balances on invoices that are still collectible — not draft, paid, or cancelled. This matches the Balance Amount column on Collections when no filters are applied.",
        cta: "Open collections",
      };
    case "renewals":
      return {
        description:
          "Every plan with a renewal cycle, at its next unpaid renewal date. The card counts next month; use the filters to see overdue, this month, the next 3 months or all. A renewal leaves the list once its invoice is fully paid. Amounts include GST.",
        cta: "Open renewals",
      };
    case "renewed":
      return {
        description: `Unique customers with a last-renewed date in ${quarterPeriod()}. A customer with several components still counts once. The list shows each renewed deal and component.`,
        cta: "Open renewals",
      };
    default:
      return { description: "Breakdown for this snapshot figure.", cta: "View details" };
  }
}

export function DashboardKpiDetailDialog({
  kpi,
  summary,
  onOpenChange,
}: DashboardKpiDetailDialogProps) {
  const open = Boolean(kpi && summary);
  const meta = kpi ? getKpiCopy(kpi.id) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(92dvh,720px)] w-full max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg max-sm:top-auto max-sm:bottom-0 max-sm:left-1/2 max-sm:w-full max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto mt-2 hidden h-1 w-10 rounded-full bg-muted-foreground/30 max-sm:block" />
        <DialogHeader className="space-y-2 px-4 pt-3 pr-12 sm:px-5">
          <DialogTitle>{kpi?.label}</DialogTitle>
          {kpi?.period ? (
            <p className="text-xs font-medium text-muted-foreground">{kpi.period}</p>
          ) : null}
          <p className="text-2xl font-bold tabular-nums tracking-tight">{kpi?.value}</p>
          <DialogDescription>{meta?.description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
          {summary && kpi?.id === "revenue" ? <RevenueBody summary={summary} /> : null}
          {summary && kpi?.id === "received" ? (
            <MoneyFlowBody
              flow={summary.received}
              thisLabel="This month"
              listTitle="Payments received this month"
              empty="No payment has been received this month."
            />
          ) : null}
          {summary && kpi?.id === "invoiced" ? (
            <MoneyFlowBody
              flow={summary.invoiced}
              thisLabel="This month"
              listTitle="Invoices raised this month"
              empty="No invoice has been raised this month."
            />
          ) : null}
          {summary && kpi?.id === "collections" ? <CollectionsBody summary={summary} /> : null}
          {summary && kpi?.id === "renewals" ? <RenewalsBody summary={summary} /> : null}
          {summary && kpi?.id === "renewed" ? <RenewedBody summary={summary} /> : null}
        </div>

        <DialogFooter className="-mx-0 -mb-0 mt-0 rounded-none sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {kpi?.href ? (
            <Button asChild>
              <Link to={kpi.href}>
                {meta?.cta ?? "View details"}
                <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
