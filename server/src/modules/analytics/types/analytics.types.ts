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
export type RenewalType =
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'yearly'
  | 'biennial'
  | 'custom'
  | 'annual';

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
  componentId: string;
  componentName: string;
  customerId: string;
  customerName: string;
  renewalLabel: string;
  dealTitle: string;
  renewalStartDate: string;
  renewalDate: string;
  lastRenewedDate?: string;
  /** Base amount before GST; GST is only charged if the invoice is raised with GST. */
  amount: number;
  gstAmount: number;
  status: RenewalStatus;
  renewalType: RenewalType;
  renewalFrequency: string;
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
  billingType: 'gst' | 'non_gst';
  subtotal: number;
  tax: number;
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
  /** Received payments by the account the money landed in. */
  receivedGstAccount: number;
  receivedOtherAccount: number;
  /** GST charged on GST invoices; not income, it is owed to the government. */
  gstBilled: number;
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
  deal: string;
  renewal: string;
  dueDate: string;
  amount: number;
  gstAmount: number;
}

export interface RenewedCustomerRow {
  id: string;
  customer: string;
  deal: string;
  component: string;
  lastRenewedDate: string;
  amount: number;
}

export interface RevenueMonthItem {
  id: string;
  customer: string;
  invoiceNumber: string;
  received: number;
  issueDate: string;
}

export interface ChartMonthPoint {
  month: string;
  yearMonth: string;
  /** Legacy: amount collected on invoices issued in the month. */
  revenue: number;
  /** Payments received in the month, by payment date. */
  received: number;
  /** Invoices raised in the month (total with GST), by issue date. */
  invoiced: number;
  expense: number;
}

export interface MoneyMonthItem {
  id: string;
  customerId: string;
  company: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  date: string;
}

export interface DashboardMoneyFlow {
  thisMonth: number;
  lastMonth: number;
  trendPct: number;
  items: MoneyMonthItem[];
}

export interface DashboardRenewalItem {
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
  gstAmount: number;
}

export interface DashboardExpenseStats {
  monthlyExpense: number;
  pendingExpense: number;
  yearlyExpense: number;
}

export interface FollowUpItem {
  id: string;
  entityType: 'customer' | 'deal' | 'invoice';
  customerId: string;
  dealId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  /** Present when entityType is customer — distinguishes opportunity vs customer. */
  recordType?: 'opportunity' | 'customer';
  company: string;
  contactPerson: string;
  dealTitle?: string;
  currentStage: string;
  nextActionDate: string;
}

export type ActivityType =
  | 'customer_created'
  | 'opportunity_created'
  | 'invoice_generated'
  | 'payment_received'
  | 'renewal_added'
  | 'customer_updated'
  | 'entity_deleted';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
}

export interface UpcomingRevenueRow {
  id: string;
  customer: string;
  invoiceNumber: string;
  dueDate: string;
  amount: number;
  status: string;
}

export interface DashboardSummary {
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueTrendPct: number;
  outstandingCollections: number;
  pendingInvoiceCount: number;
  upcomingRenewals: number;
  renewedCustomersThisQuarter: number;
  cashPosition: number;
  insight: { message: string; period: string };
  pendingCollections: PendingCollectionRow[];
  upcomingRenewalsList: UpcomingRenewalRow[];
  renewedCustomersList: RenewedCustomerRow[];
  revenueThisMonthItems: RevenueMonthItem[];
  received: DashboardMoneyFlow;
  invoiced: DashboardMoneyFlow;
  /** Current unpaid cycle of every renewing plan, overdue ones included. */
  renewalsAll: DashboardRenewalItem[];
  upcomingRevenue: {
    items: UpcomingRevenueRow[];
    totalExpectedRevenue: number;
  };
  chart: {
    points: ChartMonthPoint[];
    expenseStats: DashboardExpenseStats;
  };
  followUps: {
    today: FollowUpItem[];
    tomorrow: FollowUpItem[];
    overdue: FollowUpItem[];
    upcoming: FollowUpItem[];
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
