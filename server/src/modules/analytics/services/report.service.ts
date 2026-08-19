import { BaseService } from '../../../services/base.service';
import { dealRepository } from '../../deals';
import { expenseRepository } from '../../expenses';
import {
  computeRegisterStats,
  roundMoney,
} from '../../expenses/utils/expenseCalculation.util';
import type { ExpenseEntity } from '../../expenses/types/expense.entities';
import { invoiceRepository } from '../../revenue';
import type { InvoiceEntity } from '../../revenue/types/revenue.entities';
import type {
  ExpenseReportStats,
  OutstandingReportItem,
  OutstandingReportStats,
  RenewalReportStats,
  RenewalRow,
  ReportExpenseItem,
  ReportFilters,
  ReportInvoiceItem,
  ReportResult,
  RevenueReportStats,
} from '../types/analytics.types';
import { getDaysOverdue } from '../utils/collectionAggregation.util';
import { isDateInRange, parseDatePreset } from '../utils/dateRange.util';
import { loadCompanyRenewals } from '../utils/renewalAggregation.util';

const matchesSearch = (values: string[], search: string): boolean => {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;
  return values.join(' ').toLowerCase().includes(normalized);
};

const matchesDateFilter = (dateStr: string, filters: ReportFilters): boolean => {
  const { from, to } = parseDatePreset(filters.datePreset, filters.dateFrom, filters.dateTo);
  return isDateInRange(dateStr, from, to);
};

const mapInvoiceItem = (invoice: InvoiceEntity): ReportInvoiceItem => ({
  id: invoice.id,
  invoiceNo: invoice.invoiceNumber,
  customerId: invoice.customerId,
  customerName: invoice.customerName,
  dealId: invoice.dealId,
  dealTitle: invoice.dealTitle,
  amount: Number(invoice.total || 0),
  received: Number(invoice.received || 0),
  outstanding: Number(invoice.outstanding || 0),
  invoiceDate: invoice.issueDate,
  dueDate: invoice.dueDate,
  status: invoice.status,
  gstPercent: Number(invoice.taxPercent || 0),
  componentIds: invoice.componentIds ?? [],
  notes: invoice.notes ?? '',
});

const mapExpenseItem = (expense: ExpenseEntity): ReportExpenseItem => ({
  id: expense.id,
  date: expense.expenseDate,
  categoryId: expense.categoryId,
  name: expense.name,
  vendorOrEmployee: expense.vendorOrEmployee,
  payeeType: expense.payeeType,
  vendorId: expense.vendorId,
  employeeId: expense.employeeId,
  amount: Number(expense.amount || 0),
  status: expense.status,
  paymentMethod: expense.paymentMethod,
  referenceNumber: expense.referenceNumber,
  notes: expense.notes,
  hasAttachment: Boolean(expense.hasAttachment),
  recurring: Boolean(expense.recurring),
  masterTemplateId: expense.masterTemplateId,
  generatedPeriod: expense.generatedPeriod,
});

/** Port of frontend `filterInvoicesForReport`. */
export const filterInvoicesForReport = (
  invoices: InvoiceEntity[],
  filters: ReportFilters,
): InvoiceEntity[] =>
  invoices.filter((invoice) => {
    const matchesDateRange = matchesDateFilter(invoice.issueDate, filters);
    const matchesQuery = matchesSearch(
      [invoice.invoiceNumber, invoice.customerName, invoice.dealTitle],
      filters.search,
    );
    const matchesCustomer =
      filters.customer === 'all' || invoice.customerId === filters.customer;
    const matchesDeal = filters.deal === 'all' || invoice.dealId === filters.deal;
    const matchesStatus =
      filters.status === 'all' || invoice.status === filters.status;

    return (
      matchesDateRange &&
      matchesQuery &&
      matchesCustomer &&
      matchesDeal &&
      matchesStatus
    );
  });

/** Port of frontend `filterExpensesForReport`. */
export const filterExpensesForReport = (
  expenses: ExpenseEntity[],
  filters: ReportFilters,
): ExpenseEntity[] =>
  expenses.filter((expense) => {
    const matchesDateRange = matchesDateFilter(expense.expenseDate, filters);
    const matchesQuery = matchesSearch(
      [
        expense.name,
        expense.vendorOrEmployee,
        expense.categoryName ?? '',
        expense.referenceNumber ?? '',
      ],
      filters.search,
    );
    const matchesCategory =
      filters.category === 'all' || expense.categoryId === filters.category;
    const matchesStatus =
      filters.status === 'all' || expense.status === filters.status;
    const matchesVendor =
      filters.vendor === 'all' ||
      expense.vendorId === filters.vendor ||
      expense.vendorOrEmployee === filters.vendor;
    const matchesEmployee =
      filters.employee === 'all' ||
      expense.employeeId === filters.employee ||
      expense.vendorOrEmployee === filters.employee;

    return (
      matchesDateRange &&
      matchesQuery &&
      matchesCategory &&
      matchesStatus &&
      matchesVendor &&
      matchesEmployee
    );
  });

