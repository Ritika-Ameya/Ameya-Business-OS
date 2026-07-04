import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { DealHero } from "@/components/deals/DealHero";
import { DealWorkspaceTabs } from "@/components/deals/DealWorkspaceTabs";
import { Button } from "@/components/ui/button";
import { useDeals } from "@/hooks/use-deals";

interface DealNavigationState {
  tab?: string;
}

export function DealWorkspacePage() {
  const { dealId } = useParams<{ dealId: string }>();
  const location = useLocation();
  const navigationState = location.state as DealNavigationState | null;
  const { getDeal } = useDeals();
  const [activeTab, setActiveTab] = useState(
    () => navigationState?.tab ?? "overview"
  );

  const deal = dealId ? getDeal(dealId) : undefined;

  if (!deal) {
    return <Navigate to="/deals" replace />;
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 rounded-xl" asChild>
          <Link to="/deals">
            <ArrowLeft />
            Back to Deals
          </Link>
        </Button>
      </div>

      <DealHero deal={deal} />

      <DealWorkspaceTabs
        dealId={deal.id}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
