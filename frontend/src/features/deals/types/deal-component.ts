export type BillingType =
  | "one-time"
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly";

export type ComponentStatus = "pending" | "in-progress" | "completed";

export type ComponentRenewalFrequency =
  | "none"
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly"
  | "biennial"
  | "custom";

export interface DealComponent {
  id: string;
  dealId: string;
  name: string;
  category: string;
  description: string;
  amount: number;
  gstPercent: number;
  quantity: number;
  discount: number;
  billingType: BillingType;
  status: ComponentStatus;
  renewalFrequency: ComponentRenewalFrequency;
  renewalStartDate?: string;
  renewalDate?: string;
  lastRenewedDate?: string;
}

export interface ComponentFormData {
  name: string;
  category: string;
  description: string;
  amount: string;
  gstPercent: string;
  quantity: string;
  discount: string;
  billingType: BillingType;
  renewalFrequency: ComponentRenewalFrequency | "";
  renewalStartDate: string;
  renewalDate: string;
  status: ComponentStatus;
}
