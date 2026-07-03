import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { DealHero } from "@/components/deals/DealHero";
import { DealWorkspaceTabs } from "@/components/deals/DealWorkspaceTabs";
import { Button } from "@/components/ui/button";
import { seedDeals } from "@/data/seed-deals";
import { createPlaceholderDeal, getDealById } from "@/lib/deal-utils";

interface CreateDealNavigationState {
  customerId?: string;
  customerName?: string;
}

export function DealWorkspacePage() {
  const { dealId } = useParams<{ dealId: string }>();
  const location = useLocation();
  const navigationState = location.state as CreateDealNavigationState | null;
  const [activeTab, setActiveTab] = useState("overview");

  const seedDeal = dealId ? getDealById(seedDeals, dealId) : undefined;
  const deal =
    seedDeal ??
    (dealId === "deal-new" && navigationState?.customerId && navigationState.customerName
      ? createPlaceholderDeal(
          dealId,
          navigationState.customerId,
          navigationState.customerName
        )
      : undefined);

  if (!deal) {
    return <Navigate to="/deals" replace />;
  }

  const backPath =
    navigationState?.customerId && dealId === "deal-new"
      ? `/customers/${navigationState.customerId}`
      : "/deals";

  const backLabel =
    navigationState?.customerId && dealId === "deal-new"
      ? "Back to Customer"
      : "Back to Deals";

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 rounded-xl" asChild>
          <Link to={backPath}>
            <ArrowLeft />
            {backLabel}
          </Link>
        </Button>
      </div>

      <DealHero deal={deal} />

      <DealWorkspaceTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
