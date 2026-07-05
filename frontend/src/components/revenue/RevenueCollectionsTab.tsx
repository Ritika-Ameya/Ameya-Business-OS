import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { RevenueCollectionsFilters } from "@/components/revenue/RevenueCollectionsFilters";
import { RevenueCollectionsStats } from "@/components/revenue/RevenueCollectionsStats";
import { RevenueCollectionsTable } from "@/components/revenue/RevenueCollectionsTable";
import { StatsSkeleton, TableSkeleton } from "@/shared/components/ListSkeleton";
import {
  buildCollectionRows,
  defaultCollectionFilters,
  filterCollectionRows,
  getCollectionInvoices,
} from "@/lib/revenue-utils";
import type { CollectionFilters } from "@/types/revenue";

export function RevenueCollectionsTab() {
  const [filters, setFilters] = useState<CollectionFilters>(defaultCollectionFilters);
  const [ready, setReady] = useState(false);
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const loading = !ready || filters !== deferredFilters;

  const collectionRows = useMemo(() => {
    const rows = buildCollectionRows(getCollectionInvoices());
    return filterCollectionRows(rows, deferredFilters);
  }, [deferredFilters]);

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
