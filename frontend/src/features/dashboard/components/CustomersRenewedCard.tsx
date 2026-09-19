import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { thisQuarterPeriod } from "@/shared/utils/period-label";
import { getRenewedCustomersTop5 } from "@/features/dashboard/utils/dashboard-utils";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";

export function CustomersRenewedCard() {
  const { summary } = useDashboard();
  const items = getRenewedCustomersTop5(summary);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-card/95 shadow-card transition-shadow duration-300 hover:shadow-elevated accent-bar-emerald dark:border-white/10">
      <div className="flex items-start justify-between gap-3 border-b border-border/50 bg-gradient-to-r from-emerald-500/10 to-lime-500/5 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Customers Renewed</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{thisQuarterPeriod()}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 className="size-5" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No customers renewed this quarter</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {items.map((item) => (
            <div key={item.id} className="space-y-1 px-5 py-3.5 text-sm transition-colors hover:bg-emerald-500/[0.04]">
              <div className="flex items-start justify-between gap-3">
                <span className="truncate font-medium">{item.customer}</span>
                <span className="shrink-0 font-semibold tabular-nums">{item.amount}</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{item.deal}</p>
              <p className="truncate text-xs text-muted-foreground">{item.component}</p>
              <p className="text-xs text-muted-foreground">Renewed {item.lastRenewedDate}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto border-t border-border/50 px-5 py-3">
        <Button variant="ghost" size="sm" className="w-full rounded-xl" asChild>
          <Link to="/revenue?tab=renewals">
            View All
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
