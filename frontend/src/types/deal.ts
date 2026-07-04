export type DealStatus = "draft" | "active" | "completed" | "on-hold";

export type DealType = string;

export type RenewalFrequency = "none" | "monthly" | "quarterly" | "annual";

export interface Deal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  status: DealStatus;
  startDate: string;
  nextRenewal?: string;
  componentsCount: number;
  dealType?: DealType;
  contractValue?: number;
  renewalFrequency?: RenewalFrequency;
  description?: string;
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
