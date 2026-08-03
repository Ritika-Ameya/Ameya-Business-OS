import { RotateCcw } from "lucide-react";
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
import { invoiceStatusLabels } from "@/features/revenue/utils/invoice-utils";
import {
  defaultReportFilters,
  reportQuickDateLabels,
  reportQuickDatePresets,
} from "@/features/reports/utils/report-utils";
import { transactionStatusLabels } from "@/features/expenses/utils/expense-utils";
import { renewalStatusLabels } from "@/features/revenue/utils/revenue-utils";
import type { ExpenseCategoryItem, EmployeeItem, VendorItem } from "@/features/expenses/types/expense";
import type { ReportFilters, ReportTab } from "@/features/reports/types/reports";
import { cn } from "@/shared/utils";

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
  ["partially_paid", "Partially Paid"],
  ["due", "Due"],
];
const renewalStatusOptions = Object.entries(renewalStatusLabels).filter(
  ([value]) => value === "all" || value === "upcoming" || value === "overdue" || value === "renewed"
);

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

const selectClassName =
  "h-9 w-full min-w-0 rounded-lg border-border/70 bg-background sm:w-auto sm:min-w-[9.5rem]";

const dateClassName =
  "h-9 w-full min-w-0 rounded-lg border-border/70 bg-background sm:w-[9.75rem]";

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
    <div className="sticky top-0 z-10 space-y-3 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:p-3.5 dark:bg-card/90">
      {/* Search + reset */}
      <div className="flex items-center gap-2">
        <SearchField
          className="min-w-0 flex-1"
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
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 shrink-0 gap-1.5 rounded-xl px-3 text-muted-foreground hover:text-foreground"
            onClick={() => onFiltersChange(defaultReportFilters())}
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        ) : null}
      </div>

      {/* Date presets + custom range — one compact band */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Date range presets"
        >
          {reportQuickDatePresets.map((preset) => {
            const active = filters.datePreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => applyQuickFilter(preset)}
                className={cn(
                  "h-8 rounded-lg px-2.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {reportQuickDateLabels[preset]}
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
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
            className={dateClassName}
            aria-label="From date"
            title="From date"
          />
          <span className="hidden text-xs text-muted-foreground sm:inline" aria-hidden>
            to
          </span>
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
            className={dateClassName}
            aria-label="To date"
            title="To date"
          />
        </div>
      </div>

      {/* Entity filters — no section chrome */}
      <div className="flex flex-col gap-2 border-t border-border/50 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
        {showCustomerDeal && (
          <>
            <Select
              value={filters.customer}
              onValueChange={(value) => onFiltersChange({ ...filters, customer: value })}
            >
              <SelectTrigger
                size="sm"
                className={selectClassName}
                aria-label="Filter by customer"
              >
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
              <SelectTrigger
                size="sm"
                className={selectClassName}
                aria-label="Filter by deal"
              >
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
          <SelectTrigger
            size="sm"
            className={selectClassName}
            aria-label="Filter by status"
          >
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
              <SelectTrigger
                size="sm"
                className={selectClassName}
                aria-label="Filter by category"
              >
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
              <SelectTrigger
                size="sm"
                className={selectClassName}
                aria-label="Filter by employee"
              >
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
              <SelectTrigger
                size="sm"
                className={selectClassName}
                aria-label="Filter by vendor"
              >
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
      </div>
    </div>
  );
}
