export type CustomerStatus = "active" | "inactive" | "prospect";

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  gst?: string;
  address?: string;
  notes?: string;
  status: CustomerStatus;
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
  address: string;
  notes: string;
}

export type StatusFilter = "all" | CustomerStatus;
export type OutstandingFilter = "all" | "has-outstanding" | "none";
export type RenewalFilter = "all" | "this-month" | "upcoming";
export type ActiveDealsFilter = "all" | "has-deals" | "none";

export interface CustomerFilters {
  status: StatusFilter;
  outstanding: OutstandingFilter;
  renewal: RenewalFilter;
  activeDeals: ActiveDealsFilter;
}
