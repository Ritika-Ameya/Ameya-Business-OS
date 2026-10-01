import { useState } from "react";
import { Briefcase, CalendarClock, IndianRupee, Users } from "lucide-react";
import { computeCustomerStats } from "@/features/customers/utils/customer-utils";
import { formatBaseWithGst } from "@/features/revenue/utils/invoice-utils";
import {
  computeComponentLineTotal,
  computeComponentTaxable,
  getComponentCurrentDueDate,
  hasComponentRenewal,
} from "@/features/deals/utils/deal-component-utils";
import type { Deal } from "@/features/deals/types/deal";
import type { DealComponent } from "@/features/deals/types/deal-component";
import { formatCurrency } from "@/shared/utils";
import { cn } from "@/shared/utils";
import { formatDate, isRenewalThisMonth } from "@/shared/utils/format-date";
import type { Customer } from "@/features/customers/types/customer";
import type { SettingsStage } from "@/features/settings/types/settings";
import { StatCard } from "@/shared/components/PageHeader";
import {
  StatDetailDialog,
  type StatDetailRow,
} from "@/shared/components/StatDetailDialog";
import { ALL_TIME, thisMonthPeriod } from "@/shared/utils/period-label";

type CustomerCardKey = "customers" | "opportunities" | "outstanding" | "renewals";

interface CustomerStatsCardsProps {
  customers: Customer[];
  stages?: SettingsStage[];
  deals?: Deal[];
  components?: DealComponent[];
}

function BreakdownCard({
  label,
  value,
  icon,
  accentClass,
  barClass,
  items,
  emptyLabel,
  period,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentClass: string;
  barClass: string;
  items: Array<{ key: string; name: string; color: string; count: number }>;
  emptyLabel: string;
  period?: string;
  onClick?: () => void;
}) {
  const className = cn(
        "group relative overflow-hidden rounded-2xl border border-white/70 bg-card/95 p-5 shadow-card transition-all duration-300 dark:border-white/10",
        "hover:-translate-y-1 hover:shadow-elevated",
        barClass,
        onClick &&
          "w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      );
  const body = (
    <>
      <div
        className={cn(
          "absolute -right-3 -top-3 size-24 rounded-full opacity-50 blur-2xl transition-opacity group-hover:opacity-80",
          accentClass
        )}
      />
      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {period ? (
              <p className="text-[11px] font-medium leading-tight text-muted-foreground">
                {period}
              </p>
            ) : null}
            <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          </div>
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10",
              accentClass
            )}
          >
            {icon}
          </div>
        </div>
        {items.length > 0 ? (
          <ul className="space-y-1.5 border-t border-border/50 pt-3">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {item.count}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-border/50 pt-3 text-xs text-muted-foreground">
            {emptyLabel}
          </p>
        )}
      </div>
    </>
  );
  if (!onClick) return <div className={className}>{body}</div>;
  return (
    <button type="button" className={className} onClick={onClick} aria-haspopup="dialog">
      {body}
    </button>
  );
}

function personRow(customer: Customer, value?: string): StatDetailRow {
  return {
    id: customer.id,
    title: customer.company || customer.name,
    subtitle:
      customer.company && customer.name !== customer.company
        ? `Contact · ${customer.name}`
        : undefined,
    detail: customer.status === "inactive" ? "Status · Inactive" : "Status · Active",
    value,
    to: `/customers/${customer.id}`,
  };
}

