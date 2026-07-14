/** Response DTOs for dashboard & reports (numbers only — frontend formats currency). */

export type DatePreset =
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'this-year'
  | 'custom'
  | 'all';

export type RenewalStatus = 'upcoming' | 'overdue' | 'renewed';
export type RenewalType = 'monthly' | 'quarterly' | 'annual';

export interface ReportFilters {
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
  customer: string;
  deal: string;
  status: string;
  category: string;
  employee: string;
  vendor: string;
  search: string;
}

export interface DateRangeBounds {
  from: Date | null;
  to: Date | null;
}

export interface RenewalRow {
  id: string;
  dealId: string;
  customerId: string;
  customerName: string;
  renewalLabel: string;
  dealTitle: string;
  renewalDate: string;
  amount: number;
  status: RenewalStatus;
  renewalType: RenewalType;
}

export interface ReportInvoiceItem {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  dealId: string;
  dealTitle: string;
  amount: number;
  received: number;
  outstanding: number;
  invoiceDate: string;
  dueDate: string;
  status: string;
  gstPercent: number;
  componentIds: string[];
  notes: string;
}

export interface ReportExpenseItem {
  id: string;
  date: string;
  categoryId: string;
  name: string;
  vendorOrEmployee: string;
  payeeType: string;
  vendorId: string;
  employeeId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
  hasAttachment: boolean;
  recurring: boolean;
  masterTemplateId: string;
  generatedPeriod: string;
}

export interface OutstandingReportItem extends ReportInvoiceItem {
  daysOverdue: number;
}

export interface RevenueReportStats {
  totalRevenue: number;
  collected: number;
  outstanding: number;
  averageInvoiceValue: number;
}

export interface ExpenseReportStats {
  totalExpense: number;
  paid: number;
  pending: number;
  recurringExpenses: number;
}

export interface OutstandingReportStats {
  outstandingAmount: number;
  invoicesPending: number;
  overdueInvoices: number;
  averageOutstanding: number;
}

export interface RenewalReportStats {
  upcomingRenewals: number;
  overdueRenewals: number;
  renewed: number;
  renewalValue: number;
}

export interface ReportResult<TStats, TItem> {
  stats: TStats;
  items: TItem[];
}

export interface PendingCollectionRow {
  id: string;
  customer: string;
  outstanding: number;
  dueDate: string;
}

export interface UpcomingRenewalRow {
  id: string;
  customer: string;
  renewal: string;
  dueDate: string;
  amount: number;
}

export interface ChartMonthPoint {
  month: string;
  yearMonth: string;
  revenue: number;
  expense: number;
}

export interface DashboardExpenseStats {
  monthlyExpense: number;
  pendingExpense: number;
  yearlyExpense: number;
}

export interface FollowUpItem {
  id: string;
  entityType: 'customer' | 'deal';
  customerId: string;
  dealId?: string;
  company: string;
  contactPerson: string;
  dealTitle?: string;
  currentStage: string;
  nextActionDate: string;
}

export type ActivityType =
  | 'invoice_generated'
  | 'payment_recorded'
  | 'deal_created'
  | 'expense_added';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardSummary {
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueTrendPct: number;
  outstandingCollections: number;
  pendingInvoiceCount: number;
  upcomingRenewals: number;
  cashPosition: number;
  insight: { message: string };
  pendingCollections: PendingCollectionRow[];
  upcomingRenewalsList: UpcomingRenewalRow[];
  chart: {
    points: ChartMonthPoint[];
    expenseStats: DashboardExpenseStats;
  };
  followUps: {
    today: FollowUpItem[];
    tomorrow: FollowUpItem[];
    overdue: FollowUpItem[];
  };
  activity: ActivityItem[];
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
