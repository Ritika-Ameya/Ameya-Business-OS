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
  getEffectiveCustomerStatus,
  getStageById,
  getStagesForRecordType,
} from "@/features/customers/utils/stage-utils";
import type { SettingsStage } from "@/features/settings/types/settings";
import { isRenewalThisMonth, isUpcomingRenewal } from "@/shared/utils/format-date";

export function filterCustomers(
  customers: Customer[],
  query: string,
  filters: CustomerFilters,
  stages: SettingsStage[] = []
): Customer[] {
  const normalizedQuery = query.trim().toLowerCase();

  return customers.filter((customer) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      [
        customer.name,
        customer.company,
        customer.gst ?? "",
        customer.vatId ?? "",
        customer.licenseNo ?? "",
        customer.phone,
        customer.email,
      ].some((field) => field.toLowerCase().includes(normalizedQuery));

    const matchesStatus =
      filters.status === "all" ||
      getEffectiveCustomerStatus(customer, stages) === filters.status;

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

function countRecordsByStage(
  records: Customer[],
  stages: SettingsStage[],
  recordType: "customer" | "opportunity"
): OpportunityStageCount[] {
  const applicable = getStagesForRecordType(stages, recordType);
  if (applicable.length > 0) {
    const counts: OpportunityStageCount[] = applicable.map((stage) => ({
      stageId: stage.id,
      stageName: stage.name,
      color: stage.color,
      count: records.filter((record) => record.currentStageId === stage.id).length,
    }));

    const knownStageIds = new Set(applicable.map((stage) => stage.id));
    const unstagedCount = records.filter(
      (record) =>
        !record.currentStageId || !knownStageIds.has(record.currentStageId)
    ).length;
    if (unstagedCount > 0) {
      counts.push({
        stageId: "__other__",
        stageName: "Other",
        color: "#64748b",
        count: unstagedCount,
      });
    }
    return counts;
  }

  if (records.length === 0) return [];

  const counts = new Map<string, OpportunityStageCount>();
  for (const record of records) {
    const stage = getStageById(stages, record.currentStageId);
    const stageId = record.currentStageId || "__other__";
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
  return Array.from(counts.values());
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

  const customerByStage = countRecordsByStage(customerRecords, stages, "customer");
  const opportunityByStage = countRecordsByStage(
    opportunityRecords,
    stages,
    "opportunity"
  );

  return {
    total: customerRecords.length,
    customerByStage,
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
