import {
  Briefcase,
  CreditCard,
  Receipt,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { formatActivityTime } from "@/features/dashboard/utils/dashboard-utils";
import { useRecentActivities } from "@/shared/hooks/use-activities";
import type { ActivityAction } from "@/shared/types/activity";
import { cn } from "@/shared/utils";
import type { DashboardActivityType } from "@/features/dashboard/types/dashboard";

const activityConfig: Record<
  DashboardActivityType,
  { icon: typeof Receipt; accent: string; iconColor: string }
> = {
  invoice_generated: {
    icon: Receipt,
    accent: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  payment_recorded: {
    icon: Wallet,
    accent: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  deal_created: {
    icon: Briefcase,
    accent: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  renewal_completed: {
    icon: RefreshCw,
    accent: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  expense_added: {
    icon: CreditCard,
    accent: "bg-muted",
    iconColor: "text-muted-foreground",
  },
};

function mapActionToType(action: ActivityAction): DashboardActivityType {
  if (action === "invoice_generated") return "invoice_generated";
  if (action === "payment_recorded") return "payment_recorded";
  if (action === "deal_created") return "deal_created";
  if (action === "renewal_updated") return "renewal_completed";
  return "expense_added";
}

export function RecentActivityFeed() {
  const activities = useRecentActivities();

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="text-base font-semibold tracking-tight">Recent Activity</h3>
      </div>

      <div className="divide-y divide-border/50">
        {activities.map((activity) => {
          const config = activityConfig[mapActionToType(activity.action)];
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
                <p className="text-sm text-muted-foreground">
                  {activity.description ?? ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
