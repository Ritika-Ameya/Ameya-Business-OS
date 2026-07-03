import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog";
import { CustomerSearchFilters } from "@/components/customers/CustomerSearchFilters";
import { CustomerStatsCards } from "@/components/customers/CustomerStatsCards";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { PageHeader } from "@/components/customers/PageHeader";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/use-customers";
import { defaultFilters, filterCustomers } from "@/lib/customer-utils";
import type { Customer, CustomerFilters, CustomerFormData } from "@/types/customer";

export function CustomersPage() {
  const navigate = useNavigate();
  const { customers, addCustomer, updateCustomer } = useCustomers();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CustomerFilters>(defaultFilters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  const filteredCustomers = useMemo(
    () => filterCustomers(customers, query, filters),
    [customers, query, filters]
  );

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
    const customer = addCustomer(data);
    navigate(`/customers/${customer.id}`);
  };

  return (
    <div className="space-y-8">
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

      <CustomerTable customers={filteredCustomers} onEdit={handleEdit} />

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
