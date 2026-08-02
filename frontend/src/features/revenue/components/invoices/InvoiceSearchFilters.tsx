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
  defaultInvoiceFilters,
  getUniqueCustomers,
  invoiceDateLabels,
  invoiceStatusLabels,
} from "@/features/revenue/utils/invoice-utils";
import type { Invoice, InvoiceFilters } from "@/features/revenue/types/invoice";

interface InvoiceSearchFiltersProps {
  invoices: Invoice[];
  query: string;
  onQueryChange: (value: string) => void;
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
}

export function InvoiceSearchFilters({
  invoices,
  query,
  onQueryChange,
  filters,
  onFiltersChange,
}: InvoiceSearchFiltersProps) {
  const customers = getUniqueCustomers(invoices);
  const hasActiveFilters =
    filters.status !== defaultInvoiceFilters.status ||
    filters.customer !== defaultInvoiceFilters.customer ||
    filters.date !== defaultInvoiceFilters.date;

  const resetAll = () => {
    onQueryChange("");
    onFiltersChange(defaultInvoiceFilters);
  };

  return (
    <div className="space-y-4">
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder="Search by invoice number, customer, or deal..."
        ariaLabel="Search invoices"
      />

      <FilterToolbar>
        <FilterField label="Status">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, status: value as InvoiceFilters["status"] })
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
              {Object.entries(invoiceStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Customer">
          <Select
            value={filters.customer}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, customer: value })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by customer"
            >
              <SelectValue placeholder="Select customer" />
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
        </FilterField>

        <FilterField label="Date">
          <Select
            value={filters.date}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, date: value as InvoiceFilters["date"] })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by date"
            >
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(invoiceDateLabels).map(([value, label]) => (
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
