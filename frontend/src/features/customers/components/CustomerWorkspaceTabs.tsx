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
import { CustomerEmptyState } from "./CustomerEmptyState";
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
      <div className="overflow-x-auto pb-1">
        <TabsList variant="line" className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0">
          <TabsTrigger value="overview" className="rounded-lg px-4 py-2">
            <LayoutGrid />
            Overview
          </TabsTrigger>
          <TabsTrigger value="deals" className="rounded-lg px-4 py-2">
            <Handshake />
            Deals
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
          <TabsTrigger value="files" className="rounded-lg px-4 py-2">
            <FileText />
            Files
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg px-4 py-2">
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
        <CustomerEmptyState
          icon={FileText}
          title="No documents uploaded"
          description="Upload contracts, agreements, and other documents for this customer."
        />
      </TabsContent>

      <TabsContent value="timeline" className="mt-0">
        <CustomerTimelineTab customer={customer} />
      </TabsContent>
    </Tabs>
  );
}
