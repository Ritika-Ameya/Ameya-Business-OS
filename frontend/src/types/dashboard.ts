export type DashboardActivityType =
  | "invoice_generated"
  | "payment_recorded"
  | "deal_created"
  | "renewal_completed"
  | "expense_added";

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

export interface RevenueExpensePoint {
  month: string;
  revenue: number;
  expense: number;
}

export interface FounderInsight {
  message: string;
}
