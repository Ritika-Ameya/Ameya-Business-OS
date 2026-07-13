export type DealStatus = "draft" | "active" | "completed" | "on-hold";

export type DealType = string;

export type RenewalFrequency = "none" | "monthly" | "quarterly" | "annual";

export interface DealTimelineEntry {
  id: string;
  action?: string;
  stageId?: string;
  stageName: string;
  notes?: string;
  nextActionDate?: string;
  timestamp: string;
}

export interface Deal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  status: DealStatus;
  startDate: string;
  nextRenewal?: string;
  currentStageId?: string;
  nextActionDate?: string;
  timeline: DealTimelineEntry[];
  componentsCount: number;
  dealType?: DealType;
  contractValue?: number;
  renewalFrequency?: RenewalFrequency;
  description?: string;
  notes?: string;
  dealNumber?: string;
  currency?: string;
  probability?: number;
  owner?: string;
  expectedCloseDate?: string;
}

export interface DealFormData {
  title: string;
  dealType: DealType | "";
  contractValue: string;
  startDate: string;
  renewalFrequency: RenewalFrequency | "";
  description: string;
}

export type DealStatusFilter = "all" | DealStatus;
export type DealRenewalFilter = "all" | "this-month" | "upcoming" | "none";

export interface DealFilters {
  status: DealStatusFilter;
  renewal: DealRenewalFilter;
}
