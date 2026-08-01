import { Plus } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DealSearchFilters } from "@/features/deals/components/DealSearchFilters";
import { DealStatsCards } from "@/features/deals/components/DealStatsCards";
import { DealTable } from "@/features/deals/components/DealTable";
import { EditDealDialog } from "@/features/deals/components/EditDealDialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { TableSkeleton } from "@/shared/components/ListSkeleton";
import { Button } from "@/shared/ui/button";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { defaultDealFilters, filterDeals } from "@/features/deals/utils/deal-utils";
import type { Deal, DealFilters } from "@/features/deals/types/deal";

export function DealsPage() {
  const navigate = useNavigate();
  const { deals, components, loading, error, removeDeal } = useDeals();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<DealFilters>(defaultDealFilters);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const deferredQuery = useDeferredValue(query);
  const isSearching = query !== deferredQuery;

  const filteredDeals = useMemo(
    () => filterDeals(deals, deferredQuery, filters, components),
    [deals, deferredQuery, filters, components]
  );

  const hasActiveFilters =
    deferredQuery.trim().length > 0 ||
    filters.status !== defaultDealFilters.status ||
    filters.renewal !== defaultDealFilters.renewal;

  const resetFilters = () => {
    setQuery("");
    setFilters(defaultDealFilters);
  };

  const handleDelete = async (deal: Deal) => {
    const confirmed = window.confirm(
      `Delete deal "${deal.title}"?\n\nRelated components and deal documents will also be deleted.`
    );
    if (!confirmed) return;
    await removeDeal(deal.id);
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

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <DealStatsCards deals={deals} components={components} />

      <DealSearchFilters
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {loading || isSearching ? (
        <TableSkeleton rows={6} />
      ) : (
        <DealTable
          deals={filteredDeals}
          components={components}
          isFiltered={hasActiveFilters}
          isEmpty={deals.length === 0}
          onAdd={() => navigate("/customers")}
          onResetFilters={resetFilters}
          onEdit={setEditingDeal}
          onDelete={(deal) => {
            void handleDelete(deal);
          }}
        />
      )}

      <EditDealDialog
        deal={editingDeal}
        open={Boolean(editingDeal)}
        onOpenChange={(open) => {
          if (!open) setEditingDeal(null);
        }}
      />
    </div>
  );
}
