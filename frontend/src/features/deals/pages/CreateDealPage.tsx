import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { CreateDealWizard } from "@/features/deals/components/CreateDealWizard";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { Button } from "@/shared/ui/button";

import type { DealFormData } from "@/features/deals/types/deal";

export function CreateDealPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { getCustomer } = useCustomers();
  const { addDeal } = useDeals();
  const { stages } = useAppConfig();

  const customer = customerId ? getCustomer(customerId) : undefined;

  if (!customer) {
    return <Navigate to="/customers" replace />;
  }

  const handleSave = (data: DealFormData) => {
    const deal = addDeal(
      {
        ...data,
        customerId: customer.id,
        customerName: customer.name,
        customerRecordType: customer.recordType,
      },
      stages
    );
    navigate(`/deals/${deal.id}`);
  };

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" className="-ml-2 rounded-xl" asChild>
        <Link to={`/customers/${customer.id}`}>
          <ArrowLeft />
          Back to {customer.name}
        </Link>
      </Button>

      <CreateDealWizard
        customerId={customer.id}
        customerName={customer.name}
        onSave={handleSave}
      />
    </div>
  );
}
