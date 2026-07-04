import { FilterResetButton } from "@/components/shared/FilterResetButton";
import { SearchField } from "@/components/shared/SearchField";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  datePresetLabels,
  defaultRegisterFilters,
  transactionStatusLabels,
} from "@/lib/expense-utils";
import { getActivePaymentMethods } from "@/lib/app-config-utils";
import { useAppConfig } from "@/hooks/use-app-config";
import type {
  EmployeeItem,
  ExpenseCategoryItem,
  ExpenseRegisterFilters,
  VendorItem,
} from "@/types/expense";

interface ExpenseRegisterFiltersBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  filters: ExpenseRegisterFilters;
  onFiltersChange: (filters: ExpenseRegisterFilters) => void;
  categories: ExpenseCategoryItem[];
  vendors: VendorItem[];
  employees: EmployeeItem[];
}

export function ExpenseRegisterFiltersBar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  categories,
  vendors,
  employees,
}: ExpenseRegisterFiltersBarProps) {
  const { paymentMethods } = useAppConfig();
  const activePaymentMethods = getActivePaymentMethods(paymentMethods);
  const defaults = defaultRegisterFilters();
  const hasActiveFilters =
    filters.datePreset !== defaults.datePreset ||
    filters.category !== defaults.category ||
    filters.status !== defaults.status ||
    filters.vendor !== defaults.vendor ||
    filters.employee !== defaults.employee ||
    filters.paymentMethod !== defaults.paymentMethod;

  const resetAll = () => {
    onQueryChange("");
    onFiltersChange(defaultRegisterFilters());
  };

  return (
    <div className="sticky top-0 z-10 space-y-4 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 dark:bg-card/90">
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder="Search expense, vendor, employee, or reference..."
        ariaLabel="Search expenses"
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Filters
        </span>

        <Select
          value={filters.datePreset}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              datePreset: value as ExpenseRegisterFilters["datePreset"],
            })
          }
        >
          <SelectTrigger size="sm" className="min-w-[130px] rounded-xl">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(datePresetLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filters.datePreset === "custom" && (
          <>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                onFiltersChange({ ...filters, dateFrom: e.target.value })
              }
              className="h-8 w-[140px] rounded-xl"
              aria-label="From date"
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
              className="h-8 w-[140px] rounded-xl"
              aria-label="To date"
            />
          </>
        )}

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
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value as ExpenseRegisterFilters["status"],
            })
          }
        >
          <SelectTrigger size="sm" className="min-w-[120px] rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(transactionStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
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
          value={filters.paymentMethod}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              paymentMethod: value as ExpenseRegisterFilters["paymentMethod"],
            })
          }
        >
          <SelectTrigger size="sm" className="min-w-[140px] rounded-xl">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {activePaymentMethods.map((method) => (
              <SelectItem key={method.id} value={method.slug}>
                {method.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(hasActiveFilters || query.trim().length > 0) && (
          <FilterResetButton onClick={resetAll} />
        )}
      </div>
    </div>
  );
}
