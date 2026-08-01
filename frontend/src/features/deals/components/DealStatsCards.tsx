import { CalendarClock, Handshake, Layers, Sparkles } from "lucide-react";
import { StatCard } from "@/shared/components/PageHeader";
import { isRenewalThisMonth } from "@/shared/utils/format-date";
import { hasComponentRenewal } from "@/features/deals/utils/deal-component-utils";
import type { Deal } from "@/features/deals/types/deal";
import type { DealComponent } from "@/features/deals/types/deal-component";

interface DealStatsCardsProps {
  deals: Deal[];
  components?: DealComponent[];
}

export function DealStatsCards({ deals, components = [] }: DealStatsCardsProps) {
  const activeCount = deals.filter((deal) => deal.status === "active").length;
  const renewalsThisMonth = components.filter(
    (component) =>
      hasComponentRenewal(component.renewalFrequency) &&
      isRenewalThisMonth(component.renewalDate)
  ).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Deals"
        value={String(deals.length)}
        icon={<Handshake className="size-5 text-blue-600 dark:text-blue-400" />}
        accent="bg-blue-500/10"
      />
      <StatCard
        label="Active Deals"
        value={String(activeCount)}
        icon={<Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />}
        accent="bg-emerald-500/10"
      />
      <StatCard
        label="Components"
        value={String(components.length)}
        icon={<Layers className="size-5 text-amber-600 dark:text-amber-400" />}
        accent="bg-amber-500/10"
      />
      <StatCard
        label="Renewals This Month"
        value={String(renewalsThisMonth)}
        icon={<CalendarClock className="size-5 text-violet-600 dark:text-violet-400" />}
        accent="bg-violet-500/10"
      />
    </div>
  );
}
