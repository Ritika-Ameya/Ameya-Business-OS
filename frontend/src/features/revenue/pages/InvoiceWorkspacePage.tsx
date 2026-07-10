import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { InvoiceHero } from "@/features/revenue/components/invoices/InvoiceHero";
import { InvoiceWorkspaceTabs } from "@/features/revenue/components/invoices/InvoiceWorkspaceTabs";
import { Button } from "@/shared/ui/button";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";

const invoiceTabs = new Set(["overview", "payments", "documents", "timeline"]);

function parseInvoiceTab(value: string | null): string {
  return value && invoiceTabs.has(value) ? value : "overview";
}

export function InvoiceWorkspacePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const { getInvoice } = useRevenue();
  const [activeTab, setActiveTab] = useState(() =>
    parseInvoiceTab(searchParams.get("tab"))
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && invoiceTabs.has(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const invoice = invoiceId ? getInvoice(invoiceId) : undefined;

  if (!invoice) {
    return <Navigate to="/revenue?tab=invoices" replace />;
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 rounded-xl" asChild>
          <Link to={invoice.dealId ? `/deals/${invoice.dealId}` : "/revenue?tab=invoices"}>
            <ArrowLeft />
            {invoice.dealId ? "Back to Deal" : "Back to Revenue"}
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
