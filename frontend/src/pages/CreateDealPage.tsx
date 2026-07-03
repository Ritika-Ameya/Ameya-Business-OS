import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { CreateDealWizard } from "@/components/deals/CreateDealWizard";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/use-customers";

export function CreateDealPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { getCustomer } = useCustomers();

  const customer = customerId ? getCustomer(customerId) : undefined;

  if (!customer) {
    return <Navigate to="/customers" replace />;
  }

  const handleSave = () => {
    navigate(`/deals/deal-new`, {
      state: {
        customerId: customer.id,
        customerName: customer.name,
      },
    });
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
