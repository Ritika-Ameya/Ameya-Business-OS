import { Briefcase, CalendarClock, IndianRupee, Users } from "lucide-react";
import { computeCustomerStats } from "@/features/customers/utils/customer-utils";
import { formatCurrency } from "@/shared/utils";
import { cn } from "@/shared/utils";
import type { Customer } from "@/features/customers/types/customer";
import type { SettingsStage } from "@/features/settings/types/settings";
import { StatCard } from "@/shared/components/PageHeader";

interface CustomerStatsCardsProps {
  customers: Customer[];
  stages?: SettingsStage[];
}

function BreakdownCard({
  label,
  value,
  icon,
  accentClass,
  items,
  emptyLabel,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentClass: string;
  items: Array<{ key: string; name: string; color: string; count: number }>;
  emptyLabel: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300",
        "hover:border-border hover:shadow-md"
      )}
    >
      <div
        className={cn(
          "absolute -right-3 -top-3 size-20 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-60",
          accentClass
        )}
      />
      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
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
                <span className="font-medium tabular-nums text-foreground">
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
    </div>
  );
}

export function CustomerStatsCards({
  customers,
  stages = [],
}: CustomerStatsCardsProps) {
  const stats = computeCustomerStats(customers, stages);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <BreakdownCard
        label="Customers"
        value={stats.total}
        icon={<Users className={cn("size-5", "text-blue-600 dark:text-blue-400")} />}
        accentClass="bg-blue-500/10"
        items={stats.customerByStatus.map((item) => ({
          key: item.status,
          name: item.label,
          color: item.color,
          count: item.count,
        }))}
        emptyLabel="No customers yet"
      />
      <BreakdownCard
        label="Opportunities"
        value={stats.opportunities}
        icon={
          <Briefcase className="size-5 text-indigo-600 dark:text-indigo-400" />
        }
        accentClass="bg-indigo-500/10"
        items={stats.opportunityByStage.map((stage) => ({
          key: stage.stageId,
          name: stage.stageName,
          color: stage.color,
          count: stage.count,
        }))}
        emptyLabel="No opportunity stages yet"
      />
      <StatCard
        label="Outstanding Amount"
        value={formatCurrency(stats.outstandingAmount)}
        icon={<IndianRupee className="size-5 text-amber-600 dark:text-amber-400" />}
        accent="bg-amber-500/10"
      />
      <StatCard
        label="Renewals This Month"
        value={String(stats.renewalsThisMonth)}
        icon={<CalendarClock className="size-5 text-violet-600 dark:text-violet-400" />}
        accent="bg-violet-500/10"
      />
    </div>
  );
}
