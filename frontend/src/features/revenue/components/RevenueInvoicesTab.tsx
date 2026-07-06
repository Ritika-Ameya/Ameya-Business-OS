import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { InvoiceSearchFilters } from "@/features/revenue/components/invoices/InvoiceSearchFilters";
import { InvoiceStatsCards } from "@/features/revenue/components/invoices/InvoiceStatsCards";
import { RevenueInvoicesTable } from "@/features/revenue/components/RevenueInvoicesTable";
import { StatsSkeleton, TableSkeleton } from "@/shared/components/ListSkeleton";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { defaultInvoiceFilters, filterInvoices } from "@/features/revenue/utils/invoice-utils";
import type { InvoiceFilters } from "@/features/revenue/types/invoice";

export function RevenueInvoicesTab() {
  const { invoices } = useRevenue();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<InvoiceFilters>(defaultInvoiceFilters);
  const [ready, setReady] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const loading =
    !ready || query !== deferredQuery || filters !== deferredFilters;

  const filteredInvoices = useMemo(
    () => filterInvoices(invoices, deferredQuery, deferredFilters),
    [invoices, deferredQuery, deferredFilters]
  );

  const hasActiveFilters =
    deferredQuery.trim().length > 0 ||
    filters.status !== defaultInvoiceFilters.status ||
    filters.customer !== defaultInvoiceFilters.customer ||
    filters.date !== defaultInvoiceFilters.date;

  const resetFilters = () => {
    setQuery("");
    setFilters(defaultInvoiceFilters);
  };

  return (
    <div className="space-y-6">
      {loading ? <StatsSkeleton /> : <InvoiceStatsCards invoices={invoices} />}
      <InvoiceSearchFilters
        invoices={invoices}
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />
      {loading ? (
        <TableSkeleton />
      ) : (
        <RevenueInvoicesTable
          invoices={filteredInvoices}
          isFiltered={hasActiveFilters}
          onResetFilters={resetFilters}
        />
      )}
    </div>
  );
}
