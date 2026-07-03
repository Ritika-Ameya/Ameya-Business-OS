import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { InvoiceHero } from "@/components/invoices/InvoiceHero";
import { InvoiceWorkspaceTabs } from "@/components/invoices/InvoiceWorkspaceTabs";
import { Button } from "@/components/ui/button";
import { seedInvoices } from "@/data/seed-invoices";
import { getInvoiceById } from "@/lib/invoice-utils";

export function InvoiceWorkspacePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  const invoice = invoiceId ? getInvoiceById(seedInvoices, invoiceId) : undefined;

  if (!invoice) {
    return <Navigate to="/invoices" replace />;
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 rounded-xl" asChild>
          <Link to="/invoices">
            <ArrowLeft />
            Back to Invoices
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
