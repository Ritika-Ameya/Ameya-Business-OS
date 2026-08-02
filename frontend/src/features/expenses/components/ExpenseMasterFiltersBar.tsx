import { FilterResetButton } from "@/shared/components/FilterResetButton";
import {
  FilterField,
  FilterToolbar,
  filterControlClassName,
} from "@/shared/components/FilterToolbar";
import { SearchField } from "@/shared/components/SearchField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  defaultMasterFilters,
  frequencyLabels,
} from "@/features/expenses/utils/expense-utils";
import type { ExpenseMasterFilters } from "@/features/expenses/types/expense";

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

      <FilterToolbar>
        <FilterField label="Category">
          <Select
            value={filters.category}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, category: value })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by category"
            >
              <SelectValue placeholder="Select category" />
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
        </FilterField>

        <FilterField label="Frequency">
          <Select
            value={filters.frequency}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                frequency: value as ExpenseMasterFilters["frequency"],
              })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by frequency"
            >
              <SelectValue placeholder="Select frequency" />
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
        </FilterField>

        <FilterField label="Status">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value as ExpenseMasterFilters["status"],
              })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by status"
            >
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        {(hasActiveFilters || query.trim().length > 0) && (
          <FilterResetButton onClick={resetAll} className="sm:mb-0.5" />
        )}
      </FilterToolbar>
    </div>
  );
}
