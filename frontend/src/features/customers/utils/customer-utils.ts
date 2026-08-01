import type {
  ActiveDealsFilter,
  Customer,
  CustomerFilters,
  OutstandingFilter,
  RecordTypeFilter,
  RenewalFilter,
  StatusFilter,
} from "@/features/customers/types/customer";
import {
  getStageById,
  getStagesForRecordType,
} from "@/features/customers/utils/stage-utils";
import type { SettingsStage } from "@/features/settings/types/settings";
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

export interface OpportunityStageCount {
  stageId: string;
  stageName: string;
  color: string;
  count: number;
}

export interface CustomerStatusCount {
  status: "active" | "inactive" | "prospect";
  label: string;
  color: string;
  count: number;
}

export function computeCustomerStats(
  customers: Customer[],
  stages: SettingsStage[] = []
) {
  const customerRecords = customers.filter(
    (customer) => customer.recordType === "customer"
  );
  const opportunityRecords = customers.filter(
    (customer) => customer.recordType === "opportunity"
  );
  const outstandingAmount = customerRecords.reduce(
    (sum, customer) => sum + customer.outstanding,
    0
  );
  const renewalsThisMonth = customerRecords.filter((customer) =>
    isRenewalThisMonth(customer.nextRenewal)
  ).length;

  const customerByStatus: CustomerStatusCount[] = (
    [
      { status: "active", label: "Active", color: "#10b981" },
      { status: "inactive", label: "Inactive", color: "#64748b" },
      { status: "prospect", label: "Prospect", color: "#3b82f6" },
    ] as const
  ).map((item) => ({
    status: item.status,
    label: item.label,
    color: item.color,
    count: customerRecords.filter((customer) => customer.status === item.status)
      .length,
  }));

  const opportunityStages = getStagesForRecordType(stages, "opportunity");
  let opportunityByStage: OpportunityStageCount[] = [];

  if (opportunityStages.length > 0) {
    opportunityByStage = opportunityStages.map((stage) => ({
      stageId: stage.id,
      stageName: stage.name,
      color: stage.color,
      count: opportunityRecords.filter(
        (opportunity) => opportunity.currentStageId === stage.id
      ).length,
    }));

    const knownStageIds = new Set(opportunityStages.map((stage) => stage.id));
    const unstagedCount = opportunityRecords.filter(
      (opportunity) =>
        !opportunity.currentStageId || !knownStageIds.has(opportunity.currentStageId)
    ).length;
    if (unstagedCount > 0) {
      opportunityByStage.push({
        stageId: "__other__",
        stageName: "Other",
        color: "#64748b",
        count: unstagedCount,
      });
    }
  } else if (opportunityRecords.length > 0) {
    const counts = new Map<string, OpportunityStageCount>();
    for (const opportunity of opportunityRecords) {
      const stage = getStageById(stages, opportunity.currentStageId);
      const stageId = opportunity.currentStageId || "__other__";
      const existing = counts.get(stageId);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(stageId, {
          stageId,
          stageName: stage?.name || "Other",
          color: stage?.color || "#64748b",
          count: 1,
        });
      }
    }
    opportunityByStage = Array.from(counts.values());
  }

  return {
    total: customerRecords.length,
    customerByStatus,
    outstandingAmount,
    renewalsThisMonth,
    opportunities: opportunityRecords.length,
    opportunityByStage,
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
