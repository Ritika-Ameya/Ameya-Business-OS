import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { InvoiceHero } from "@/features/revenue/components/invoices/InvoiceHero";
import { InvoiceWorkspaceTabs } from "@/features/revenue/components/invoices/InvoiceWorkspaceTabs";
import { Button } from "@/shared/ui/button";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { seedInvoices } from "@/features/revenue/data/seed-invoices";
import { createPlaceholderInvoice, getInvoiceById } from "@/features/revenue/utils/invoice-utils";
import type { GenerateInvoiceContext } from "@/features/revenue/types/invoice";

type InvoiceNavigationState = GenerateInvoiceContext & {
  tab?: string;
};

const invoiceTabs = new Set(["overview", "payments", "documents", "timeline"]);

function parseInvoiceTab(value: string | null): string {
  return value && invoiceTabs.has(value) ? value : "overview";
}

export function InvoiceWorkspacePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const location = useLocation();
  const navigationState = location.state as InvoiceNavigationState | null;
  const [searchParams] = useSearchParams();
  const { components } = useDeals();
  const [activeTab, setActiveTab] = useState(() =>
    parseInvoiceTab(searchParams.get("tab") ?? navigationState?.tab ?? null)
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && invoiceTabs.has(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const seedInvoice = invoiceId ? getInvoiceById(seedInvoices, invoiceId) : undefined;
  const invoice =
    seedInvoice ??
    (invoiceId === "inv-new" && navigationState
      ? createPlaceholderInvoice(navigationState, components)
      : undefined);

  if (!invoice) {
    return <Navigate to="/revenue?tab=invoices" replace />;
  }

  const backPath =
    invoiceId === "inv-new" && navigationState?.dealId
      ? `/deals/${navigationState.dealId}`
      : "/revenue?tab=invoices";

  const backLabel =
    invoiceId === "inv-new" && navigationState?.dealId
      ? "Back to Deal"
      : "Back to Revenue";

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

      <InvoiceHero invoice={invoice} />

      <InvoiceWorkspaceTabs
        invoice={invoice}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
