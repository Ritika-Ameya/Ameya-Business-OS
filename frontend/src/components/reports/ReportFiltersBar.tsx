import { CalendarClock } from "lucide-react";
import { FilterResetButton } from "@/shared/components/FilterResetButton";
import { SearchField } from "@/shared/components/SearchField";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { invoiceStatusLabels } from "@/lib/invoice-utils";
import {
  defaultReportFilters,
  reportQuickDateLabels,
  reportQuickDatePresets,
} from "@/lib/report-utils";
import { transactionStatusLabels } from "@/lib/expense-utils";
import { renewalStatusLabels } from "@/lib/revenue-utils";
import type { ExpenseCategoryItem, EmployeeItem, VendorItem } from "@/types/expense";
import type { ReportFilters, ReportTab } from "@/types/reports";

interface ReportFiltersBarProps {
  activeTab: ReportTab;
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  categories: ExpenseCategoryItem[];
  vendors: VendorItem[];
  employees: EmployeeItem[];
  customers: { id: string; name: string }[];
  deals: { id: string; title: string }[];
}

const revenueStatusOptions = Object.entries(invoiceStatusLabels);
const expenseStatusOptions = [
  ["all", "All Status"],
  ...Object.entries(transactionStatusLabels),
];
const outstandingStatusOptions = [
  ["all", "All Status"],
  ["pending", "Pending"],
  ["partial", "Partial"],
  ["overdue", "Overdue"],
  ["sent", "Sent"],
];
const renewalStatusOptions = Object.entries(renewalStatusLabels);

function getStatusOptions(tab: ReportTab) {
  switch (tab) {
    case "expense":
      return expenseStatusOptions;
    case "outstanding":
      return outstandingStatusOptions;
    case "renewal":
      return renewalStatusOptions;
    default:
      return revenueStatusOptions;
  }
}

export function ReportFiltersBar({
  activeTab,
  filters,
  onFiltersChange,
  categories,
  vendors,
  employees,
  customers,
  deals,
}: ReportFiltersBarProps) {
  const defaults = defaultReportFilters();
  const statusOptions = getStatusOptions(activeTab);
  const showCustomerDeal = activeTab !== "expense";
  const showExpenseFilters = activeTab === "expense";

  const hasActiveFilters =
    filters.datePreset !== defaults.datePreset ||
    filters.dateFrom !== defaults.dateFrom ||
    filters.dateTo !== defaults.dateTo ||
    filters.customer !== defaults.customer ||
    filters.deal !== defaults.deal ||
    filters.status !== defaults.status ||
    filters.category !== defaults.category ||
    filters.employee !== defaults.employee ||
    filters.vendor !== defaults.vendor ||
    filters.search !== defaults.search;

  const applyQuickFilter = (preset: (typeof reportQuickDatePresets)[number]) => {
    onFiltersChange({
      ...filters,
      datePreset: preset,
      dateFrom: "",
      dateTo: "",
    });
  };

  return (
    <div className="sticky top-0 z-10 space-y-4 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 dark:bg-card/90">
      <SearchField
        value={filters.search}
        onChange={(value) => onFiltersChange({ ...filters, search: value })}
        placeholder={
          activeTab === "expense"
            ? "Search expenses, vendors, categories..."
            : activeTab === "renewal"
              ? "Search customers, deals, renewals..."
              : "Search invoices, customers, deals..."
        }
        ariaLabel="Search report records"
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <CalendarClock className="size-3.5" />
            Date Range
          </span>
          {reportQuickDatePresets.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant={filters.datePreset === preset ? "default" : "outline"}
              className="rounded-xl"
              onClick={() => applyQuickFilter(preset)}
            >
              {reportQuickDateLabels[preset]}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                datePreset: "custom",
                dateFrom: e.target.value,
              })
            }
            className="h-9 w-[150px] rounded-xl"
            aria-label="From date"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                datePreset: "custom",
                dateTo: e.target.value,
              })
            }
            className="h-9 w-[150px] rounded-xl"
            aria-label="To date"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Filters
        </span>

        {showCustomerDeal && (
          <>
            <Select
              value={filters.customer}
              onValueChange={(value) => onFiltersChange({ ...filters, customer: value })}
            >
              <SelectTrigger size="sm" className="min-w-[140px] rounded-xl">
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.deal}
              onValueChange={(value) => onFiltersChange({ ...filters, deal: value })}
            >
              <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
                <SelectValue placeholder="Deal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deals</SelectItem>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
        >
          <SelectTrigger size="sm" className="min-w-[120px] rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showExpenseFilters && (
          <>
            <Select
              value={filters.category}
              onValueChange={(value) => onFiltersChange({ ...filters, category: value })}
            >
              <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.employee}
              onValueChange={(value) => onFiltersChange({ ...filters, employee: value })}
            >
              <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.vendor}
              onValueChange={(value) => onFiltersChange({ ...filters, vendor: value })}
            >
              <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {hasActiveFilters && (
          <FilterResetButton onClick={() => onFiltersChange(defaultReportFilters())} />
        )}
      </div>
    </div>
  );
}
