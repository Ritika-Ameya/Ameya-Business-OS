import type {
  OutstandingReportItemDto,
  RenewalReportItemDto,
  ReportExpenseItemDto,
  ReportInvoiceItemDto,
} from "@/features/reports/api/reports.dto";
import type {
  ExpenseTransaction,
  ExpenseTransactionStatus,
  PayeeType,
} from "@/features/expenses/types/expense";
import type { Invoice, InvoiceStatus } from "@/features/revenue/types/invoice";
import { formatInvoiceCurrency } from "@/features/revenue/utils/invoice-utils";
import type { CompanyRenewalRow } from "@/features/revenue/utils/revenue-utils";
import { formatExpenseCurrency } from "@/features/expenses/utils/expense-utils";

export function mapReportInvoice(dto: ReportInvoiceItemDto): Invoice {
  return {
    id: dto.id,
    invoiceNo: dto.invoiceNo,
    customerId: dto.customerId,
    customerName: dto.customerName,
    dealId: dto.dealId,
    dealTitle: dto.dealTitle,
    amount: dto.amount,
    received: dto.received,
    outstanding: dto.outstanding,
    invoiceDate: dto.invoiceDate,
    dueDate: dto.dueDate,
    status: dto.status as InvoiceStatus,
    gstPercent: dto.gstPercent,
    componentIds: dto.componentIds ?? [],
    notes: dto.notes || undefined,
  };
}

export function mapReportExpense(dto: ReportExpenseItemDto): ExpenseTransaction {
  return {
    id: dto.id,
    date: dto.date,
    categoryId: dto.categoryId,
    name: dto.name,
    vendorOrEmployee: dto.vendorOrEmployee,
    payeeType: (dto.payeeType || "vendor") as PayeeType,
    vendorId: dto.vendorId || undefined,
    employeeId: dto.employeeId || undefined,
    amount: dto.amount,
    status: dto.status as ExpenseTransactionStatus,
    paymentMethod: dto.paymentMethod || undefined,
    referenceNumber: dto.referenceNumber || undefined,
    notes: dto.notes || undefined,
    hasAttachment: Boolean(dto.hasAttachment),
    recurring: Boolean(dto.recurring),
    masterTemplateId: dto.masterTemplateId || undefined,
    generatedPeriod: dto.generatedPeriod || undefined,
  };
}

export function mapOutstandingRow(dto: OutstandingReportItemDto): {
  invoice: Invoice;
  daysOverdue: number;
} {
  return {
    invoice: mapReportInvoice(dto),
    daysOverdue: dto.daysOverdue,
  };
}

export function mapReportRenewal(dto: RenewalReportItemDto): CompanyRenewalRow {
  return {
    id: dto.id,
    dealId: dto.dealId,
    customerId: dto.customerId,
    customerName: dto.customerName,
    renewalLabel: dto.renewalLabel,
    dealTitle: dto.dealTitle,
    renewalDate: dto.renewalDate,
    amount: dto.amount > 0 ? formatInvoiceCurrency(dto.amount) : "—",
    status: dto.status,
    renewalType: dto.renewalType,
  };
}

export function formatRevenueReportStats(stats: {
  totalRevenue: number;
  collected: number;
  outstanding: number;
  averageInvoiceValue: number;
}) {
  return {
    totalRevenue: formatInvoiceCurrency(stats.totalRevenue),
    collected: formatInvoiceCurrency(stats.collected),
    outstanding: formatInvoiceCurrency(stats.outstanding),
    averageInvoiceValue: formatInvoiceCurrency(stats.averageInvoiceValue),
  };
}

export function formatExpenseReportStats(stats: {
  totalExpense: number;
  paid: number;
  pending: number;
  recurringExpenses: number;
}) {
  return {
    totalExpense: formatExpenseCurrency(stats.totalExpense),
    paid: formatExpenseCurrency(stats.paid),
    pending: formatExpenseCurrency(stats.pending),
    recurringExpenses: String(stats.recurringExpenses),
  };
}

export function formatOutstandingReportStats(stats: {
  outstandingAmount: number;
  invoicesPending: number;
  overdueInvoices: number;
  averageOutstanding: number;
}) {
  return {
    outstandingAmount: formatInvoiceCurrency(stats.outstandingAmount),
    invoicesPending: String(stats.invoicesPending),
    overdueInvoices: String(stats.overdueInvoices),
    averageOutstanding: formatInvoiceCurrency(stats.averageOutstanding),
  };
}

export function formatRenewalReportStats(stats: {
  upcomingRenewals: number;
  overdueRenewals: number;
  renewed: number;
  renewalValue: number;
}) {
  return {
    upcomingRenewals: String(stats.upcomingRenewals),
    overdueRenewals: String(stats.overdueRenewals),
    renewed: String(stats.renewed),
    renewalValue:
      stats.renewalValue > 0 ? formatInvoiceCurrency(stats.renewalValue) : "—",
  };
}
