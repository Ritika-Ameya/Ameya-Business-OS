import {
  Briefcase,
  ChevronDown,
  FilePenLine,
  Receipt,
  RefreshCw,
  Trash2,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-card/95 shadow-card accent-bar-indigo dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 border-b border-border/50 bg-gradient-to-r from-indigo-500/10 to-blue-500/5 px-5 py-4 text-left transition-colors hover:from-indigo-500/15 hover:to-blue-500/10"
      >
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Recent Actions</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {activities.length === 0
              ? "No recent activity"
              : `${activities.length} recent ${activities.length === 1 ? "action" : "actions"}`}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open &&
        (activities.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">No recent actions yet</p>
          </div>
        ) : (
          <div className="max-h-80 divide-y divide-border/50 overflow-y-auto">
            {activities.map((activity) => {
              const config =
                activityConfig[activity.type] ?? activityConfig.customer_updated;
              const Icon = config.icon;

              return (
                <div key={activity.id} className="flex gap-4 px-5 py-3.5">
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
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}
