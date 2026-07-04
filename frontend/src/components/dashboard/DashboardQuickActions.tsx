import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/use-customers";
import type { CustomerFormData } from "@/types/customer";

export function DashboardQuickActions() {
  const { addCustomer } = useCustomers();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = (data: CustomerFormData) => {
    addCustomer(data);
    setDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => setDialogOpen(true)}
        >
          <Plus />
          Customer
        </Button>
        <Button variant="outline" className="rounded-xl" asChild>
          <Link to="/deals">
            <Plus />
            Deal
          </Link>
        </Button>
        <Button variant="outline" className="rounded-xl" asChild>
          <Link to="/expenses?action=add">
            <Plus />
            Expense
          </Link>
        </Button>
      </div>

      <AddCustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </>
  );
}
