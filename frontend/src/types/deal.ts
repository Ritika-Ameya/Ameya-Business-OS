export type DealStatus = "draft" | "active" | "completed" | "on-hold";

export interface Deal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  status: DealStatus;
  startDate: string;
  nextRenewal?: string;
  componentsCount: number;
}

export type DealStatusFilter = "all" | DealStatus;
export type DealRenewalFilter = "all" | "this-month" | "upcoming" | "none";

export interface DealFilters {
  status: DealStatusFilter;
  renewal: DealRenewalFilter;
}
