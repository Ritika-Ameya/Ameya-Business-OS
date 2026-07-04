import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  defaultRenewalFilters,
  getRevenueCustomers,
  renewalStatusLabels,
  renewalTypeLabels,
} from "@/lib/revenue-utils";
import { invoiceDateLabels } from "@/lib/invoice-utils";
import type { RenewalFilters } from "@/types/revenue";

interface RevenueRenewalsFiltersProps {
  filters: RenewalFilters;
  onFiltersChange: (filters: RenewalFilters) => void;
}

export function RevenueRenewalsFilters({
  filters,
  onFiltersChange,
}: RevenueRenewalsFiltersProps) {
  const customers = getRevenueCustomers();
  const hasActiveFilters =
    filters.customer !== defaultRenewalFilters.customer ||
    filters.renewalType !== defaultRenewalFilters.renewalType ||
    filters.date !== defaultRenewalFilters.date ||
    filters.status !== defaultRenewalFilters.status;

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
        value={filters.renewalType}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            renewalType: value as RenewalFilters["renewalType"],
          })
        }
      >
        <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
          <SelectValue placeholder="Renewal Type" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(renewalTypeLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.date}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, date: value as RenewalFilters["date"] })
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

      <Select
        value={filters.status}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value as RenewalFilters["status"],
          })
        }
      >
        <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(renewalStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onFiltersChange(defaultRenewalFilters)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
