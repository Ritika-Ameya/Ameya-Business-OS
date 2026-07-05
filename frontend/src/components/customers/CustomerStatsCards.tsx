import { CalendarClock, IndianRupee, UserCheck, Users } from "lucide-react";
import { computeCustomerStats, formatCurrency } from "@/lib/customer-utils";
import type { Customer } from "@/types/customer";
import { StatCard } from "@/shared/components/PageHeader";

interface CustomerStatsCardsProps {
  customers: Customer[];
}

export function CustomerStatsCards({ customers }: CustomerStatsCardsProps) {
  const stats = computeCustomerStats(customers);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Customers"
        value={String(stats.total)}
        icon={<Users className="size-5 text-blue-600 dark:text-blue-400" />}
        accent="bg-blue-500/10"
      />
      <StatCard
        label="Active Customers"
        value={String(stats.active)}
        icon={<UserCheck className="size-5 text-emerald-600 dark:text-emerald-400" />}
        accent="bg-emerald-500/10"
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
