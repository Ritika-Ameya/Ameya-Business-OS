import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { DashboardKpiCards } from "@/components/dashboard/DashboardKpiCards";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { FounderInsightBanner } from "@/components/dashboard/FounderInsightBanner";
import { PendingCollectionsCard } from "@/components/dashboard/PendingCollectionsCard";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { UpcomingRenewalsCard } from "@/components/dashboard/UpcomingRenewalsCard";

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
