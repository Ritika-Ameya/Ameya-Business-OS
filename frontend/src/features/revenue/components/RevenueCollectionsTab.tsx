import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { RevenueCollectionsFilters } from "@/features/revenue/components/RevenueCollectionsFilters";
import { RevenueCollectionsStats } from "@/features/revenue/components/RevenueCollectionsStats";
import { RevenueCollectionsTable } from "@/features/revenue/components/RevenueCollectionsTable";
import { StatsSkeleton, TableSkeleton } from "@/shared/components/ListSkeleton";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import {
  buildCollectionRows,
  defaultCollectionFilters,
  filterCollectionRows,
  getCollectionInvoices,
} from "@/features/revenue/utils/revenue-utils";
import type { CollectionFilters } from "@/features/revenue/types/revenue";

export function RevenueCollectionsTab() {
  const { invoices, payments } = useRevenue();
  const [filters, setFilters] = useState<CollectionFilters>(defaultCollectionFilters);
  const [ready, setReady] = useState(false);
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const loading = !ready || filters !== deferredFilters;

  const collectionRows = useMemo(() => {
    const rows = buildCollectionRows(getCollectionInvoices(invoices), payments);
    return filterCollectionRows(rows, deferredFilters);
  }, [invoices, payments, deferredFilters]);

  return (
    <div className="space-y-6">
      {loading ? <StatsSkeleton /> : <RevenueCollectionsStats />}
      <RevenueCollectionsFilters filters={filters} onFiltersChange={setFilters} />
      {loading ? (
        <TableSkeleton />
      ) : (
        <RevenueCollectionsTable rows={collectionRows} />
      )}
    </div>
  );
}
