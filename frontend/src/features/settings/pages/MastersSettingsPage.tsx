import { useSearchParams } from "react-router-dom";
import { CountriesMasterPanel } from "@/features/settings/components/masters/CountriesMasterPanel";
import { DealTypesMasterPanel } from "@/features/settings/components/masters/DealTypesMasterPanel";
import { EmployeesMasterPanel } from "@/features/settings/components/masters/EmployeesMasterPanel";
import { ExpenseCategoriesMasterPanel } from "@/features/settings/components/masters/ExpenseCategoriesMasterPanel";
import { IndustriesMasterPanel } from "@/features/settings/components/masters/IndustriesMasterPanel";
import { OpportunitySourcesMasterPanel } from "@/features/settings/components/masters/OpportunitySourcesMasterPanel";
import { PaymentMethodsMasterPanel } from "@/features/settings/components/masters/PaymentMethodsMasterPanel";
import { RenewalTypesMasterPanel } from "@/features/settings/components/masters/RenewalTypesMasterPanel";
import { StagesMasterPanel } from "@/features/settings/components/masters/StagesMasterPanel";
import { StatesMasterPanel } from "@/features/settings/components/masters/StatesMasterPanel";
import { VendorsMasterPanel } from "@/features/settings/components/masters/VendorsMasterPanel";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { masterTabLabels } from "@/features/settings/utils/settings-utils";
import type { MasterTab } from "@/features/settings/types/settings";

const masterTabs: MasterTab[] = [
  "opportunity-sources",
  "industries",
  "stages",
  "deal-types",
  "payment-methods",
  "expense-categories",
  "renewal-types",
  "countries",
  "states",
  "employees",
  "vendors",
];

export function MastersSettingsPage() {
  const { loading } = useAppConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as MasterTab | null;
  const activeTab: MasterTab =
    tabParam && masterTabs.includes(tabParam) ? tabParam : "stages";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading master data...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Masters</h2>
        <p className="text-sm text-muted-foreground">
          Manage pipeline stages, reference data, employees and vendors.
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

        <TabsContent value="opportunity-sources" className="mt-0">
          <OpportunitySourcesMasterPanel />
        </TabsContent>
        <TabsContent value="industries" className="mt-0">
          <IndustriesMasterPanel />
        </TabsContent>
        <TabsContent value="stages" className="mt-0">
          <StagesMasterPanel />
        </TabsContent>
        <TabsContent value="deal-types" className="mt-0">
          <DealTypesMasterPanel />
        </TabsContent>
        <TabsContent value="payment-methods" className="mt-0">
          <PaymentMethodsMasterPanel />
        </TabsContent>
        <TabsContent value="expense-categories" className="mt-0">
          <ExpenseCategoriesMasterPanel />
        </TabsContent>
        <TabsContent value="renewal-types" className="mt-0">
          <RenewalTypesMasterPanel />
        </TabsContent>
        <TabsContent value="countries" className="mt-0">
          <CountriesMasterPanel />
        </TabsContent>
        <TabsContent value="states" className="mt-0">
          <StatesMasterPanel />
        </TabsContent>
        <TabsContent value="employees" className="mt-0">
          <EmployeesMasterPanel />
        </TabsContent>
        <TabsContent value="vendors" className="mt-0">
          <VendorsMasterPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
