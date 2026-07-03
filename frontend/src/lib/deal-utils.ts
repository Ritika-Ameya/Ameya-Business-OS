import type { Deal, DealFilters } from "@/types/deal";

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

export function getDealById(deals: Deal[], id: string): Deal | undefined {
  return deals.find((deal) => deal.id === id);
}

export function getDealsByCustomerId(deals: Deal[], customerId: string): Deal[] {
  return deals.filter((deal) => deal.customerId === customerId);
}

export function createPlaceholderDeal(
  dealId: string,
  customerId: string,
  customerName: string
): Deal {
  return {
    id: dealId,
    title: "New Deal",
    customerId,
    customerName,
    status: "draft",
    startDate: new Date().toISOString().split("T")[0],
    componentsCount: 0,
  };
}
