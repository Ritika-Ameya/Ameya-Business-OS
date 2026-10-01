import { Link } from "react-router-dom";
import type { DashboardRenewalItemDto } from "@/features/dashboard/api/dashboard.dto";
import {
  FREQUENCY_LABELS,
  RENEWAL_FILTERS,
  renewalFilterCounts,
  renewalTimeLeft,
  todayIso,
  type RenewalFilter,
} from "@/features/dashboard/utils/renewal-filter";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import { cn } from "@/shared/utils";
import { formatDate } from "@/shared/utils/format-date";

export function RenewalFilterChips({
  items,
  value,
  onChange,
}: {
  items: DashboardRenewalItemDto[];
  value: RenewalFilter;
  onChange: (value: RenewalFilter) => void;
}) {
  const counts = renewalFilterCounts(items);
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="tablist" aria-label="Renewal period">
      {RENEWAL_FILTERS.map((filter) => {
        const active = filter.value === value;
        const alert = filter.value === "overdue" && counts.overdue > 0;
        return (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(filter.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "border-teal-500/50 bg-teal-500/15 text-teal-800 dark:text-teal-200"
                : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
              alert && !active && "border-rose-400/50 text-rose-700 dark:text-rose-300"
            )}
          >
            {filter.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                active ? "bg-teal-500/20" : alert ? "bg-rose-500/15" : "bg-muted"
              )}
            >
              {counts[filter.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function RenewalRows({
  items,
  empty,
  limit,
}: {
  items: DashboardRenewalItemDto[];
  empty: string;
  limit?: number;
}) {
  const today = todayIso();
  const shown = limit ? items.slice(0, limit) : items;
  if (shown.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-border/50">
      {shown.map((item) => {
        const overdue = item.dueDate.slice(0, 10) < today;
        return (
          <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm sm:px-5">
            <div className="min-w-0">
              <Link to={`/customers/${item.customerId}`} className="block truncate font-medium hover:underline">
                {item.company}
              </Link>
              {item.contactPerson && item.contactPerson !== item.company ? (
                <p className="truncate text-xs text-muted-foreground">{item.contactPerson}</p>
              ) : null}
              <p className="truncate text-xs text-muted-foreground">
                {item.renewal}
                {item.frequency ? ` · ${FREQUENCY_LABELS[item.frequency] ?? item.frequency}` : ""}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground/80">{formatDate(item.dueDate)}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px font-semibold",
                    overdue
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                      : "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                  )}
                >
                  {renewalTimeLeft(item.dueDate, today)}
                </span>
              </p>
            </div>
            <span className="shrink-0 text-right">
              <span className="block font-semibold tabular-nums">
                {formatInvoiceCurrency(item.amount)}
              </span>
              {(item.gstAmount ?? 0) > 0.009 ? (
                <>
                  <span className="block text-[11px] tabular-nums text-muted-foreground">
                    + GST {formatInvoiceCurrency(item.gstAmount ?? 0)}
                  </span>
                  <span className="block text-[11px] font-semibold tabular-nums">
                    Total {formatInvoiceCurrency(item.amount + (item.gstAmount ?? 0))}
                  </span>
                </>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
