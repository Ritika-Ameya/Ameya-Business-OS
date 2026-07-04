import { useSearchParams } from "react-router-dom";
import { DealTypesMasterPanel } from "@/components/settings/masters/DealTypesMasterPanel";
import { EmployeesMasterPanel } from "@/components/settings/masters/EmployeesMasterPanel";
import { ExpenseCategoriesMasterPanel } from "@/components/settings/masters/ExpenseCategoriesMasterPanel";
import { PaymentMethodsMasterPanel } from "@/components/settings/masters/PaymentMethodsMasterPanel";
import { RenewalTypesMasterPanel } from "@/components/settings/masters/RenewalTypesMasterPanel";
import { VendorsMasterPanel } from "@/components/settings/masters/VendorsMasterPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { masterTabLabels } from "@/lib/settings-utils";
import type { MasterTab } from "@/types/settings";

const masterTabs: MasterTab[] = [
  "employees",
  "vendors",
  "expense-categories",
  "renewal-types",
  "payment-methods",
  "deal-types",
];

export function MastersSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as MasterTab | null;
  const activeTab: MasterTab =
    tabParam && masterTabs.includes(tabParam) ? tabParam : "employees";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Masters</h2>
        <p className="text-sm text-muted-foreground">
          Manage employees, vendors, categories and reference data.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
        <div className="overflow-x-auto pb-1">
          <TabsList
            variant="line"
            className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0"
          >
            {masterTabs.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="rounded-lg px-3 py-2 text-xs sm:text-sm">
                {masterTabLabels[tab]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="employees" className="mt-0">
          <EmployeesMasterPanel />
        </TabsContent>
        <TabsContent value="vendors" className="mt-0">
          <VendorsMasterPanel />
        </TabsContent>
        <TabsContent value="expense-categories" className="mt-0">
          <ExpenseCategoriesMasterPanel />
        </TabsContent>
        <TabsContent value="renewal-types" className="mt-0">
          <RenewalTypesMasterPanel />
        </TabsContent>
        <TabsContent value="payment-methods" className="mt-0">
          <PaymentMethodsMasterPanel />
        </TabsContent>
        <TabsContent value="deal-types" className="mt-0">
          <DealTypesMasterPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
