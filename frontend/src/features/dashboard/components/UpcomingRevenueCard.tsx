import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { getUpcomingRevenue } from "@/features/dashboard/utils/dashboard-utils";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";

export function UpcomingRevenueCard() {
  const { summary } = useDashboard();
  const { items, totalExpectedRevenue } = getUpcomingRevenue(summary);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-card/95 shadow-card accent-bar-orange dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 bg-gradient-to-r from-orange-500/10 to-amber-500/5 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">Upcoming Revenue</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Revenue expected next month
          </p>
        </div>
        <div className="rounded-xl bg-orange-500/10 px-3 py-2 text-right ring-1 ring-orange-500/15">
          <p className="text-xs text-muted-foreground">Total Expected Revenue</p>
          <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
            {totalExpectedRevenue}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No revenue due next month</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1 px-4 py-3.5 text-sm transition-colors hover:bg-orange-500/[0.04] sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.customer}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.invoiceNumber}
                </p>
              </div>
              <span className="font-semibold text-orange-700 dark:text-orange-300 sm:text-right">
                {item.amount}
              </span>
              <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground sm:col-span-1 sm:flex-col sm:items-end sm:gap-0.5">
                <span>{item.dueDate}</span>
                <span className="capitalize">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto border-t border-border/50 px-4 py-3 sm:px-5">
        <Button variant="ghost" size="sm" className="min-h-11 w-full rounded-xl sm:min-h-8" asChild>
          <Link to="/revenue?tab=invoices">
            View Invoices
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
