import { ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AddCustomerDialog } from "@/features/customers/components/AddCustomerDialog";
import { CustomerHero } from "@/features/customers/components/CustomerHero";
import { CustomerQuickActions } from "@/features/customers/components/CustomerQuickActions";
import { CustomerWorkspaceTabs } from "@/features/customers/components/CustomerWorkspaceTabs";
import { TableSkeleton } from "@/shared/components/ListSkeleton";
import { Button } from "@/shared/ui/button";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import type { CustomerFormData } from "@/features/customers/types/customer";

export function CustomerWorkspacePage() {
  const { customerId } = useParams<{ customerId: string }>();
  const { getCustomer, loading, error, updateCustomer } = useCustomers();
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);

  const customer = customerId ? getCustomer(customerId) : undefined;

  if (loading) {
    return (
      <div className="space-y-8">
        <TableSkeleton rows={8} />
      </div>
    );
  }

  if (!customer) {
    return <Navigate to="/customers" replace />;
  }

  const handleSave = async (
    data: CustomerFormData,
    options?: { allowDuplicateCompanyName?: boolean }
  ) => {
    await updateCustomer(customer.id, data, options);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 rounded-xl" asChild>
          <Link to="/customers">
            <ArrowLeft />
            Back to Opportunities / Customers
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => setEditOpen(true)}
        >
          <Pencil />
          Edit
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <CustomerHero customer={customer} />

      <CustomerQuickActions
        customer={customer}
        onOpenTimeline={() => setActiveTab("timeline")}
      />

      <CustomerWorkspaceTabs
        customer={customer}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <AddCustomerDialog
        key={`edit-${customer.id}-${editOpen}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSave}
        initialData={customer}
      />
    </div>
  );
}
