import {
  Briefcase,
  FilePenLine,
  Receipt,
  RefreshCw,
  Trash2,
  UserPlus,
  Wallet,
} from "lucide-react";
import {
  formatActivityTime,
  getRecentActivity,
} from "@/features/dashboard/utils/dashboard-utils";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { cn } from "@/shared/utils";
import type { DashboardActivityType } from "@/features/dashboard/types/dashboard";

const activityConfig: Record<
  DashboardActivityType,
  { icon: typeof Receipt; accent: string; iconColor: string }
> = {
  customer_created: {
    icon: UserPlus,
    accent: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  opportunity_created: {
    icon: Briefcase,
    accent: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  invoice_generated: {
    icon: Receipt,
    accent: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  payment_received: {
    icon: Wallet,
    accent: "bg-teal-500/10",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  renewal_added: {
    icon: RefreshCw,
    accent: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  customer_updated: {
    icon: FilePenLine,
    accent: "bg-sky-500/10",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  entity_deleted: {
    icon: Trash2,
    accent: "bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
};

export function RecentActivityFeed() {
  const { summary } = useDashboard();
  const activities = getRecentActivity(summary);

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="text-base font-semibold tracking-tight">Recent Actions</h3>
      </div>

      {activities.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No recent actions yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {activities.map((activity) => {
            const config = activityConfig[activity.type] ?? activityConfig.customer_updated;
            const Icon = config.icon;

            return (
              <div key={activity.id} className="flex gap-4 px-5 py-4">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    config.accent
                  )}
                >
                  <Icon className={cn("size-4", config.iconColor)} />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatActivityTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
