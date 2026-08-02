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
  activeDealsFilterLabels,
  defaultFilters,
  outstandingFilterLabels,
  recordTypeFilterLabels,
  renewalFilterLabels,
  statusFilterLabels,
} from "@/features/customers/utils/customer-utils";
import type { CustomerFilters } from "@/features/customers/types/customer";

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
    filters.activeDeals !== defaultFilters.activeDeals ||
    filters.recordType !== defaultFilters.recordType;

  const resetAll = () => {
    onQueryChange("");
    onFiltersChange(defaultFilters);
  };

  return (
    <div className="space-y-4">
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder="Search by customer name, company, GST, VAT, license, phone, or email..."
        ariaLabel="Search customers"
      />

      <FilterToolbar>
        <FilterField label="Type">
          <Select
            value={filters.recordType}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                recordType: value as CustomerFilters["recordType"],
              })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by record type"
            >
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(recordTypeFilterLabels).map(([value, label]) => (
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
              onFiltersChange({ ...filters, status: value as CustomerFilters["status"] })
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
              {Object.entries(statusFilterLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Outstanding">
          <Select
            value={filters.outstanding}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                outstanding: value as CustomerFilters["outstanding"],
              })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by outstanding"
            >
              <SelectValue placeholder="Select outstanding" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(outstandingFilterLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Renewal">
          <Select
            value={filters.renewal}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, renewal: value as CustomerFilters["renewal"] })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by renewal"
            >
              <SelectValue placeholder="Select renewal" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(renewalFilterLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Active Deals">
          <Select
            value={filters.activeDeals}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                activeDeals: value as CustomerFilters["activeDeals"],
              })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by active deals"
            >
              <SelectValue placeholder="Select active deals" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(activeDealsFilterLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
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
