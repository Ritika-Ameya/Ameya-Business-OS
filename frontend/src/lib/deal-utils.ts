import type { Deal, DealFilters, RenewalFrequency } from "@/types/deal";

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
  return new Date(date) > new Date();
}

export const defaultDealFilters: DealFilters = {
  status: "all",
  renewal: "all",
};

export const dealStatusLabels: Record<DealFilters["status"], string> = {
  all: "All Status",
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  "on-hold": "On Hold",
};

export const dealRenewalLabels: Record<DealFilters["renewal"], string> = {
  all: "All",
  "this-month": "This Month",
  upcoming: "Upcoming",
  none: "No Renewal",
};

export const renewalFrequencyLabels: Record<RenewalFrequency, string> = {
  none: "No Renewal",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

export function computeNextRenewal(
  startDate: string,
  frequency: RenewalFrequency
): string | undefined {
  if (frequency === "none") return undefined;

  const date = new Date(startDate);
  if (frequency === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === "quarterly") {
    date.setMonth(date.getMonth() + 3);
  } else if (frequency === "annual") {
    date.setFullYear(date.getFullYear() + 1);
  }

  return date.toISOString().split("T")[0];
}

export function filterDeals(deals: Deal[], query: string, filters: DealFilters): Deal[] {
  const normalizedQuery = query.trim().toLowerCase();

  return deals.filter((deal) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      [deal.title, deal.customerName].some((field) =>
        field.toLowerCase().includes(normalizedQuery)
      );

    const matchesStatus =
      filters.status === "all" || deal.status === filters.status;

    const matchesRenewal =
      filters.renewal === "all" ||
      (filters.renewal === "this-month" && isRenewalThisMonth(deal.nextRenewal)) ||
      (filters.renewal === "upcoming" && isUpcomingRenewal(deal.nextRenewal)) ||
      (filters.renewal === "none" && !deal.nextRenewal);

    return matchesSearch && matchesStatus && matchesRenewal;
  });
}

export function getDealsByCustomerId(deals: Deal[], customerId: string): Deal[] {
  return deals.filter((deal) => deal.customerId === customerId);
}
