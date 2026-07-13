import { Plus } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { AddCustomerDialog } from "@/features/customers/components/AddCustomerDialog";
import { CustomerSearchFilters } from "@/features/customers/components/CustomerSearchFilters";
import { CustomerStatsCards } from "@/features/customers/components/CustomerStatsCards";
import { CustomerTable } from "@/features/customers/components/CustomerTable";
import { PageHeader } from "@/shared/components/PageHeader";
import { TableSkeleton } from "@/shared/components/ListSkeleton";
import { Button } from "@/shared/ui/button";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { defaultFilters, filterCustomers } from "@/features/customers/utils/customer-utils";
import type { Customer, CustomerFilters, CustomerFormData } from "@/features/customers/types/customer";

export function CustomersPage() {
  const { customers, loading, error, addCustomer, updateCustomer } = useCustomers();
  const { stages } = useAppConfig();
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
    filters.activeDeals !== defaultFilters.activeDeals ||
    filters.recordType !== defaultFilters.recordType;

  const handleAdd = () => {
    setEditingCustomer(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleSave = async (data: CustomerFormData) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, data);
      return;
    }
    await addCustomer(data, stages);
  };

  const resetFilters = () => {
    setQuery("");
    setFilters(defaultFilters);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Opportunities / Customers"
        subtitle="Manage opportunities and customers through their complete business lifecycle."
        action={
          <Button onClick={handleAdd} className="rounded-xl">
            <Plus />
            Add Opportunity / Customer
          </Button>
        }
      />

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <CustomerStatsCards customers={customers} />

      <CustomerSearchFilters
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {loading || isSearching ? (
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
