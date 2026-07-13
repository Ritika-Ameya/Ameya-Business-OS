import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AddCustomerDialog } from "@/features/customers/components/AddCustomerDialog";
import { Button } from "@/shared/ui/button";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import type { CustomerFormData } from "@/features/customers/types/customer";

export function DashboardQuickActions() {
  const { addCustomer } = useCustomers();
  const { stages } = useAppConfig();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = async (data: CustomerFormData) => {
    await addCustomer(data, stages);
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
          Opportunity / Customer
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
