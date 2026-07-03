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

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search templates..."
          className="h-11 rounded-xl border-border/70 bg-card pl-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
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

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onFiltersChange(defaultMasterFilters)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
