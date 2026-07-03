import { CalendarClock, Handshake, Layers, Sparkles } from "lucide-react";
import { StatCard } from "@/components/customers/PageHeader";
import { isRenewalThisMonth } from "@/lib/deal-utils";
import type { Deal } from "@/types/deal";

interface DealStatsCardsProps {
  deals: Deal[];
}

export function DealStatsCards({ deals }: DealStatsCardsProps) {
  const activeCount = deals.filter((deal) => deal.status === "active").length;
  const renewalsThisMonth = deals.filter((deal) =>
    isRenewalThisMonth(deal.nextRenewal)
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
        value="—"
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
