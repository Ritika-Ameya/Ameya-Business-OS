import { DashboardGreeting } from "@/features/dashboard/components/DashboardGreeting";
import { DashboardKpiCards } from "@/features/dashboard/components/DashboardKpiCards";
import { DashboardQuickActions } from "@/features/dashboard/components/DashboardQuickActions";
import { FounderInsightBanner } from "@/features/dashboard/components/FounderInsightBanner";
import { PendingCollectionsCard } from "@/features/dashboard/components/PendingCollectionsCard";
import { RecentActivityFeed } from "@/features/dashboard/components/RecentActivityFeed";
import { RevenueExpenseChart } from "@/features/dashboard/components/RevenueExpenseChart";
import { UpcomingRenewalsCard } from "@/features/dashboard/components/UpcomingRenewalsCard";

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardGreeting />

      <FounderInsightBanner />

      <section className="space-y-4">
        <DashboardKpiCards />
      </section>

      <section>
        <RevenueExpenseChart />
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight">Action Required</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <PendingCollectionsCard />
          <UpcomingRenewalsCard />
        </div>
      </section>

      <section className="space-y-4">
        <RecentActivityFeed />
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight">Quick Actions</h2>
        <DashboardQuickActions />
      </section>
    </div>
  );
}
