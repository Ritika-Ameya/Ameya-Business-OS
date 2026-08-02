import {
  FileText,
  Handshake,
  History,
  LayoutGrid,
  Receipt,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { CustomerInvoicesTab } from "@/features/revenue/components/invoices/CustomerInvoicesTab";
import { CustomerDealsTab } from "./CustomerDealsTab";
import { CustomerFilesTab } from "./CustomerFilesTab";
import { CustomerOverviewTab } from "./CustomerOverviewTab";
import { CustomerPaymentsTab } from "./CustomerPaymentsTab";
import { CustomerRenewalsTab } from "./CustomerRenewalsTab";
import { CustomerTimelineTab } from "./CustomerTimelineTab";
import type { Customer } from "@/features/customers/types/customer";

interface CustomerWorkspaceTabsProps {
  customer: Customer;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function CustomerWorkspaceTabs({
  customer,
  activeTab,
  onTabChange,
}: CustomerWorkspaceTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="gap-6">
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/80 px-2 pt-1 shadow-card backdrop-blur-sm [-webkit-overflow-scrolling:touch]">
        <TabsList variant="line" className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0">
          <TabsTrigger value="overview" className="min-h-11 rounded-lg px-3 py-2.5 sm:px-4">
            <LayoutGrid />
            Overview
          </TabsTrigger>
          <TabsTrigger value="deals" className="min-h-11 rounded-lg px-3 py-2.5 sm:px-4">
            <Handshake />
            Deals
          </TabsTrigger>
          <TabsTrigger value="invoices" className="min-h-11 rounded-lg px-3 py-2.5 sm:px-4">
            <Receipt />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="min-h-11 rounded-lg px-3 py-2.5 sm:px-4">
            <Wallet />
            Payments
          </TabsTrigger>
          <TabsTrigger value="renewals" className="min-h-11 rounded-lg px-3 py-2.5 sm:px-4">
            <RefreshCw />
            Renewals
          </TabsTrigger>
          <TabsTrigger value="files" className="min-h-11 rounded-lg px-3 py-2.5 sm:px-4">
            <FileText />
            Files
          </TabsTrigger>
          <TabsTrigger value="timeline" className="min-h-11 rounded-lg px-3 py-2.5 sm:px-4">
            <History />
            Timeline
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-0">
        <CustomerOverviewTab customer={customer} />
      </TabsContent>

      <TabsContent value="deals" className="mt-0">
        <CustomerDealsTab customer={customer} />
      </TabsContent>

      <TabsContent value="invoices" className="mt-0">
        <CustomerInvoicesTab customer={customer} />
      </TabsContent>

      <TabsContent value="payments" className="mt-0">
        <CustomerPaymentsTab customer={customer} />
      </TabsContent>

      <TabsContent value="renewals" className="mt-0">
        <CustomerRenewalsTab customer={customer} />
      </TabsContent>

      <TabsContent value="files" className="mt-0">
        <CustomerFilesTab customer={customer} />
      </TabsContent>

      <TabsContent value="timeline" className="mt-0">
        <CustomerTimelineTab customer={customer} />
      </TabsContent>
    </Tabs>
  );
}