export function CustomerStatsCards({
  customers,
  stages = [],
  deals = [],
  components = [],
}: CustomerStatsCardsProps) {
  const stats = computeCustomerStats(customers, stages);
  const [openCard, setOpenCard] = useState<CustomerCardKey | null>(null);
  const customerRecords = customers.filter((customer) => customer.recordType === "customer");
  const opportunityRecords = customers.filter(
    (customer) => customer.recordType === "opportunity"
  );
  const outstandingRecords = customerRecords
    .filter((customer) => customer.outstanding > 0.009)
    .sort((a, b) => b.outstanding - a.outstanding);
  const renewingCustomers = customerRecords.filter((customer) =>
    isRenewalThisMonth(customer.nextRenewal)
  );
  const renewingIds = new Set(renewingCustomers.map((customer) => customer.id));
  const dealById = new Map(deals.map((deal) => [deal.id, deal]));
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const renewalRows: StatDetailRow[] = components
    .filter((component) => {
      if (!hasComponentRenewal(component.renewalFrequency)) return false;
      const due = getComponentCurrentDueDate(component);
      if (!isRenewalThisMonth(due)) return false;
      const deal = dealById.get(component.dealId);
      return Boolean(deal && renewingIds.has(deal.customerId));
    })
    .map((component) => {
      const deal = dealById.get(component.dealId);
      const customer = deal ? customerById.get(deal.customerId) : undefined;
      const taxable = computeComponentTaxable(component);
      return {
        id: component.id,
        title: component.name,
        subtitle: customer?.company || customer?.name || deal?.customerName || "—",
        detail: `Deal · ${deal?.title || "—"} · due ${formatDate(getComponentCurrentDueDate(component))}`,
        value: formatBaseWithGst(
          taxable,
          computeComponentLineTotal(component) - taxable
        ),
        to: deal ? `/deals/${deal.id}` : undefined,
      };
    })
    .sort((a, b) => a.subtitle!.localeCompare(b.subtitle!));

  const detail =
    openCard === "customers"
      ? {
          title: "Customers",
          description: `${customerRecords.length} customers. The amount is what each one still has to pay.`,
          nameLabel: "Customer",
          valueLabel: "Outstanding",
          rows: customerRecords.map((customer) =>
            personRow(customer, formatCurrency(customer.outstanding))
          ),
          empty: "No customers yet.",
        }
      : openCard === "opportunities"
        ? {
            title: "Opportunities",
            description: `${opportunityRecords.length} opportunities. These are not customers yet.`,
            nameLabel: "Opportunity",
            rows: opportunityRecords.map((customer) => personRow(customer)),
            empty: "No opportunities yet.",
          }
        : openCard === "outstanding"
          ? {
              title: "Outstanding amount",
              description: `${formatCurrency(stats.outstandingAmount)} still to collect, across ${outstandingRecords.length} ${outstandingRecords.length === 1 ? "customer" : "customers"}.`,
              nameLabel: "Customer",
              valueLabel: "Outstanding",
              rows: outstandingRecords.map((customer) =>
                personRow(customer, formatCurrency(customer.outstanding))
              ),
              empty: "Nothing is outstanding.",
            }
          : openCard === "renewals"
            ? {
                title: "Renewals this month",
                description: `${renewingCustomers.length} ${renewingCustomers.length === 1 ? "customer has" : "customers have"} a plan due in ${thisMonthPeriod()}. Each amount is the base price plus GST. The figure in brackets is the total.`,
                nameLabel: "Plan",
                valueLabel: "Expected",
                rows: renewalRows,
                empty: "No renewals are due this month.",
              }
            : null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BreakdownCard
          label="Customers"
          value={stats.total}
          icon={<Users className="size-5 text-blue-600 dark:text-blue-400" />}
          accentClass="bg-blue-500/15"
          barClass="accent-bar-blue"
          items={stats.customerByStage.map((stage) => ({
            key: stage.stageId,
            name: stage.stageName,
            color: stage.color,
            count: stage.count,
          }))}
          emptyLabel="No customer stages yet"
          period={ALL_TIME}
          onClick={() => setOpenCard("customers")}
        />
        <BreakdownCard
          label="Opportunities"
          value={stats.opportunities}
          icon={
            <Briefcase className="size-5 text-indigo-600 dark:text-indigo-400" />
          }
          accentClass="bg-indigo-500/15"
          barClass="accent-bar-indigo"
          items={stats.opportunityByStage.map((stage) => ({
            key: stage.stageId,
            name: stage.stageName,
            color: stage.color,
            count: stage.count,
          }))}
          emptyLabel="No opportunity stages yet"
          period={ALL_TIME}
          onClick={() => setOpenCard("opportunities")}
        />
        <StatCard
          label="Outstanding Amount"
          value={formatCurrency(stats.outstandingAmount)}
          icon={<IndianRupee className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/15"
          barClass="accent-bar-violet"
          period={ALL_TIME}
          onClick={() => setOpenCard("outstanding")}
        />
        <StatCard
          label="Renewals This Month"
          value={String(stats.renewalsThisMonth)}
          icon={<CalendarClock className="size-5 text-teal-600 dark:text-teal-400" />}
          accent="bg-teal-500/15"
          barClass="accent-bar-teal"
          period={thisMonthPeriod()}
          onClick={() => setOpenCard("renewals")}
        />
      </div>
      <StatDetailDialog
        open={detail !== null}
        title={detail?.title ?? ""}
        description={detail?.description}
        nameLabel={detail?.nameLabel}
        valueLabel={detail?.valueLabel}
        rows={detail?.rows ?? []}
        empty={detail?.empty ?? ""}
        onOpenChange={(open) => {
          if (!open) setOpenCard(null);
        }}
      />
    </>
  );
}
