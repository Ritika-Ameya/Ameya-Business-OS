import { FollowUpCard } from "@/features/dashboard/components/FollowUpCard";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import type { FollowUpItem } from "@/features/dashboard/types/dashboard";

export function FollowUpWidgets() {
  const { summary } = useDashboard();

  const todaysItems = (summary?.followUps.today ?? []) as FollowUpItem[];
  const tomorrowsItems = (summary?.followUps.tomorrow ?? []) as FollowUpItem[];
  const overdueItems = (summary?.followUps.overdue ?? []) as FollowUpItem[];

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
