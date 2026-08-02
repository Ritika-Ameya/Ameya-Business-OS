import { useMemo } from "react";
import {
  FilterToolbar,
  filterControlClassName,
  filterDateControlClassName,
} from "@/shared/components/FilterToolbar";
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
import { useDeals } from "@/features/deals/hooks/use-deals";
import {
  defaultRenewalFilters,
  getCompanyRenewals,
  renewalStatusLabels,
  renewalTypeLabels,
} from "@/features/revenue/utils/revenue-utils";
import {
  buildQuarterOptions,
  renewalDatePresetLabels,
} from "@/features/revenue/utils/renewal-date-utils";
import type { RenewalFilters } from "@/features/revenue/types/revenue";

interface RevenueRenewalsFiltersProps {
  filters: RenewalFilters;
  onFiltersChange: (filters: RenewalFilters) => void;
}

export function RevenueRenewalsFilters({
  filters,
  onFiltersChange,
}: RevenueRenewalsFiltersProps) {
  const { deals, components } = useDeals();
  const customers = useMemo(() => {
    const map = new Map<string, string>();
    for (const renewal of getCompanyRenewals(deals, components)) {
      map.set(renewal.customerId, renewal.customerName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [deals, components]);

  const quarterOptions = useMemo(() => buildQuarterOptions(), []);

  const hasActiveFilters =
    filters.customer !== defaultRenewalFilters.customer ||
    filters.renewalType !== defaultRenewalFilters.renewalType ||
    filters.date !== defaultRenewalFilters.date ||
    filters.status !== defaultRenewalFilters.status ||
    filters.search !== defaultRenewalFilters.search ||
    filters.customFrom !== defaultRenewalFilters.customFrom ||
    filters.customTo !== defaultRenewalFilters.customTo ||
    filters.selectedMonth !== defaultRenewalFilters.selectedMonth ||
    filters.selectedQuarter !== defaultRenewalFilters.selectedQuarter;

  const statusOptions = Object.entries(renewalStatusLabels).filter(
    ([value]) => value !== "overdue"
  );

  return (
    <div className="space-y-4">
      <SearchField
        value={filters.search}
        onChange={(value) => onFiltersChange({ ...filters, search: value })}
        placeholder="Search customer, deal, component, date…"
        ariaLabel="Search renewals"
      />

      <FilterToolbar>
        <Select
          value={filters.customer}
          onValueChange={(value) => onFiltersChange({ ...filters, customer: value })}
        >
          <SelectTrigger size="sm" className={filterControlClassName}>
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
          value={filters.renewalType}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              renewalType: value as RenewalFilters["renewalType"],
            })
          }
        >
          <SelectTrigger size="sm" className={filterControlClassName}>
            <SelectValue placeholder="Renewal Type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(renewalTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.date}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              date: value as RenewalFilters["date"],
              selectedMonth:
                value === "month-wise"
                  ? filters.selectedMonth || new Date().toISOString().slice(0, 7)
                  : filters.selectedMonth,
              selectedQuarter:
                value === "quarter-wise"
                  ? filters.selectedQuarter ||
                    `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`
                  : filters.selectedQuarter,
            })
          }
        >
          <SelectTrigger size="sm" className={filterControlClassName}>
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(renewalDatePresetLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filters.date === "custom" && (
          <>
            <Input
              type="date"
              value={filters.customFrom}
              onChange={(e) =>
                onFiltersChange({ ...filters, customFrom: e.target.value })
              }
              className={filterDateControlClassName}
              aria-label="Custom from date"
            />
            <Input
              type="date"
              value={filters.customTo}
              onChange={(e) =>
                onFiltersChange({ ...filters, customTo: e.target.value })
              }
              className={filterDateControlClassName}
              aria-label="Custom to date"
            />
          </>
        )}

        {filters.date === "month-wise" && (
          <Input
            type="month"
            value={filters.selectedMonth}
            onChange={(e) =>
              onFiltersChange({ ...filters, selectedMonth: e.target.value })
            }
            className={filterDateControlClassName}
            aria-label="Select month"
          />
        )}

        {filters.date === "quarter-wise" && (
          <Select
            value={filters.selectedQuarter}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, selectedQuarter: value })
            }
          >
            <SelectTrigger size="sm" className={filterControlClassName}>
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              {quarterOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value as RenewalFilters["status"],
            })
          }
        >
          <SelectTrigger size="sm" className={filterControlClassName}>
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

        {hasActiveFilters && (
          <FilterResetButton onClick={() => onFiltersChange(defaultRenewalFilters)} />
        )}
      </FilterToolbar>
    </div>
  );
}
