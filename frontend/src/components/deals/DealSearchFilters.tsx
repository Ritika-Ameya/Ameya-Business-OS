import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by deal name or customer..."
          className="h-11 rounded-xl border-border/70 bg-card pl-10"
        />
      </div>

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

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onFiltersChange(defaultDealFilters)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
