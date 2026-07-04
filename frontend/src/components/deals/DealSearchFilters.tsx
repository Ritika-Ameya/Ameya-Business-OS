import { FilterResetButton } from "@/shared/components/FilterResetButton";
import { SearchField } from "@/shared/components/SearchField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  dealRenewalLabels,
  dealStatusLabels,
  defaultDealFilters,
} from "@/lib/deal-utils";
import type { DealFilters } from "@/types/deal";

interface DealSearchFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  filters: DealFilters;
  onFiltersChange: (filters: DealFilters) => void;
}

export function DealSearchFilters({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
}: DealSearchFiltersProps) {
  const hasActiveFilters =
    filters.status !== defaultDealFilters.status ||
    filters.renewal !== defaultDealFilters.renewal;

  const resetAll = () => {
    onQueryChange("");
    onFiltersChange(defaultDealFilters);
  };

  return (
    <div className="space-y-4">
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder="Search by deal name or customer..."
        ariaLabel="Search deals"
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Filters
        </span>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value as DealFilters["status"] })
          }
        >
          <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(dealStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.renewal}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, renewal: value as DealFilters["renewal"] })
          }
        >
          <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
            <SelectValue placeholder="Renewal" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(dealRenewalLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(hasActiveFilters || query.trim().length > 0) && (
          <FilterResetButton onClick={resetAll} />
        )}
      </div>
    </div>
  );
}
