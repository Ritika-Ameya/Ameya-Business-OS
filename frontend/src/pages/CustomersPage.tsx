import { Plus } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog";
import { CustomerSearchFilters } from "@/components/customers/CustomerSearchFilters";
import { CustomerStatsCards } from "@/components/customers/CustomerStatsCards";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { PageHeader } from "@/shared/components/PageHeader";
import { TableSkeleton } from "@/shared/components/ListSkeleton";
import { Button } from "@/shared/ui/button";
import { useCustomers } from "@/hooks/use-customers";
import { defaultFilters, filterCustomers } from "@/lib/customer-utils";
import type { Customer, CustomerFilters, CustomerFormData } from "@/types/customer";

export function CustomersPage() {
  const { customers, addCustomer, updateCustomer } = useCustomers();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CustomerFilters>(defaultFilters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  const deferredQuery = useDeferredValue(query);
  const isSearching = query !== deferredQuery;

  const filteredCustomers = useMemo(
    () => filterCustomers(customers, deferredQuery, filters),
    [customers, deferredQuery, filters]
  );

  const hasActiveFilters =
    deferredQuery.trim().length > 0 ||
    filters.status !== defaultFilters.status ||
    filters.outstanding !== defaultFilters.outstanding ||
    filters.renewal !== defaultFilters.renewal ||
    filters.activeDeals !== defaultFilters.activeDeals;

  const handleAdd = () => {
    setEditingCustomer(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleSave = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, data);
      return;
    }
    addCustomer(data);
  };

  const resetFilters = () => {
    setQuery("");
    setFilters(defaultFilters);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Customers"
        subtitle="Manage all customers and their complete business relationship."
        action={
          <Button onClick={handleAdd} className="rounded-xl">
            <Plus />
            Add Customer
          </Button>
        }
      />

      <CustomerStatsCards customers={customers} />

      <CustomerSearchFilters
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {isSearching ? (
        <TableSkeleton rows={6} />
      ) : (
        <CustomerTable
          customers={filteredCustomers}
          onEdit={handleEdit}
          isFiltered={hasActiveFilters}
          isEmpty={customers.length === 0}
          onAdd={handleAdd}
          onResetFilters={resetFilters}
        />
      )}

      <AddCustomerDialog
        key={`${editingCustomer?.id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        initialData={editingCustomer}
      />
    </div>
  );
}
