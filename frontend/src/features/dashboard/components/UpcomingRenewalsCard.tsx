import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { getUpcomingRenewalsTop5 } from "@/features/dashboard/utils/dashboard-utils";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useMemo } from "react";

export function UpcomingRenewalsCard() {
  const { deals, components } = useDeals();
  const items = useMemo(
    () => getUpcomingRenewalsTop5(deals, components),
    [deals, components]
  );

  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight">Upcoming Renewals</h3>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No upcoming renewals</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 px-5 py-3 text-sm sm:grid-cols-[1fr_auto_auto]"
            >
              <span className="font-medium truncate">{item.customer}</span>
              <span className="truncate text-muted-foreground sm:max-w-[140px] sm:text-right">
                {item.renewal}
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
          <Link to="/revenue?tab=renewals">
            View All
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
