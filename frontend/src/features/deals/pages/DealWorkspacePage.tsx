import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { DealHero } from "@/features/deals/components/DealHero";
import { DealWorkspaceTabs } from "@/features/deals/components/DealWorkspaceTabs";
import { EditDealDialog } from "@/features/deals/components/EditDealDialog";
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
  const navigate = useNavigate();
  const navigationState = location.state as DealNavigationState | null;
  const [searchParams] = useSearchParams();
  const { getDeal, updateDeal, deleteDeal } = useDeals();
  const [activeTab, setActiveTab] = useState(() =>
    parseDealTab(searchParams.get("tab"), navigationState?.tab)
  );
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && dealTabs.has(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const deal = dealId ? getDeal(dealId) : undefined;

  if (!deal) {
    return <Navigate to="/deals" replace />;
  }

  const handleDelete = () => {
    if (window.confirm(`Delete deal "${deal.title}"? This cannot be undone.`)) {
      deleteDeal(deal.id);
      navigate("/deals");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 rounded-xl" asChild>
          <Link to="/deals">
            <ArrowLeft />
            Back to Deals
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setEditOpen(true)}>
            <Edit />
            Edit Deal
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>

      <DealHero deal={deal} />

      <DealWorkspaceTabs
        dealId={deal.id}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <EditDealDialog
        key={`${deal.id}-${editOpen}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        deal={deal}
        onSave={(data) => updateDeal(deal.id, data)}
      />
    </div>
  );
}
