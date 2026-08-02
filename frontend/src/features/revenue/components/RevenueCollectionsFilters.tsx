import {
  FilterToolbar,
  filterControlClassName,
} from "@/shared/components/FilterToolbar";
import { FilterResetButton } from "@/shared/components/FilterResetButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  collectionStatusLabels,
  defaultCollectionFilters,
  getRevenueCustomers,
} from "@/features/revenue/utils/revenue-utils";
import { invoiceDateLabels } from "@/features/revenue/utils/invoice-utils";
import type { Invoice } from "@/features/revenue/types/invoice";
import type { CollectionFilters } from "@/features/revenue/types/revenue";

interface RevenueCollectionsFiltersProps {
  invoices: Invoice[];
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
}

export function RevenueCollectionsFilters({
  invoices,
  filters,
  onFiltersChange,
}: RevenueCollectionsFiltersProps) {
  const customers = getRevenueCustomers(invoices);
  const hasActiveFilters =
    filters.customer !== defaultCollectionFilters.customer ||
    filters.status !== defaultCollectionFilters.status ||
    filters.date !== defaultCollectionFilters.date;

  return (
    <FilterToolbar>
      <Select
        value={filters.customer}
        onValueChange={(value) => onFiltersChange({ ...filters, customer: value })}
      >
        <SelectTrigger size="sm" className={filterControlClassName}>
          <SelectValue placeholder="Customer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Customers</SelectItem>
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value as CollectionFilters["status"],
          })
        }
      >
        <SelectTrigger size="sm" className={filterControlClassName}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(collectionStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.date}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, date: value as CollectionFilters["date"] })
        }
      >
        <SelectTrigger size="sm" className={filterControlClassName}>
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(invoiceDateLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <FilterResetButton onClick={() => onFiltersChange(defaultCollectionFilters)} />
      )}
    </FilterToolbar>
  );
}
