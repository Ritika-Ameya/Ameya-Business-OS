export type DashboardActivityTypeDto =
  | "invoice_generated"
  | "payment_recorded"
  | "deal_created"
  | "expense_added";

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
  renewal: string;
  dueDate: string;
  amount: number;
}

export interface ChartMonthPointDto {
  month: string;
  yearMonth: string;
  revenue: number;
  expense: number;
}

export interface DashboardExpenseStatsDto {
  monthlyExpense: number;
  pendingExpense: number;
  yearlyExpense: number;
}

export interface FollowUpItemDto {
  id: string;
  entityType: "customer" | "deal";
  customerId: string;
  dealId?: string;
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
  cashPosition: number;
  insight: { message: string };
  pendingCollections: PendingCollectionDto[];
  upcomingRenewalsList: UpcomingRenewalDto[];
  chart: {
    points: ChartMonthPointDto[];
    expenseStats: DashboardExpenseStatsDto;
  };
  followUps: {
    today: FollowUpItemDto[];
    tomorrow: FollowUpItemDto[];
    overdue: FollowUpItemDto[];
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
