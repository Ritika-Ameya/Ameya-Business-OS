import { FilterResetButton } from "@/shared/components/FilterResetButton";
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
} from "@/lib/invoice-utils";
import type { Invoice, InvoiceFilters } from "@/types/invoice";

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

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Filters
        </span>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value as InvoiceFilters["status"] })
          }
        >
          <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(invoiceStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.customer}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, customer: value })
          }
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
          value={filters.date}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, date: value as InvoiceFilters["date"] })
          }
        >
          <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(invoiceDateLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(hasActiveFilters || query.trim().length > 0) && (
          <FilterResetButton onClick={resetAll} />
        )}
      </div>
    </div>
  );
}
