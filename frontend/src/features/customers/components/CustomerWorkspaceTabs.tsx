import {
  Clock,
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
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-16">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
              <Clock className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">Timeline</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A complete history of deals, invoices, payments, and renewals will
              appear here.
            </p>
            <div className="mt-8 w-full space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-2.5 rounded-full bg-border" />
                  <div className="w-px flex-1 bg-border" />
                </div>
                <div className="flex-1 rounded-xl border border-border/50 bg-card p-4 text-left opacity-50">
                  <p className="text-xs text-muted-foreground">Waiting for activity</p>
                  <p className="mt-1 text-sm">Your customer timeline will build over time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
