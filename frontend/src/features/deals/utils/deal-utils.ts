import type { Deal, DealFilters } from "@/features/deals/types/deal";
import type { DealComponent } from "@/features/deals/types/deal-component";
import { hasComponentRenewal, getComponentCurrentDueDate } from "@/features/deals/utils/deal-component-utils";
import { isRenewalThisMonth, isUpcomingRenewal } from "@/shared/utils/format-date";

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

function getDealRenewalDates(
  dealId: string,
  components: DealComponent[]
): string[] {
  return components
    .filter(
      (component) =>
        component.dealId === dealId &&
        hasComponentRenewal(component.renewalFrequency) &&
        Boolean(getComponentCurrentDueDate(component))
    )
    .map((component) => getComponentCurrentDueDate(component))
    .filter(Boolean);
}

export function getEarliestComponentRenewal(
  dealId: string,
  components: DealComponent[]
): string | undefined {
  return getNextComponentRenewal(dealId, components)?.date;
}

export function getNextComponentRenewal(
  dealId: string,
  components: DealComponent[]
): { date: string; componentName: string; moreCount: number } | undefined {
  const renewing = components
    .filter(
      (component) =>
        component.dealId === dealId &&
        hasComponentRenewal(component.renewalFrequency) &&
        Boolean(getComponentCurrentDueDate(component))
    )
    .map((component) => ({
      date: getComponentCurrentDueDate(component),
      componentName: component.name,
      time: new Date(getComponentCurrentDueDate(component)).getTime(),
    }))
    .filter((item) => !Number.isNaN(item.time))
    .sort((a, b) => a.time - b.time);

  const next = renewing[0];
  if (!next) return undefined;
  return {
    date: next.date,
    componentName: next.componentName,
    moreCount: Math.max(0, renewing.length - 1),
  };
}

export function filterDeals(
  deals: Deal[],
  query: string,
  filters: DealFilters,
  components: DealComponent[] = []
): Deal[] {
  const normalizedQuery = query.trim().toLowerCase();

  return deals.filter((deal) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      [deal.title, deal.customerName].some((field) =>
        field.toLowerCase().includes(normalizedQuery)
      );

    const matchesStatus =
      filters.status === "all" || deal.status === filters.status;

    const renewalDates = getDealRenewalDates(deal.id, components);
    const matchesRenewal =
      filters.renewal === "all" ||
      (filters.renewal === "this-month" &&
        renewalDates.some((date) => isRenewalThisMonth(date))) ||
      (filters.renewal === "upcoming" &&
        renewalDates.some((date) => isUpcomingRenewal(date))) ||
      (filters.renewal === "none" && renewalDates.length === 0);

    return matchesSearch && matchesStatus && matchesRenewal;
  });
}

export function getDealsByCustomerId(deals: Deal[], customerId: string): Deal[] {
  return deals.filter((deal) => deal.customerId === customerId);
}
