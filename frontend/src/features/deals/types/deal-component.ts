export type BillingType =
  | "one-time"
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly";

export type ComponentStatus = "pending" | "in-progress" | "completed";

export interface DealComponent {
  id: string;
  dealId: string;
  name: string;
  category: string;
  description: string;
  amount: number;
  quantity?: number;
  gstPercent?: number;
  discount?: number;
  billingType: BillingType;
  status: ComponentStatus;
  renewalDate?: string;
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
  renewalApplicable: boolean;
  renewalDate: string;
  status: ComponentStatus;
}
