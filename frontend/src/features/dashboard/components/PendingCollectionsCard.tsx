import { ArrowRight, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { getPendingCollectionsTop5 } from "@/features/dashboard/utils/dashboard-utils";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";

export function PendingCollectionsCard() {
  const { summary } = useDashboard();
  const items = getPendingCollectionsTop5(summary);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-card/95 shadow-card transition-shadow duration-300 hover:shadow-elevated accent-bar-violet dark:border-white/10">
      <div className="flex items-start justify-between gap-3 border-b border-border/50 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Pending Collections</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Outstanding amounts due soon</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-300">
          <Wallet className="size-5" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No pending collections</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 px-5 py-3.5 text-sm transition-colors hover:bg-violet-500/[0.04] sm:grid-cols-[1fr_auto_auto]"
            >
              <span className="truncate font-medium">{item.customer}</span>
              <span className="font-semibold text-violet-700 dark:text-violet-300 sm:text-right">
                {item.outstanding}
              </span>
              <span className="col-span-2 text-xs text-muted-foreground sm:col-span-1 sm:text-right">
                {item.dueDate}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto border-t border-border/50 px-5 py-3">
        <Button variant="ghost" size="sm" className="w-full rounded-xl" asChild>
          <Link to="/revenue?tab=collections">
            View All
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
