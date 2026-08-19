import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { RevenueRenewalsFilters } from "@/features/revenue/components/RevenueRenewalsFilters";
import { RevenueRenewalsStats } from "@/features/revenue/components/RevenueRenewalsStats";
import { RevenueRenewalsTable } from "@/features/revenue/components/RevenueRenewalsTable";
import { StatsSkeleton, TableSkeleton } from "@/shared/components/ListSkeleton";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import {
  defaultRenewalFilters,
  filterCompanyRenewals,
  getCompanyRenewals,
} from "@/features/revenue/utils/revenue-utils";
import type { RenewalFilters } from "@/features/revenue/types/revenue";

export function RevenueRenewalsTab() {
  const { deals, components } = useDeals();
  const { customers } = useCustomers();
  const [filters, setFilters] = useState<RenewalFilters>(defaultRenewalFilters);
  const [ready, setReady] = useState(false);
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const loading = !ready || filters !== deferredFilters;

  const allRenewals = useMemo(
    () => getCompanyRenewals(deals, components, customers),
    [deals, components, customers]
  );

  const filteredRenewals = useMemo(
    () => filterCompanyRenewals(allRenewals, deferredFilters),
    [allRenewals, deferredFilters]
  );

  const hasActiveFilters =
    deferredFilters.customer !== defaultRenewalFilters.customer ||
    deferredFilters.renewalType !== defaultRenewalFilters.renewalType ||
    deferredFilters.date !== defaultRenewalFilters.date ||
    deferredFilters.status !== defaultRenewalFilters.status ||
    deferredFilters.search !== defaultRenewalFilters.search ||
    deferredFilters.customFrom !== defaultRenewalFilters.customFrom ||
    deferredFilters.customTo !== defaultRenewalFilters.customTo ||
    deferredFilters.selectedMonth !== defaultRenewalFilters.selectedMonth ||
    deferredFilters.selectedQuarter !== defaultRenewalFilters.selectedQuarter;

  return (
    <div className="space-y-6">
      {loading ? (
        <StatsSkeleton />
      ) : (
        <RevenueRenewalsStats filters={filters} onFiltersChange={setFilters} />
      )}
      <RevenueRenewalsFilters filters={filters} onFiltersChange={setFilters} />
      {loading ? (
        <TableSkeleton />
      ) : (
        <RevenueRenewalsTable
          renewals={filteredRenewals}
          isFiltered={hasActiveFilters}
          statusFilter={deferredFilters.status}
          onResetFilters={() => setFilters(defaultRenewalFilters)}
        />
      )}
    </div>
  );
}
