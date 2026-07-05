import { IndianRupee, Receipt, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/shared/components/PageHeader";
import { RevenueCollectionsTab } from "@/features/revenue/components/RevenueCollectionsTab";
import { RevenueInvoicesTab } from "@/features/revenue/components/RevenueInvoicesTab";
import { RevenueRenewalsTab } from "@/features/revenue/components/RevenueRenewalsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { parseRevenueTab } from "@/features/revenue/utils/revenue-utils";

type RevenueNavigationState = {
  tab?: string;
};

export function RevenuePage() {
  const location = useLocation();
  const navigationState = location.state as RevenueNavigationState | null;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseRevenueTab(searchParams.get("tab"));

  useEffect(() => {
    if (!navigationState?.tab) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", parseRevenueTab(navigationState.tab ?? null));
        return next;
      },
      { replace: true }
    );
    window.history.replaceState({}, document.title);
  }, [navigationState, setSearchParams]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Revenue"
        subtitle="Company-wide financial overview across invoices, collections, and renewals."
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="gap-6"
      >
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
