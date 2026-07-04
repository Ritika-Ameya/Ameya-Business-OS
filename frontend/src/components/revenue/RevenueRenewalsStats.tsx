import { AlertCircle, CalendarClock, CheckCircle2, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { StatCard } from "@/components/customers/PageHeader";
import { useDeals } from "@/hooks/use-deals";
import { getCompanyRenewals, getRenewalStats } from "@/lib/revenue-utils";

export function RevenueRenewalsStats() {
  const { deals } = useDeals();
  const stats = useMemo(
    () => getRenewalStats(getCompanyRenewals(deals)),
    [deals]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Upcoming This Month"
        value={stats.upcomingThisMonth}
        icon={<CalendarClock className="size-5 text-blue-600 dark:text-blue-400" />}
        accent="bg-blue-500/10"
      />
      <StatCard
        label="Overdue"
        value={stats.overdue}
        icon={<AlertCircle className="size-5 text-red-600 dark:text-red-400" />}
        accent="bg-red-500/10"
      />
      <StatCard
        label="Renewed"
        value={stats.renewed}
        icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
        accent="bg-emerald-500/10"
      />
      <StatCard
        label="Renewal Value"
        value={stats.renewalValue}
        icon={<RefreshCw className="size-5 text-violet-600 dark:text-violet-400" />}
        accent="bg-violet-500/10"
      />
    </div>
  );
}