/** Port of frontend `filterOutstandingForReport` (pending bypasses invoice status equality). */
export const filterOutstandingForReport = (
  invoices: InvoiceEntity[],
  filters: ReportFilters,
): InvoiceEntity[] => {
  // When status is "pending", apply sent|partial after base filters (frontend second pass).
  const baseFilters: ReportFilters =
    filters.status === 'pending' ? { ...filters, status: 'all' } : filters;

  return filterInvoicesForReport(
    invoices.filter((invoice) => invoice.outstanding > 0),
    baseFilters,
  ).filter((invoice) => {
    if (filters.status === 'all') return true;
    if (filters.status === 'pending') {
      return (
        invoice.status === 'due' ||
        invoice.status === 'partially_paid' ||
        (invoice.status as string) === 'sent' ||
        (invoice.status as string) === 'partial'
      );
    }
    if (filters.status === 'due') {
      return invoice.status === 'due' || (invoice.status as string) === 'sent' || (invoice.status as string) === 'overdue';
    }
    if (filters.status === 'partially_paid') {
      return invoice.status === 'partially_paid' || (invoice.status as string) === 'partial';
    }
    return invoice.status === filters.status;
  });
};
/** Port of frontend `filterRenewalsForReport` (+ filterCompanyRenewals status/customer). */
export const filterRenewalsForReport = (
  renewals: RenewalRow[],
  filters: ReportFilters,
): RenewalRow[] =>
  renewals.filter((renewal) => {
    const matchesCustomer =
      filters.customer === 'all' || renewal.customerId === filters.customer;
    const matchesStatus =
      filters.status === 'all' ||
      renewal.status === filters.status ||
      (filters.status === 'expired' && renewal.status === 'overdue') ||
      (filters.status === 'upcoming' &&
        (renewal.status === 'upcoming' || renewal.status === 'renewed'));
    const matchesDateRange = matchesDateFilter(renewal.renewalDate, filters);
    const matchesQuery = matchesSearch(
      [
        renewal.customerName,
        renewal.dealTitle,
        renewal.renewalLabel,
        renewal.componentName,
        renewal.renewalDate,
      ],
      filters.search,
    );
    const matchesDeal = filters.deal === 'all' || renewal.dealId === filters.deal;
    return matchesCustomer && matchesStatus && matchesDateRange && matchesQuery && matchesDeal;
  });

export class ReportService extends BaseService {
  constructor() {
    super('ReportService');
  }

  async getRevenueReport(
    filters: ReportFilters,
  ): Promise<ReportResult<RevenueReportStats, ReportInvoiceItem>> {
    this.logInfo('Building revenue report');
    const invoices = await invoiceRepository.findAll();
    const filtered = filterInvoicesForReport(invoices, filters);

    const totalRevenue = roundMoney(
      filtered.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    );
    const collected = roundMoney(
      filtered.reduce((sum, invoice) => sum + Number(invoice.received || 0), 0),
    );
    const outstanding = roundMoney(
      filtered.reduce((sum, invoice) => sum + Number(invoice.outstanding || 0), 0),
    );
    const averageInvoiceValue =
      filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0;

    return {
      stats: {
        totalRevenue,
        collected,
        outstanding,
        averageInvoiceValue,
      },
      items: filtered.map(mapInvoiceItem),
    };
  }

  async getExpenseReport(
    filters: ReportFilters,
  ): Promise<ReportResult<ExpenseReportStats, ReportExpenseItem>> {
    this.logInfo('Building expense report');
    const expenses = await expenseRepository.findAll();
    const filtered = filterExpensesForReport(expenses, filters);
    const registerStats = computeRegisterStats(filtered, []);
    const recurringExpenses = filtered.filter((expense) => expense.recurring).length;

    return {
      stats: {
        totalExpense: registerStats.totalExpense,
        paid: registerStats.paid,
        pending: registerStats.pending,
        recurringExpenses,
      },
      items: filtered.map(mapExpenseItem),
    };
  }

  async getOutstandingReport(
    filters: ReportFilters,
  ): Promise<ReportResult<OutstandingReportStats, OutstandingReportItem>> {
    this.logInfo('Building outstanding report');
    const invoices = await invoiceRepository.findAll();
    const filtered = filterOutstandingForReport(invoices, filters);

    const outstandingAmount = roundMoney(
      filtered.reduce((sum, invoice) => sum + Number(invoice.outstanding || 0), 0),
    );
    const invoicesPending = filtered.length;
    const overdueInvoices = filtered.filter((invoice) => {
      if (!invoice.dueDate || Number(invoice.outstanding || 0) <= 0) return false;
      if ((invoice.status as string) === 'overdue') return true;
      const due = new Date(invoice.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      return due < today;
    }).length;
    const averageOutstanding =
      invoicesPending > 0 ? Math.round(outstandingAmount / invoicesPending) : 0;

    return {
      stats: {
        outstandingAmount,
        invoicesPending,
        overdueInvoices,
        averageOutstanding,
      },
      items: filtered.map((invoice) => ({
        ...mapInvoiceItem(invoice),
        daysOverdue: getDaysOverdue(invoice.dueDate),
      })),
    };
  }

  async getRenewalReport(
    filters: ReportFilters,
  ): Promise<ReportResult<RenewalReportStats, RenewalRow>> {
    this.logInfo('Building renewal report');
    const deals = await dealRepository.findAll();
    const renewals = filterRenewalsForReport(await loadCompanyRenewals(deals), filters);

    const upcomingRenewals = renewals.filter(
      (r) => r.status === 'upcoming' || r.status === 'renewed',
    ).length;
    const overdueRenewals = renewals.filter((r) => r.status === 'overdue').length;
    const renewed = renewals.filter((r) => r.status === 'renewed').length;
    const renewalValue = roundMoney(
      renewals.reduce((sum, renewal) => sum + Number(renewal.amount || 0), 0),
    );

    return {
      stats: {
        upcomingRenewals,
        overdueRenewals,
        renewed,
        renewalValue,
      },
      items: renewals,
    };
  }
}

export const reportService = new ReportService();
