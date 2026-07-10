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
  const { deals, updateDeal, deleteDeal } = useDeals();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<DealFilters>(defaultDealFilters);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setDialogOpen(true);
  };

  const handleDelete = (deal: Deal) => {
    if (window.confirm(`Delete deal "${deal.title}"? This cannot be undone.`)) {
      deleteDeal(deal.id);
    }
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
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editingDeal && (
        <EditDealDialog
          key={`${editingDeal.id}-${dialogOpen}`}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          deal={editingDeal}
          onSave={(data) => updateDeal(editingDeal.id, data)}
        />
      )}
    </div>
  );
}
