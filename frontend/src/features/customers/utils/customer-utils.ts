import type {
  ActiveDealsFilter,
  Customer,
  CustomerFilters,
  OutstandingFilter,
  RecordTypeFilter,
  RenewalFilter,
  StatusFilter,
} from "@/features/customers/types/customer";
import { isRenewalThisMonth, isUpcomingRenewal } from "@/shared/utils/format-date";

export function filterCustomers(
  customers: Customer[],
  query: string,
  filters: CustomerFilters
): Customer[] {
  const normalizedQuery = query.trim().toLowerCase();

  return customers.filter((customer) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      [
        customer.name,
        customer.company,
        customer.gst ?? "",
        customer.phone,
        customer.email,
      ].some((field) => field.toLowerCase().includes(normalizedQuery));

    const matchesStatus =
      filters.status === "all" || customer.status === filters.status;

    const matchesOutstanding =
      filters.outstanding === "all" ||
      (filters.outstanding === "has-outstanding" && customer.outstanding > 0) ||
      (filters.outstanding === "none" && customer.outstanding === 0);

    const matchesRenewal =
      filters.renewal === "all" ||
      (filters.renewal === "this-month" && isRenewalThisMonth(customer.nextRenewal)) ||
      (filters.renewal === "upcoming" && isUpcomingRenewal(customer.nextRenewal));

    const matchesDeals =
      filters.activeDeals === "all" ||
      (filters.activeDeals === "has-deals" && customer.activeDeals > 0) ||
      (filters.activeDeals === "none" && customer.activeDeals === 0);

    const matchesRecordType =
      filters.recordType === "all" || customer.recordType === filters.recordType;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesOutstanding &&
      matchesRenewal &&
      matchesDeals &&
      matchesRecordType
    );
  });
}

export function computeCustomerStats(customers: Customer[]) {
  const activeCustomers = customers.filter((c) => c.status === "active");
  const outstandingAmount = customers.reduce((sum, c) => sum + c.outstanding, 0);
  const renewalsThisMonth = customers.filter((c) =>
    isRenewalThisMonth(c.nextRenewal)
  ).length;

  return {
    total: customers.length,
    active: activeCustomers.length,
    outstandingAmount,
    renewalsThisMonth,
  };
}

export function isValidEmail(email: string): boolean {
  if (!email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const defaultFilters: CustomerFilters = {
  status: "all",
  outstanding: "all",
  renewal: "all",
  activeDeals: "all",
  recordType: "all",
};

export const statusFilterLabels: Record<StatusFilter, string> = {
  all: "All Status",
  active: "Active",
  inactive: "Inactive",
  prospect: "Prospect",
};

export const outstandingFilterLabels: Record<OutstandingFilter, string> = {
  all: "All",
  "has-outstanding": "Has Outstanding",
  none: "No Outstanding",
};

export const renewalFilterLabels: Record<RenewalFilter, string> = {
  all: "All",
  "this-month": "This Month",
  upcoming: "Upcoming",
};

export const activeDealsFilterLabels: Record<ActiveDealsFilter, string> = {
  all: "All",
  "has-deals": "Has Deals",
  none: "No Deals",
};

export const recordTypeFilterLabels: Record<RecordTypeFilter, string> = {
  all: "All",
  opportunity: "Opportunity",
  customer: "Customer",
};
