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
  nextRenewal?: string;
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
