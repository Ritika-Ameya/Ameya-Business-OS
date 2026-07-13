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
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import type { Invoice } from "@/features/revenue/types/invoice";

const invoiceTabs = new Set(["overview", "payments", "documents", "timeline"]);

function parseInvoiceTab(value: string | null): string {
  return value && invoiceTabs.has(value) ? value : "overview";
}

export function InvoiceWorkspacePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const location = useLocation();
  const navigationState = location.state as { tab?: string } | null;
  const [searchParams] = useSearchParams();
  const { getInvoice, fetchInvoice, loading, error } = useRevenue();
  const [activeTab, setActiveTab] = useState(() =>
    parseInvoiceTab(searchParams.get("tab") ?? navigationState?.tab ?? null)
  );
  const [resolved, setResolved] = useState<Invoice | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && invoiceTabs.has(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!invoiceId) return;
    const cached = getInvoice(invoiceId);
    if (cached) {
      setResolved(cached);
      setFetchError(null);
      return;
    }
    if (loading) return;

    let cancelled = false;
    setFetching(true);
    setFetchError(null);
    void fetchInvoice(invoiceId)
      .then((invoice) => {
        if (!cancelled) setResolved(invoice);
      })
      .catch((err) => {
        if (!cancelled) {
          setResolved(null);
          setFetchError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [invoiceId, getInvoice, fetchInvoice, loading]);

  useEffect(() => {
    if (!invoiceId) return;
    const cached = getInvoice(invoiceId);
    if (cached) setResolved(cached);
  }, [invoiceId, getInvoice]);

  const invoice = resolved ?? (invoiceId ? getInvoice(invoiceId) : undefined);

  if ((loading || fetching) && !invoice) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Loading invoice…
      </div>
    );
  }

  if ((error || fetchError) && !invoice) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p role="alert" className="text-sm text-destructive">
          {fetchError ?? error}
        </p>
        <Button variant="outline" className="rounded-xl" asChild>
          <Link to="/revenue?tab=invoices">Back to Revenue</Link>
        </Button>
      </div>
    );
  }

  if (!invoice) {
    return <Navigate to="/revenue?tab=invoices" replace />;
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 rounded-xl" asChild>
          <Link to="/revenue?tab=invoices">
            <ArrowLeft />
            Back to Revenue
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
