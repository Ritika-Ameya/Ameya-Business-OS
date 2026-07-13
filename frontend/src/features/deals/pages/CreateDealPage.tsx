import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { CreateDealWizard } from "@/features/deals/components/CreateDealWizard";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { Button } from "@/shared/ui/button";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { useState } from "react";

import type { DealFormData } from "@/features/deals/types/deal";

export function CreateDealPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { getCustomer, loading: customersLoading } = useCustomers();
  const { addDeal } = useDeals();
  const { stages } = useAppConfig();
  const [error, setError] = useState<string | null>(null);

  const customer = customerId ? getCustomer(customerId) : undefined;

  if (customersLoading) {
    return <p className="text-sm text-muted-foreground">Loading customer…</p>;
  }

  if (!customer) {
    return <Navigate to="/customers" replace />;
  }

  const handleSave = async (data: DealFormData) => {
    setError(null);
    try {
      const deal = await addDeal(
        {
          ...data,
          customerId: customer.id,
          customerName: customer.name,
          customerRecordType: customer.recordType,
        },
        stages
      );
      navigate(`/deals/${deal.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" className="-ml-2 rounded-xl" asChild>
        <Link to={`/customers/${customer.id}`}>
          <ArrowLeft />
          Back to {customer.name}
        </Link>
      </Button>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <CreateDealWizard
        customerId={customer.id}
        customerName={customer.name}
        onSave={handleSave}
      />
    </div>
  );
}
