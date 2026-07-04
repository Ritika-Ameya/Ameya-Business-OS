import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { RevenueRenewalsFilters } from "@/components/revenue/RevenueRenewalsFilters";
import { RevenueRenewalsStats } from "@/components/revenue/RevenueRenewalsStats";
import { RevenueRenewalsTable } from "@/components/revenue/RevenueRenewalsTable";
import { StatsSkeleton, TableSkeleton } from "@/components/revenue/TableSkeleton";
import {
  defaultRenewalFilters,
  filterCompanyRenewals,
  getCompanyRenewals,
} from "@/lib/revenue-utils";
import type { RenewalFilters } from "@/types/revenue";

export function RevenueRenewalsTab() {
  const [filters, setFilters] = useState<RenewalFilters>(defaultRenewalFilters);
  const [ready, setReady] = useState(false);
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const loading = !ready || filters !== deferredFilters;

  const filteredRenewals = useMemo(() => {
    return filterCompanyRenewals(getCompanyRenewals(), deferredFilters);
  }, [deferredFilters]);

  return (
    <div className="space-y-6">
      {loading ? <StatsSkeleton /> : <RevenueRenewalsStats />}
      <RevenueRenewalsFilters filters={filters} onFiltersChange={setFilters} />
      {loading ? (
        <TableSkeleton />
      ) : (
        <RevenueRenewalsTable renewals={filteredRenewals} />
      )}
    </div>
  );
}
