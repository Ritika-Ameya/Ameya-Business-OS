import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DealSearchFilters } from "@/components/deals/DealSearchFilters";
import { DealStatsCards } from "@/components/deals/DealStatsCards";
import { DealTable } from "@/components/deals/DealTable";
import { PageHeader } from "@/components/customers/PageHeader";
import { Button } from "@/components/ui/button";
import { seedDeals } from "@/data/seed-deals";
import { defaultDealFilters, filterDeals } from "@/lib/deal-utils";
import type { DealFilters } from "@/types/deal";

export function DealsPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<DealFilters>(defaultDealFilters);

  const filteredDeals = useMemo(
    () => filterDeals(seedDeals, query, filters),
    [query, filters]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Deals"
        subtitle="Track revenue opportunities, components, and the full deal lifecycle."
        action={
          <Button className="rounded-xl">
            <Plus />
            Add Deal
          </Button>
        }
      />

      <DealStatsCards deals={seedDeals} />

      <DealSearchFilters
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <DealTable deals={filteredDeals} />
    </div>
  );
}
