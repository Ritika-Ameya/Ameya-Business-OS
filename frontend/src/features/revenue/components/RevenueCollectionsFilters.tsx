import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import {
  collectionStatusLabels,
  defaultCollectionFilters,
  getRevenueCustomers,
} from "@/features/revenue/utils/revenue-utils";
import { invoiceDateLabels } from "@/features/revenue/utils/invoice-utils";
import type { CollectionFilters } from "@/features/revenue/types/revenue";

interface RevenueCollectionsFiltersProps {
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
}

export function RevenueCollectionsFilters({
  filters,
  onFiltersChange,
}: RevenueCollectionsFiltersProps) {
  const { invoices } = useRevenue();
  const customers = getRevenueCustomers(invoices);
  const hasActiveFilters =
    filters.customer !== defaultCollectionFilters.customer ||
    filters.status !== defaultCollectionFilters.status ||
    filters.date !== defaultCollectionFilters.date;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Filters
      </span>

      <Select
        value={filters.customer}
        onValueChange={(value) => onFiltersChange({ ...filters, customer: value })}
      >
        <SelectTrigger size="sm" className="min-w-[150px] rounded-xl">
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
        <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
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
        <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
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
        <button
          type="button"
          onClick={() => onFiltersChange(defaultCollectionFilters)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
