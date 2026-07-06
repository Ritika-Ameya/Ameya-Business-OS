import { AlertCircle, IndianRupee, ReceiptText, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/shared/components/PageHeader";
import { ExpenseReportTab } from "@/features/reports/components/ExpenseReportTab";
import { OutstandingReportTab } from "@/features/reports/components/OutstandingReportTab";
import { RenewalReportTab } from "@/features/reports/components/RenewalReportTab";
import { ReportExportActions } from "@/features/reports/components/ReportExportActions";
import { ReportFiltersBar } from "@/features/reports/components/ReportFiltersBar";
import { RevenueReportTab } from "@/features/reports/components/RevenueReportTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { toEmployeeItems, toExpenseCategoryItems, toVendorItems } from "@/features/settings/utils/app-config-utils";
import {
  defaultReportFilters,
  getReportCustomers,
  getReportDeals,
} from "@/features/reports/utils/report-utils";
import type { ReportTab } from "@/features/reports/types/reports";

const reportTabs: { value: ReportTab; label: string; icon: typeof ReceiptText }[] = [
  { value: "revenue", label: "Revenue Report", icon: IndianRupee },
  { value: "expense", label: "Expense Report", icon: ReceiptText },
  { value: "outstanding", label: "Outstanding Report", icon: AlertCircle },
  { value: "renewal", label: "Renewal Report", icon: RefreshCw },
];

export function ReportsPage() {
  const appConfig = useAppConfig();
  const { customers } = useCustomers();
  const { deals } = useDeals();
  const { invoices } = useRevenue();
  const categories = toExpenseCategoryItems(appConfig.expenseCategories);
  const vendors = toVendorItems(appConfig.vendors);
  const employees = toEmployeeItems(appConfig.employees);
  const reportCustomers = useMemo(
    () => getReportCustomers(customers, invoices),
    [customers, invoices]
  );
  const reportDeals = useMemo(
    () => getReportDeals(deals, invoices),
    [deals, invoices]
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as ReportTab | null;
  const activeTab: ReportTab =
    tabParam && reportTabs.some((tab) => tab.value === tabParam)
      ? tabParam
      : "revenue";
  const [filters, setFilters] = useState(defaultReportFilters);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
    setFilters((prev) => ({ ...prev, status: "all" }));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Reports"
        subtitle="Analyze your business performance with simple and actionable reports."
        action={<ReportExportActions activeTab={activeTab} />}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-6">
        <div className="overflow-x-auto pb-1">
          <TabsList
            variant="line"
            className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0"
          >
            {reportTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg px-3 py-2 text-xs sm:px-4 sm:text-sm"
              >
                <tab.icon />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ReportFiltersBar
          activeTab={activeTab}
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          vendors={vendors}
          employees={employees}
          customers={reportCustomers}
          deals={reportDeals}
        />

        <TabsContent value="revenue" className="mt-0">
          <RevenueReportTab filters={filters} />
        </TabsContent>
        <TabsContent value="expense" className="mt-0">
          <ExpenseReportTab filters={filters} />
        </TabsContent>
        <TabsContent value="outstanding" className="mt-0">
          <OutstandingReportTab filters={filters} />
        </TabsContent>
        <TabsContent value="renewal" className="mt-0">
          <RenewalReportTab filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
