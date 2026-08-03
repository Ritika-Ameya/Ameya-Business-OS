export type DashboardActivityType =
  | "customer_created"
  | "opportunity_created"
  | "invoice_generated"
  | "payment_received"
  | "renewal_added"
  | "customer_updated"
  | "entity_deleted";

export interface DashboardActivity {
  id: string;
  type: DashboardActivityType;
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down" | "neutral";
  href?: string;
  tab?: string;
}

export interface FounderInsight {
  message: string;
}

export type FollowUpEntityType = "customer" | "deal" | "invoice";

export interface FollowUpItem {
  id: string;
  entityType: FollowUpEntityType;
  customerId: string;
  dealId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  recordType?: "opportunity" | "customer";
  company: string;
  contactPerson: string;
  dealTitle?: string;
  currentStage: string;
  nextActionDate: string;
}

export interface UpcomingRevenueItem {
  id: string;
  customer: string;
  invoiceNumber: string;
  dueDate: string;
  amount: string;
  status: string;
}
