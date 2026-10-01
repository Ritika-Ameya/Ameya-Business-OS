import { ArrowRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { RenewalFilterChips, RenewalRows } from "@/features/dashboard/components/RenewalFilterList";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import {
  DEFAULT_RENEWAL_FILTER,
  filterRenewals,
  renewalFilterLabel,
  type RenewalFilter,
} from "@/features/dashboard/utils/renewal-filter";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";

export function UpcomingRenewalsCard() {
  const { summary } = useDashboard();
  const [filter, setFilter] = useState<RenewalFilter>(DEFAULT_RENEWAL_FILTER);
  const all = summary?.renewalsAll ?? [];
  const items = filterRenewals(all, filter);
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-card/95 shadow-card transition-shadow duration-300 hover:shadow-elevated accent-bar-teal dark:border-white/10">
      <div className="space-y-3 border-b border-border/50 bg-gradient-to-r from-teal-500/10 to-cyan-500/5 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Renewals</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {renewalFilterLabel(filter)} · {items.length} {items.length === 1 ? "plan" : "plans"} ·{" "}
              {formatInvoiceCurrency(total)} before GST
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-300">
            <RefreshCw className="size-5" />
          </div>
        </div>
        <RenewalFilterChips items={all} value={filter} onChange={setFilter} />
      </div>

      <RenewalRows
        items={items}
        limit={5}
        empty={`No renewals for ${renewalFilterLabel(filter).toLowerCase()}.`}
      />

      <div className="mt-auto border-t border-border/50 px-5 py-3">
        <Button variant="ghost" size="sm" className="w-full rounded-xl" asChild>
          <Link to="/revenue?tab=renewals">
            {items.length > 5 ? `View all ${items.length}` : "Open renewals"}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
