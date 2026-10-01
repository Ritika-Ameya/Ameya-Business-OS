import { useState } from "react";
import { CalendarClock, Handshake, Layers, Sparkles } from "lucide-react";
import { StatCard } from "@/shared/components/PageHeader";
import { StatDetailDialog, type StatDetailRow } from "@/shared/components/StatDetailDialog";
import { formatCurrency } from "@/shared/utils";
import { formatDate, isRenewalThisMonth } from "@/shared/utils/format-date";
import { ALL_TIME, thisMonthPeriod } from "@/shared/utils/period-label";
import { formatBaseWithGst } from "@/features/revenue/utils/invoice-utils";
import {
  computeComponentLineTotal,
  computeComponentTaxable,
  hasComponentRenewal,
  getComponentCurrentDueDate,
} from "@/features/deals/utils/deal-component-utils";
import type { Deal } from "@/features/deals/types/deal";
import type { DealComponent } from "@/features/deals/types/deal-component";

type DealCardKey = "all" | "active" | "components" | "renewals";

interface DealStatsCardsProps {
  deals: Deal[];
  components?: DealComponent[];
}

function dealRow(deal: Deal): StatDetailRow {
  return {
    id: deal.id,
    title: deal.title,
    subtitle: deal.customerName || "No customer",
    detail: `Status · ${deal.status}`,
    value: formatCurrency(deal.contractValue ?? 0),
    to: `/deals/${deal.id}`,
  };
}

export function DealStatsCards({ deals, components = [] }: DealStatsCardsProps) {
  const [openCard, setOpenCard] = useState<DealCardKey | null>(null);
  const activeDeals = deals.filter((deal) => deal.status === "active");
  const dealById = new Map(deals.map((deal) => [deal.id, deal]));
  const renewals = components.filter(
    (component) =>
      hasComponentRenewal(component.renewalFrequency) &&
      isRenewalThisMonth(getComponentCurrentDueDate(component))
  );
  const renewalRows: StatDetailRow[] = renewals.map((component) => {
    const deal = dealById.get(component.dealId);
    const taxable = computeComponentTaxable(component);
    return {
      id: component.id,
      title: component.name,
      subtitle: deal?.customerName || "—",
      detail: `Deal · ${deal?.title || "—"} · due ${formatDate(getComponentCurrentDueDate(component))}`,
      value: formatBaseWithGst(taxable, computeComponentLineTotal(component) - taxable),
      to: deal ? `/deals/${deal.id}` : undefined,
    };
  });

  const detail =
    openCard === "all"
      ? {
          title: "All deals",
          description: `${deals.length} deals. The amount is the contract value on the deal.`,
          nameLabel: "Deal",
          valueLabel: "Contract value",
          rows: deals.map(dealRow),
          empty: "No deals yet.",
        }
      : openCard === "active"
        ? {
            title: "Active deals",
            description: `${activeDeals.length} active. The amount is the contract value.`,
            nameLabel: "Deal",
            valueLabel: "Contract value",
            rows: activeDeals.map(dealRow),
            empty: "No active deals.",
          }
        : openCard === "components"
          ? {
              title: "Components",
              description: `${components.length} billable items across deals.`,
              nameLabel: "Component",
              rows: components.map((component) => {
                const deal = dealById.get(component.dealId);
                return {
                  id: component.id,
                  title: component.name,
                  subtitle: `Deal · ${deal?.title || "—"}`,
                  detail: deal?.customerName ? `Customer · ${deal.customerName}` : "No customer linked",
                  to: deal ? `/deals/${deal.id}` : undefined,
                };
              }),
              empty: "No components yet.",
            }
          : openCard === "renewals"
            ? {
                title: "Renewals this month",
                description: `${renewals.length} ${renewals.length === 1 ? "plan" : "plans"} due in ${thisMonthPeriod()}. Each amount is the base price plus GST. The figure in brackets is the total.`,
                nameLabel: "Plan",
                valueLabel: "Expected",
                rows: renewalRows,
                empty: "No renewals are due this month.",
              }
            : null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Deals"
          value={String(deals.length)}
          icon={<Handshake className="size-5 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-500/10"
          period={ALL_TIME}
          onClick={() => setOpenCard("all")}
        />
        <StatCard
          label="Active Deals"
          value={String(activeDeals.length)}
          icon={<Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/10"
          period={ALL_TIME}
          onClick={() => setOpenCard("active")}
        />
        <StatCard
          label="Components"
          value={String(components.length)}
          icon={<Layers className="size-5 text-amber-600 dark:text-amber-400" />}
          accent="bg-amber-500/10"
          period={ALL_TIME}
          onClick={() => setOpenCard("components")}
        />
        <StatCard
          label="Renewals This Month"
          value={String(renewals.length)}
          icon={<CalendarClock className="size-5 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-500/10"
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
