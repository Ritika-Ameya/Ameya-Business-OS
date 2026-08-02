import { FilterResetButton } from "@/shared/components/FilterResetButton";
import {
  FilterField,
  FilterToolbar,
  filterControlClassName,
  filterDateControlClassName,
} from "@/shared/components/FilterToolbar";
import { SearchField } from "@/shared/components/SearchField";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  datePresetLabels,
  defaultRegisterFilters,
  transactionStatusLabels,
} from "@/features/expenses/utils/expense-utils";
import { getActivePaymentMethods } from "@/features/settings/utils/app-config-utils";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import type {
  EmployeeItem,
  ExpenseCategoryItem,
  ExpenseRegisterFilters,
  VendorItem,
} from "@/features/expenses/types/expense";

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
    <div className="sticky top-0 z-10 space-y-4 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:p-4 dark:bg-card/90">
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder="Search expense, vendor, employee, or reference..."
        ariaLabel="Search expenses"
      />

      <FilterToolbar>
        <FilterField label="Date Range">
          <Select
            value={filters.datePreset}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                datePreset: value as ExpenseRegisterFilters["datePreset"],
              })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by date range"
            >
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(datePresetLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        {filters.datePreset === "custom" && (
          <>
            <FilterField label="From">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateFrom: e.target.value })
                }
                className={filterDateControlClassName}
                aria-label="From date"
              />
            </FilterField>
            <FilterField label="To">
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                className={filterDateControlClassName}
                aria-label="To date"
              />
            </FilterField>
          </>
        )}

        <FilterField label="Category">
          <Select
            value={filters.category}
            onValueChange={(value) => onFiltersChange({ ...filters, category: value })}
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by category"
            >
              <SelectValue placeholder="Select category" />
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
        </FilterField>

        <FilterField label="Status">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value as ExpenseRegisterFilters["status"],
              })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by status"
            >
              <SelectValue placeholder="Select status" />
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
        </FilterField>

        <FilterField label="Vendor">
          <Select
            value={filters.vendor}
            onValueChange={(value) => onFiltersChange({ ...filters, vendor: value })}
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by vendor"
            >
              <SelectValue placeholder="Select vendor" />
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
        </FilterField>

        <FilterField label="Employee">
          <Select
            value={filters.employee}
            onValueChange={(value) => onFiltersChange({ ...filters, employee: value })}
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by employee"
            >
              <SelectValue placeholder="Select employee" />
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
        </FilterField>

        <FilterField label="Payment Method">
          <Select
            value={filters.paymentMethod}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                paymentMethod: value as ExpenseRegisterFilters["paymentMethod"],
              })
            }
          >
            <SelectTrigger
              size="sm"
              className={filterControlClassName}
              aria-label="Filter by payment method"
            >
              <SelectValue placeholder="Select payment method" />
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
        </FilterField>

        {(hasActiveFilters || query.trim().length > 0) && (
          <FilterResetButton onClick={resetAll} className="sm:mb-0.5" />
        )}
      </FilterToolbar>
    </div>
  );
}
