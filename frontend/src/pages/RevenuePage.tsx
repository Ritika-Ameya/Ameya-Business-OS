import { IndianRupee, Receipt, RefreshCw } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/customers/PageHeader";
import { RevenueCollectionsTab } from "@/components/revenue/RevenueCollectionsTab";
import { RevenueInvoicesTab } from "@/components/revenue/RevenueInvoicesTab";
import { RevenueRenewalsTab } from "@/components/revenue/RevenueRenewalsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RevenuePage() {
  const [activeTab, setActiveTab] = useState("invoices");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Revenue"
        subtitle="Company-wide financial overview across invoices, collections, and renewals."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <div className="overflow-x-auto pb-1">
          <TabsList
            variant="line"
            className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0"
          >
            <TabsTrigger value="invoices" className="rounded-lg px-4 py-2">
              <Receipt />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="collections" className="rounded-lg px-4 py-2">
              <IndianRupee />
              Collections
            </TabsTrigger>
            <TabsTrigger value="renewals" className="rounded-lg px-4 py-2">
              <RefreshCw />
              Renewals
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="invoices" className="mt-0">
          <RevenueInvoicesTab />
        </TabsContent>

        <TabsContent value="collections" className="mt-0">
          <RevenueCollectionsTab />
        </TabsContent>

        <TabsContent value="renewals" className="mt-0">
          <RevenueRenewalsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
