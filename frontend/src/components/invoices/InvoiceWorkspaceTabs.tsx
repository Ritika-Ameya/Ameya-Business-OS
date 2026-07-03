import {
  Clock,
  FileText,
  History,
  LayoutGrid,
  Wallet,
} from "lucide-react";
import { InvoiceEmptyState } from "@/components/invoices/InvoiceEmptyState";
import { InvoiceOverviewTab } from "@/components/invoices/InvoiceOverviewTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Invoice } from "@/types/invoice";

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
        <InvoiceEmptyState
          icon={Wallet}
          title="No payments recorded"
          description="Payment records for this invoice will appear here."
          actionLabel="Record Payment"
          onAction={() => {}}
        />
      </TabsContent>

      <TabsContent value="documents" className="mt-0">
        <InvoiceEmptyState
          icon={FileText}
          title="No documents uploaded"
          description="Invoice PDFs and related documents will be stored here."
        />
      </TabsContent>

      <TabsContent value="timeline" className="mt-0">
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
              <Clock className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">Timeline</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Invoice activity and payment history will appear here.
            </p>
            <div className="mt-8 w-full space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-2.5 rounded-full bg-border" />
                  <div className="w-px flex-1 bg-border" />
                </div>
                <div className="flex-1 rounded-xl border border-border/50 bg-card p-4 text-left opacity-50">
                  <p className="text-xs text-muted-foreground">Waiting for activity</p>
                  <p className="mt-1 text-sm">Invoice events will build over time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
