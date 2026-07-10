import {
  FileText,
  History,
  Layers,
  LayoutGrid,
  Receipt,
  RefreshCw,
  StickyNote,
  Wallet,
} from "lucide-react";
import { ActivityTimeline } from "@/shared/components/ActivityTimeline";
import { DocumentsTab } from "@/shared/components/DocumentsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { DealComponentsTab } from "./components/DealComponentsTab";
import { DealInvoicesTab } from "@/features/revenue/components/invoices/DealInvoicesTab";
import { DealNotesTab } from "./DealNotesTab";
import { DealOverviewTab } from "./DealOverviewTab";
import { DealPaymentsTab } from "./DealPaymentsTab";
import { DealRenewalsTab } from "./DealRenewalsTab";
import { useDeals } from "@/features/deals/hooks/use-deals";

interface DealWorkspaceTabsProps {
  dealId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DealWorkspaceTabs({ dealId, activeTab, onTabChange }: DealWorkspaceTabsProps) {
  const { getDeal } = useDeals();
  const deal = getDeal(dealId);

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
          <TabsTrigger value="components" className="rounded-lg px-4 py-2">
            <Layers />
            Components
          </TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg px-4 py-2">
            <Receipt />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg px-4 py-2">
            <Wallet />
            Payments
          </TabsTrigger>
          <TabsTrigger value="renewals" className="rounded-lg px-4 py-2">
            <RefreshCw />
            Renewals
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg px-4 py-2">
            <FileText />
            Documents
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg px-4 py-2">
            <History />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg px-4 py-2">
            <StickyNote />
            Notes
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-0">
        <DealOverviewTab dealId={dealId} />
      </TabsContent>

      <TabsContent value="components" className="mt-0">
        <DealComponentsTab dealId={dealId} />
      </TabsContent>

      <TabsContent value="invoices" className="mt-0">
        <DealInvoicesTab dealId={dealId} />
      </TabsContent>

      <TabsContent value="payments" className="mt-0">
        <DealPaymentsTab dealId={dealId} />
      </TabsContent>

      <TabsContent value="renewals" className="mt-0">
        <DealRenewalsTab dealId={dealId} />
      </TabsContent>

      <TabsContent value="documents" className="mt-0">
        {deal && (
          <DocumentsTab
            entityType="deal"
            entityId={dealId}
            customerId={deal.customerId}
            dealId={dealId}
            title="Deal Documents"
            description="Upload contracts, agreements, and supporting files."
          />
        )}
      </TabsContent>

      <TabsContent value="timeline" className="mt-0">
        <ActivityTimeline entityType="deal" entityId={dealId} />
      </TabsContent>

      <TabsContent value="notes" className="mt-0">
        <DealNotesTab dealId={dealId} />
      </TabsContent>
    </Tabs>
  );
}
