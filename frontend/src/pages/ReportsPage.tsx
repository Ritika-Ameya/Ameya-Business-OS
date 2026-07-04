import { AlertCircle, IndianRupee, ReceiptText, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/customers/PageHeader";
import { ExpenseReportTab } from "@/components/reports/ExpenseReportTab";
import { OutstandingReportTab } from "@/components/reports/OutstandingReportTab";
import { RenewalReportTab } from "@/components/reports/RenewalReportTab";
import { ReportExportActions } from "@/components/reports/ReportExportActions";
import { ReportFiltersBar } from "@/components/reports/ReportFiltersBar";
import { RevenueReportTab } from "@/components/reports/RevenueReportTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExpenses } from "@/hooks/use-expenses";
import { defaultReportFilters } from "@/lib/report-utils";
import type { ReportTab } from "@/types/reports";

const reportTabs: { value: ReportTab; label: string; icon: typeof ReceiptText }[] = [
  { value: "revenue", label: "Revenue Report", icon: IndianRupee },
  { value: "expense", label: "Expense Report", icon: ReceiptText },
  { value: "outstanding", label: "Outstanding Report", icon: AlertCircle },
  { value: "renewal", label: "Renewal Report", icon: RefreshCw },
];

export function ReportsPage() {
  const { categories, vendors, employees } = useExpenses();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as ReportTab | null;
  const activeTab: ReportTab =
    tabParam && reportTabs.some((tab) => tab.value === tabParam)
      ? tabParam
      : "revenue";
  const [filters, setFilters] = useState(defaultReportFilters());

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        subtitle="Analyze your business performance with simple and actionable reports."
        action={<ReportExportActions />}
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
