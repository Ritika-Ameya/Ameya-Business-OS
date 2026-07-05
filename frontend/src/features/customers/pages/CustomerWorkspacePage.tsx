import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CustomerHero } from "@/features/customers/components/CustomerHero";
import { CustomerQuickActions } from "@/features/customers/components/CustomerQuickActions";
import { CustomerWorkspaceTabs } from "@/features/customers/components/CustomerWorkspaceTabs";
import { Button } from "@/shared/ui/button";
import { useCustomers } from "@/features/customers/hooks/use-customers";

export function CustomerWorkspacePage() {
  const { customerId } = useParams<{ customerId: string }>();
  const { getCustomer } = useCustomers();
  const [activeTab, setActiveTab] = useState("overview");

  const customer = customerId ? getCustomer(customerId) : undefined;

  if (!customer) {
    return <Navigate to="/customers" replace />;
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 rounded-xl" asChild>
          <Link to="/customers">
            <ArrowLeft />
            Back to Opportunities / Customers
          </Link>
        </Button>
      </div>

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
    </div>
  );
}
