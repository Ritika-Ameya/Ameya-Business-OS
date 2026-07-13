import { FileText, History, LayoutGrid, Wallet } from "lucide-react";
import { InvoiceDocumentsTab } from "@/features/revenue/components/invoices/InvoiceDocumentsTab";
import { InvoiceOverviewTab } from "@/features/revenue/components/invoices/InvoiceOverviewTab";
import { InvoicePaymentsTab } from "@/features/revenue/components/invoices/payments/InvoicePaymentsTab";
import { InvoiceTimelineTab } from "@/features/revenue/components/invoices/payments/InvoiceTimelineTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { Invoice } from "@/features/revenue/types/invoice";

interface InvoiceWorkspaceTabsProps {
  invoice: Invoice;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function InvoiceWorkspaceTabs({
  invoice,
  activeTab,
  onTabChange,
}: InvoiceWorkspaceTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="gap-6">
      <div className="overflow-x-auto pb-1">
        <TabsList
          variant="line"
          className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0"
        >
          <TabsTrigger value="overview" className="rounded-lg px-4 py-2">
            <LayoutGrid />
            Overview
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg px-4 py-2">
            <Wallet />
            Payments
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg px-4 py-2">
            <FileText />
            Documents
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg px-4 py-2">
            <History />
            Timeline
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-0">
        <InvoiceOverviewTab invoice={invoice} />
      </TabsContent>

      <TabsContent value="payments" className="mt-0">
        <InvoicePaymentsTab invoiceId={invoice.id} />
      </TabsContent>

      <TabsContent value="documents" className="mt-0">
        <InvoiceDocumentsTab invoice={invoice} />
      </TabsContent>

      <TabsContent value="timeline" className="mt-0">
        <InvoiceTimelineTab invoice={invoice} />
      </TabsContent>
    </Tabs>
  );
}
