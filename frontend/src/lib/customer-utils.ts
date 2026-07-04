import type {
  ActiveDealsFilter,
  Customer,
  CustomerFilters,
  OutstandingFilter,
  RenewalFilter,
  StatusFilter,
} from "@/types/customer";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date?: string): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function isRenewalThisMonth(date?: string): boolean {
  if (!date) return false;
  const renewal = new Date(date);
  const now = new Date();
  return (
    renewal.getMonth() === now.getMonth() &&
    renewal.getFullYear() === now.getFullYear()
  );
}

export function isUpcomingRenewal(date?: string): boolean {
  if (!date) return false;
  const renewal = new Date(date);
  const now = new Date();
  return renewal > now;
}

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

    return (
      matchesSearch &&
      matchesStatus &&
      matchesOutstanding &&
      matchesRenewal &&
      matchesDeals
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

export { isValidGstin } from "@/lib/app-config-utils";

export const defaultFilters: CustomerFilters = {
  status: "all",
  outstanding: "all",
  renewal: "all",
  activeDeals: "all",
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
