import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { RevenueRenewalsFilters } from "@/features/revenue/components/RevenueRenewalsFilters";
import { RevenueRenewalsStats } from "@/features/revenue/components/RevenueRenewalsStats";
import { RevenueRenewalsTable } from "@/features/revenue/components/RevenueRenewalsTable";
import { StatsSkeleton, TableSkeleton } from "@/shared/components/ListSkeleton";
import { useDeals } from "@/features/deals/hooks/use-deals";
import {
  defaultRenewalFilters,
  filterCompanyRenewals,
  getCompanyRenewals,
} from "@/features/revenue/utils/revenue-utils";
import type { RenewalFilters } from "@/features/revenue/types/revenue";

export function RevenueRenewalsTab() {
  const { deals, components } = useDeals();
  const [filters, setFilters] = useState<RenewalFilters>(defaultRenewalFilters);
  const [ready, setReady] = useState(false);
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const loading = !ready || filters !== deferredFilters;

  const filteredRenewals = useMemo(() => {
    return filterCompanyRenewals(getCompanyRenewals(deals, components), deferredFilters);
  }, [deals, components, deferredFilters]);

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
