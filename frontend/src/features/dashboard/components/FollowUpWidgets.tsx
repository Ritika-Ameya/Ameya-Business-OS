import { FollowUpCard } from "@/features/dashboard/components/FollowUpCard";
import {
  getOverdueFollowUps,
  getTodaysFollowUps,
  getTomorrowsFollowUps,
} from "@/features/dashboard/utils/follow-up-utils";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";

export function FollowUpWidgets() {
  const { customers } = useCustomers();
  const { deals } = useDeals();
  const { stages } = useAppConfig();

  const todaysItems = getTodaysFollowUps(customers, deals, stages);
  const tomorrowsItems = getTomorrowsFollowUps(customers, deals, stages);
  const overdueItems = getOverdueFollowUps(customers, deals, stages);

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold tracking-tight">Follow Ups</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <FollowUpCard
          title="Today's Follow Ups"
          items={todaysItems}
          emptyMessage="No follow ups scheduled for today"
        />
        <FollowUpCard
          title="Tomorrow's Follow Ups"
          items={tomorrowsItems}
          emptyMessage="No follow ups scheduled for tomorrow"
        />
        <FollowUpCard
          title="Overdue Follow Ups"
          items={overdueItems}
          emptyMessage="No overdue follow ups"
          highlightClassName="text-red-600 dark:text-red-400"
        />
      </div>
    </section>
  );
}
