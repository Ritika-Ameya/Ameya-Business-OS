import { FollowUpWidgets } from "@/features/dashboard/components/FollowUpWidgets";
import { DashboardGreeting } from "@/features/dashboard/components/DashboardGreeting";
import { DashboardKpiCards } from "@/features/dashboard/components/DashboardKpiCards";
import { DashboardQuickActions } from "@/features/dashboard/components/DashboardQuickActions";
import { FounderInsightBanner } from "@/features/dashboard/components/FounderInsightBanner";
import { PendingCollectionsCard } from "@/features/dashboard/components/PendingCollectionsCard";
import { RecentActivityFeed } from "@/features/dashboard/components/RecentActivityFeed";
import { RevenueExpenseChart } from "@/features/dashboard/components/RevenueExpenseChart";
import { UpcomingRenewalsCard } from "@/features/dashboard/components/UpcomingRenewalsCard";
import { UpcomingRevenueCard } from "@/features/dashboard/components/UpcomingRevenueCard";

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-violet-500" />
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      {subtitle ? (
        <p className="pl-3 text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardGreeting />

      <FounderInsightBanner />

      <section className="space-y-4">
        <SectionTitle title="Business Snapshot" subtitle="Live KPIs across revenue and operations" />
        <DashboardKpiCards />
      </section>

      <section>
        <RevenueExpenseChart />
      </section>

      <section className="space-y-4">
        <FollowUpWidgets />
      </section>

      <section className="space-y-4">
        <SectionTitle title="Action Required" subtitle="Collections and renewals needing attention" />
        <div className="grid gap-4 lg:grid-cols-2">
          <PendingCollectionsCard />
          <UpcomingRenewalsCard />
        </div>
      </section>

      <section className="space-y-4">
        <UpcomingRevenueCard />
      </section>

      <section className="space-y-4">
        <RecentActivityFeed />
      </section>

      <section className="space-y-4">
        <SectionTitle title="Quick Actions" subtitle="Jump into common workflows" />
        <DashboardQuickActions />
      </section>
    </div>
  );
}
