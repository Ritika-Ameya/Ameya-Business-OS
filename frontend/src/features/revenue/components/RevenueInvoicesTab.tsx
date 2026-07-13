import { useDeferredValue, useMemo, useState } from "react";
import { InvoiceSearchFilters } from "@/features/revenue/components/invoices/InvoiceSearchFilters";
import { InvoiceStatsCards } from "@/features/revenue/components/invoices/InvoiceStatsCards";
import { RevenueInvoicesTable } from "@/features/revenue/components/RevenueInvoicesTable";
import { StatsSkeleton, TableSkeleton } from "@/shared/components/ListSkeleton";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { defaultInvoiceFilters, filterInvoices } from "@/features/revenue/utils/invoice-utils";
import type { InvoiceFilters } from "@/features/revenue/types/invoice";

export function RevenueInvoicesTab() {
  const { invoices, loading: invoicesLoading, error } = useRevenue();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<InvoiceFilters>(defaultInvoiceFilters);
  const deferredQuery = useDeferredValue(query);
  const deferredFilters = useDeferredValue(filters);

  const loading =
    invoicesLoading || query !== deferredQuery || filters !== deferredFilters;

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
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
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
