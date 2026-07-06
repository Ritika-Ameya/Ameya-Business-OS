import {
  FileText,
  History,
  LayoutGrid,
  Wallet,
} from "lucide-react";
import { ActivityTimeline } from "@/shared/components/ActivityTimeline";
import { DocumentsTab } from "@/shared/components/DocumentsTab";
import { InvoiceOverviewTab } from "@/features/revenue/components/invoices/InvoiceOverviewTab";
import { InvoicePaymentsTab } from "@/features/revenue/components/invoices/payments/InvoicePaymentsTab";
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
        <InvoicePaymentsTab invoice={invoice} />
      </TabsContent>

      <TabsContent value="documents" className="mt-0">
        <DocumentsTab
          entityType="invoice"
          entityId={invoice.id}
          customerId={invoice.customerId}
          dealId={invoice.dealId}
          title="Invoice Documents"
          description="Upload invoice PDFs and supporting documents."
        />
      </TabsContent>

      <TabsContent value="timeline" className="mt-0">
        <ActivityTimeline entityType="invoice" entityId={invoice.id} />
      </TabsContent>
    </Tabs>
  );
}
