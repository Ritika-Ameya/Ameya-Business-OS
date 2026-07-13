import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { DealHero } from "@/features/deals/components/DealHero";
import { DealWorkspaceTabs } from "@/features/deals/components/DealWorkspaceTabs";
import { TableSkeleton } from "@/shared/components/ListSkeleton";
import { Button } from "@/shared/ui/button";
import { useDeals } from "@/features/deals/hooks/use-deals";

interface DealNavigationState {
  tab?: string;
}

const dealTabs = new Set([
  "overview",
  "components",
  "invoices",
  "payments",
  "renewals",
  "documents",
  "timeline",
  "notes",
]);

function parseDealTab(value: string | null, fallback?: string): string {
  if (value && dealTabs.has(value)) return value;
  if (fallback && dealTabs.has(fallback)) return fallback;
  return "overview";
}

export function DealWorkspacePage() {
  const { dealId } = useParams<{ dealId: string }>();
  const location = useLocation();
  const navigationState = location.state as DealNavigationState | null;
  const [searchParams] = useSearchParams();
  const { getDeal, loading, error } = useDeals();
  const [activeTab, setActiveTab] = useState(() =>
    parseDealTab(searchParams.get("tab"), navigationState?.tab)
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && dealTabs.has(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const deal = dealId ? getDeal(dealId) : undefined;

  if (loading) {
    return (
      <div className="space-y-8">
        <TableSkeleton rows={8} />
      </div>
    );
  }

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

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <DealHero deal={deal} />

      <DealWorkspaceTabs
        dealId={deal.id}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
