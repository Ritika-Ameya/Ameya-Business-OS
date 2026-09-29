export type DashboardActivityTypeDto =
  | "customer_created"
  | "opportunity_created"
  | "invoice_generated"
  | "payment_received"
  | "renewal_added"
  | "customer_updated"
  | "entity_deleted";

export interface DashboardActivityDto {
  id: string;
  type: DashboardActivityTypeDto;
  title: string;
  description: string;
  timestamp: string;
}

export interface PendingCollectionDto {
  id: string;
  customer: string;
  outstanding: number;
  dueDate: string;
}

export interface UpcomingRenewalDto {
  id: string;
  customer: string;
  deal: string;
  renewal: string;
  dueDate: string;
  amount: number;
}

export interface RenewedCustomerDto {
  id: string;
  customer: string;
  deal: string;
  component: string;
  lastRenewedDate: string;
  amount: number;
}

export interface RevenueMonthItemDto {
  id: string;
  customer: string;
  invoiceNumber: string;
  received: number;
  issueDate: string;
}

export interface UpcomingRevenueItemDto {
  id: string;
  customer: string;
  invoiceNumber: string;
  dueDate: string;
  amount: number;
  status: string;
}

export interface ChartMonthPointDto {
  month: string;
  yearMonth: string;
  /** Legacy: collected on invoices issued in the month. */
  revenue: number;
  /** Payments received in the month, by payment date. */
  received?: number;
  /** Invoice totals raised in the month, by issue date. */
  invoiced?: number;
  expense: number;
}

export interface MoneyMonthItemDto {
  id: string;
  customerId: string;
  company: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  date: string;
}

export interface DashboardMoneyFlowDto {
  thisMonth: number;
  lastMonth: number;
  trendPct: number;
  items: MoneyMonthItemDto[];
}

export interface DashboardRenewalItemDto {
  id: string;
  customerId: string;
  company: string;
  contactPerson: string;
  dealId: string;
  deal: string;
  renewal: string;
  frequency: string;
  dueDate: string;
  amount: number;
}

export interface DashboardExpenseStatsDto {
  monthlyExpense: number;
  pendingExpense: number;
  yearlyExpense: number;
}

export interface FollowUpItemDto {
  id: string;
  entityType: "customer" | "deal" | "invoice";
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

export interface DashboardSummaryDto {
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueTrendPct: number;
  outstandingCollections: number;
  pendingInvoiceCount: number;
  upcomingRenewals: number;
  renewedCustomersThisQuarter: number;
  cashPosition: number;
  insight: { message: string; period?: string };
  pendingCollections: PendingCollectionDto[];
  upcomingRenewalsList: UpcomingRenewalDto[];
  renewedCustomersList: RenewedCustomerDto[];
  revenueThisMonthItems: RevenueMonthItemDto[];
  received?: DashboardMoneyFlowDto;
  invoiced?: DashboardMoneyFlowDto;
  renewalsAll?: DashboardRenewalItemDto[];
  upcomingRevenue: {
    items: UpcomingRevenueItemDto[];
    totalExpectedRevenue: number;
  };
  chart: {
    points: ChartMonthPointDto[];
    expenseStats: DashboardExpenseStatsDto;
  };
  followUps: {
    today: FollowUpItemDto[];
    tomorrow: FollowUpItemDto[];
    overdue: FollowUpItemDto[];
    upcoming: FollowUpItemDto[];
  };
  activity: DashboardActivityDto[];
  pipeline: {
    totalValue: number;
    byStatus: Record<string, number>;
    openDeals: number;
  };
  customerAnalytics: {
    totalCustomers: number;
    activeCustomers: number;
    withNextAction: number;
  };
  dealAnalytics: {
    totalDeals: number;
    byStatus: Record<string, number>;
    pipelineValue: number;
    averageDealSize: number;
  };
  opportunityFunnel: Record<string, number>;
}
