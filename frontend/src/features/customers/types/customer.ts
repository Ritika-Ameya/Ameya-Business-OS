export type CustomerStatus = "active" | "inactive" | "prospect";

export type RecordType = "opportunity" | "customer";

export interface CustomerTimelineEntry {
  id: string;
  stageId: string;
  stageName: string;
  notes?: string;
  nextActionDate?: string;
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  gst?: string;
  /** Explicit company flag. Missing means No. Not inferred from country. */
  internationalClient?: boolean;
  vatId?: string;
  licenseNo?: string;
  /** @deprecated Use billingAddress */
  address?: string;
  billingAddress?: string;
  serviceAddress?: string;
  notes?: string;
  status: CustomerStatus;
  recordType: RecordType;
  currentStageId?: string;
  nextActionDate?: string;
  timeline: CustomerTimelineEntry[];
  outstanding: number;
  activeDeals: number;
  /** Earliest date that is a real renewal: a later cycle after one payment. */
  nextRenewal?: string;
  /** Soonest dated component, including a first bill that has not been paid. */
  nextDueDate?: string;
  nextDueKind?: "first" | "renewal";
  nextDueName?: string;
  dueCount?: number;
  businessSince?: string;
  lastPayment?: string;
  businessValue: number;
  createdAt: string;
}

export interface CustomerFormData {
  name: string;
  company: string;
  phone: string;
  email: string;
  gst: string;
  internationalClient: boolean;
  vatId: string;
  licenseNo: string;
  billingAddress: string;
  serviceAddress: string;
  notes: string;
  recordType: RecordType;
}

export type StatusFilter = "all" | CustomerStatus;
export type OutstandingFilter = "all" | "has-outstanding" | "none";
export type RenewalFilter = "all" | "this-month" | "upcoming";
export type ActiveDealsFilter = "all" | "has-deals" | "none";
export type RecordTypeFilter = "all" | RecordType;

export interface CustomerFilters {
  status: StatusFilter;
  outstanding: OutstandingFilter;
  renewal: RenewalFilter;
  activeDeals: ActiveDealsFilter;
  recordType: RecordTypeFilter;
}
