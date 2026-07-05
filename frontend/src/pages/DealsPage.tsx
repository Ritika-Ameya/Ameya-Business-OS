import { Plus } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DealSearchFilters } from "@/components/deals/DealSearchFilters";
import { DealStatsCards } from "@/components/deals/DealStatsCards";
import { DealTable } from "@/components/deals/DealTable";
import { PageHeader } from "@/shared/components/PageHeader";
import { TableSkeleton } from "@/shared/components/ListSkeleton";
import { Button } from "@/shared/ui/button";
import { useDeals } from "@/hooks/use-deals";
import { defaultDealFilters, filterDeals } from "@/lib/deal-utils";
import type { DealFilters } from "@/types/deal";

export function DealsPage() {
  const navigate = useNavigate();
  const { deals } = useDeals();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<DealFilters>(defaultDealFilters);

  const deferredQuery = useDeferredValue(query);
  const isSearching = query !== deferredQuery;

  const filteredDeals = useMemo(
    () => filterDeals(deals, deferredQuery, filters),
    [deals, deferredQuery, filters]
  );

  const hasActiveFilters =
    deferredQuery.trim().length > 0 ||
    filters.status !== defaultDealFilters.status ||
    filters.renewal !== defaultDealFilters.renewal;

  const resetFilters = () => {
    setQuery("");
    setFilters(defaultDealFilters);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Deals"
        subtitle="Track revenue opportunities, components, and the full deal lifecycle."
        action={
          <Button className="rounded-xl" asChild>
            <Link to="/customers">
              <Plus />
              Add Deal
            </Link>
          </Button>
        }
      />

      <DealStatsCards deals={deals} />

      <DealSearchFilters
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {isSearching ? (
        <TableSkeleton rows={6} />
      ) : (
        <DealTable
          deals={filteredDeals}
          isFiltered={hasActiveFilters}
          isEmpty={deals.length === 0}
          onAdd={() => navigate("/customers")}
          onResetFilters={resetFilters}
        />
      )}
    </div>
  );
}
