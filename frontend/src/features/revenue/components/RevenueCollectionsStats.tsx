import { useMemo } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, IndianRupee } from "lucide-react";
import { StatCard } from "@/shared/components/PageHeader";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { getCollectionStats } from "@/features/revenue/utils/revenue-utils";

export function RevenueCollectionsStats() {
  const { invoices, payments } = useRevenue();
  const stats = useMemo(
    () => getCollectionStats(invoices, payments),
    [invoices, payments]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Outstanding Amount"
        value={stats.outstandingAmount}
        icon={<IndianRupee className="size-5 text-amber-600 dark:text-amber-400" />}
        accent="bg-amber-500/10"
      />
      <StatCard
        label="Invoices Pending"
        value={stats.pendingCount}
        icon={<CalendarClock className="size-5 text-blue-600 dark:text-blue-400" />}
        accent="bg-blue-500/10"
      />
      <StatCard
        label="Overdue Collections"
        value={stats.overdueCount}
        icon={<AlertCircle className="size-5 text-red-600 dark:text-red-400" />}
        accent="bg-red-500/10"
      />
      <StatCard
        label="Collected This Month"
        value={stats.collectedThisMonth}
        icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
        accent="bg-emerald-500/10"
      />
    </div>
  );
}
