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
  activeDealsFilterLabels,
  defaultFilters,
  outstandingFilterLabels,
  renewalFilterLabels,
  statusFilterLabels,
} from "@/lib/customer-utils";
import type { CustomerFilters } from "@/types/customer";

interface CustomerSearchFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  filters: CustomerFilters;
  onFiltersChange: (filters: CustomerFilters) => void;
}

export function CustomerSearchFilters({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
}: CustomerSearchFiltersProps) {
  const hasActiveFilters =
    filters.status !== defaultFilters.status ||
    filters.outstanding !== defaultFilters.outstanding ||
    filters.renewal !== defaultFilters.renewal ||
    filters.activeDeals !== defaultFilters.activeDeals;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by customer name, company, GST, phone, or email..."
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
            onFiltersChange({ ...filters, status: value as CustomerFilters["status"] })
          }
        >
          <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusFilterLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.outstanding}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              outstanding: value as CustomerFilters["outstanding"],
            })
          }
        >
          <SelectTrigger size="sm" className="min-w-[150px] rounded-xl">
            <SelectValue placeholder="Outstanding" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(outstandingFilterLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.renewal}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, renewal: value as CustomerFilters["renewal"] })
          }
        >
          <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
            <SelectValue placeholder="Renewal" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(renewalFilterLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.activeDeals}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              activeDeals: value as CustomerFilters["activeDeals"],
            })
          }
        >
          <SelectTrigger size="sm" className="min-w-[140px] rounded-xl">
            <SelectValue placeholder="Active Deals" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(activeDealsFilterLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onFiltersChange(defaultFilters)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
