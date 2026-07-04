import { FilterResetButton } from "@/components/shared/FilterResetButton";
import { SearchField } from "@/components/shared/SearchField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultMasterFilters,
  frequencyLabels,
} from "@/lib/expense-utils";
import type { ExpenseMasterFilters } from "@/types/expense";

interface ExpenseMasterFiltersBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  filters: ExpenseMasterFilters;
  onFiltersChange: (filters: ExpenseMasterFilters) => void;
  categories: { id: string; name: string }[];
}

export function ExpenseMasterFiltersBar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  categories,
}: ExpenseMasterFiltersBarProps) {
  const hasActiveFilters =
    filters.category !== defaultMasterFilters.category ||
    filters.status !== defaultMasterFilters.status ||
    filters.frequency !== defaultMasterFilters.frequency;

  const resetAll = () => {
    onQueryChange("");
    onFiltersChange(defaultMasterFilters);
  };

  return (
    <div className="space-y-4">
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder="Search templates..."
        ariaLabel="Search expense templates"
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Filters
        </span>

        <Select
          value={filters.category}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, category: value })
          }
        >
          <SelectTrigger size="sm" className="min-w-[140px] rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.frequency}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              frequency: value as ExpenseMasterFilters["frequency"],
            })
          }
        >
          <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frequencies</SelectItem>
            {Object.entries(frequencyLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value as ExpenseMasterFilters["status"],
            })
          }
        >
          <SelectTrigger size="sm" className="min-w-[120px] rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {(hasActiveFilters || query.trim().length > 0) && (
          <FilterResetButton onClick={resetAll} />
        )}
      </div>
    </div>
  );
}
