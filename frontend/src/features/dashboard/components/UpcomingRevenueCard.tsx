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
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 bg-gradient-to-r from-orange-500/10 to-amber-500/5 px-5 py-4">
        <div>
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/50 text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Invoice Number</th>
                <th className="px-3 py-3 font-medium">Due Date</th>
                <th className="px-3 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="max-w-[160px] truncate px-5 py-3 font-medium">
                    {item.customer}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{item.invoiceNumber}</td>
                  <td className="px-3 py-3 text-muted-foreground">{item.dueDate}</td>
                  <td className="px-3 py-3 text-right font-medium">{item.amount}</td>
                  <td className="px-5 py-3 capitalize text-muted-foreground">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-auto border-t border-border/50 px-5 py-3">
        <Button variant="ghost" size="sm" className="w-full rounded-xl" asChild>
          <Link to="/revenue?tab=invoices">
            View Invoices
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
