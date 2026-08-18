import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { StatCard } from "@/shared/components/PageHeader";
import { cn } from "@/shared/utils";
import type { RenewalFilters } from "@/features/revenue/types/revenue";
import {
  filterRenewalsByScope,
  filtersForRenewalCard,
  getCompanyRenewals,
  getRenewalStats,
  isRenewalCardActive,
  type RenewalCardKey,
} from "@/features/revenue/utils/revenue-utils";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useCustomers } from "@/features/customers/hooks/use-customers";

interface RevenueRenewalsStatsProps {
  filters: RenewalFilters;
  onFiltersChange: (filters: RenewalFilters) => void;
}

export function RevenueRenewalsStats({
  filters,
  onFiltersChange,
}: RevenueRenewalsStatsProps) {
  const { deals, components } = useDeals();
  const { customers } = useCustomers();

  const stats = useMemo(() => {
    const scoped = filterRenewalsByScope(
      getCompanyRenewals(deals, components, customers),
      filters
    );
    return getRenewalStats(scoped);
  }, [deals, components, customers, filters]);

  const cards: Array<{
    key: RenewalCardKey;
    label: string;
    value: string;
    icon: ReactNode;
    accent: string;
  }> = [
    {
      key: "upcomingThisMonth",
      label: "Upcoming This Month",
      value: stats.upcomingThisMonth,
      icon: <CalendarClock className="size-5 text-blue-600 dark:text-blue-400" />,
      accent: "bg-blue-500/10",
    },
    {
      key: "nextMonth",
      label: "Next Month",
      value: stats.nextMonth,
      icon: <Clock3 className="size-5 text-sky-600 dark:text-sky-400" />,
      accent: "bg-sky-500/10",
    },
    {
      key: "quarter",
      label: "Quarter",
      value: stats.quarter,
      icon: <CalendarRange className="size-5 text-violet-600 dark:text-violet-400" />,
      accent: "bg-violet-500/10",
    },
    {
      key: "nextQuarter",
      label: "Next Quarter",
      value: stats.nextQuarter,
      icon: <CalendarDays className="size-5 text-indigo-600 dark:text-indigo-400" />,
      accent: "bg-indigo-500/10",
    },
    {
      key: "expired",
      label: "Expired",
      value: stats.expired,
      icon: <AlertCircle className="size-5 text-red-600 dark:text-red-400" />,
      accent: "bg-red-500/10",
    },
    {
      key: "renewed",
      label: "Customers Renewed",
      value: stats.renewedCustomers,
      icon: <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />,
      accent: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const active = isRenewalCardActive(card.key, filters);
        return (
          <button
            key={card.key}
            type="button"
            className={cn(
              "rounded-2xl text-left transition-shadow",
              active && "ring-2 ring-primary/40"
            )}
            onClick={() => onFiltersChange(filtersForRenewalCard(card.key, filters))}
            aria-pressed={active}
          >
            <StatCard
              label={card.label}
              value={card.value}
              icon={card.icon}
              accent={card.accent}
            />
          </button>
        );
      })}
    </div>
  );
}
