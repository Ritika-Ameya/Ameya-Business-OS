export interface ReportInvoiceItemDto {
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

export interface ReportExpenseItemDto {
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

export interface OutstandingReportItemDto extends ReportInvoiceItemDto {
  daysOverdue: number;
}

export interface RenewalReportItemDto {
  id: string;
  dealId: string;
  customerId: string;
  customerName: string;
  renewalLabel: string;
  dealTitle: string;
  renewalDate: string;
  amount: number;
  status: "upcoming" | "overdue" | "renewed";
  renewalType: "monthly" | "quarterly" | "annual";
}

export interface RevenueReportStatsDto {
  totalRevenue: number;
  collected: number;
  outstanding: number;
  averageInvoiceValue: number;
}

export interface ExpenseReportStatsDto {
  totalExpense: number;
  paid: number;
  pending: number;
  recurringExpenses: number;
}

export interface OutstandingReportStatsDto {
  outstandingAmount: number;
  invoicesPending: number;
  overdueInvoices: number;
  averageOutstanding: number;
}

export interface RenewalReportStatsDto {
  upcomingRenewals: number;
  overdueRenewals: number;
  renewed: number;
  renewalValue: number;
}

export interface ReportResultDto<TStats, TItem> {
  stats: TStats;
  items: TItem[];
}
