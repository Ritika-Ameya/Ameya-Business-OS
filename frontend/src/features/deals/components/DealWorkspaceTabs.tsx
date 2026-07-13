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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { ReactNode } from "react";
import { DealComponentsTab } from "./components/DealComponentsTab";
import { DealDocumentsTab } from "./DealDocumentsTab";
import { DealInvoicesTab } from "@/features/revenue/components/invoices/DealInvoicesTab";
import { DealNotesTab } from "./DealNotesTab";
import { DealOverviewTab } from "./DealOverviewTab";
import { DealRenewalsTab } from "./DealRenewalsTab";
import { DealTimelineTab } from "./DealTimelineTab";
import { PlaceholderCard } from "./PlaceholderCard";
import { useDeals } from "@/features/deals/hooks/use-deals";

interface DealWorkspaceTabsProps {
  dealId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function TabPlaceholderGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function DealWorkspaceTabs({ dealId, activeTab, onTabChange }: DealWorkspaceTabsProps) {
  const { getDeal } = useDeals();
  const deal = getDeal(dealId);

  if (!deal) return null;

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
        <DealOverviewTab deal={deal} />
      </TabsContent>

      <TabsContent value="components" className="mt-0">
        <DealComponentsTab dealId={dealId} />
      </TabsContent>

      <TabsContent value="invoices" className="mt-0">
        <DealInvoicesTab dealId={dealId} />
      </TabsContent>

      <TabsContent value="payments" className="mt-0">
        <TabPlaceholderGrid>
          <PlaceholderCard
            icon={Wallet}
            title="Payment History"
            description="Recorded payments"
            message="Payment records will appear here once received."
            accent="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <PlaceholderCard
            icon={Receipt}
            title="Outstanding"
            description="Amount due"
            message="Outstanding balance will be shown here."
            accent="bg-amber-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
          />
        </TabPlaceholderGrid>
      </TabsContent>

      <TabsContent value="renewals" className="mt-0">
        <DealRenewalsTab deal={deal} />
      </TabsContent>

      <TabsContent value="documents" className="mt-0">
        <DealDocumentsTab deal={deal} />
      </TabsContent>

      <TabsContent value="timeline" className="mt-0">
        <DealTimelineTab deal={deal} />
      </TabsContent>

      <TabsContent value="notes" className="mt-0">
        <DealNotesTab deal={deal} />
      </TabsContent>
    </Tabs>
  );
}
