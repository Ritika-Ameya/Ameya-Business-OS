import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { InvoiceHero } from "@/components/invoices/InvoiceHero";
import { InvoiceWorkspaceTabs } from "@/components/invoices/InvoiceWorkspaceTabs";
import { Button } from "@/components/ui/button";
import { seedInvoices } from "@/data/seed-invoices";
import { createPlaceholderInvoice, getInvoiceById } from "@/lib/invoice-utils";
import type { GenerateInvoiceContext } from "@/types/invoice";

export function InvoiceWorkspacePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const location = useLocation();
  const navigationState = location.state as GenerateInvoiceContext | null;
  const [activeTab, setActiveTab] = useState("overview");

  const seedInvoice = invoiceId ? getInvoiceById(seedInvoices, invoiceId) : undefined;
  const invoice =
    seedInvoice ??
    (invoiceId === "inv-new" && navigationState
      ? createPlaceholderInvoice(navigationState)
      : undefined);

  if (!invoice) {
    return <Navigate to="/invoices" replace />;
  }

  const backPath =
    invoiceId === "inv-new" && navigationState?.dealId
      ? `/deals/${navigationState.dealId}`
      : "/invoices";

  const backLabel =
    invoiceId === "inv-new" && navigationState?.dealId
      ? "Back to Deal"
      : "Back to Invoices";

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
