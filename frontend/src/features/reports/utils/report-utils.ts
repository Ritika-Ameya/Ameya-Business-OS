import type { ReportFilters } from "@/features/reports/types/reports";

import type { Customer } from "@/features/customers/types/customer";
import type { Deal } from "@/features/deals/types/deal";
import {
  computeRegisterStats,
  formatExpenseCurrency,
  getDateRangeForPreset,
} from "@/features/expenses/utils/expense-utils";
import {
  formatInvoiceCurrency,
} from "@/features/revenue/utils/invoice-utils";
import {
  buildCollectionRows,
  filterCompanyRenewals,
  getCompanyRenewals,
  getDaysOverdue,
  type CompanyRenewalRow,
} from "@/features/revenue/utils/revenue-utils";
import type { ExpenseCategoryItem, ExpenseTransaction } from "@/features/expenses/types/expense";
import type { Invoice } from "@/features/revenue/types/invoice";

export const reportQuickDatePresets = [
  "today",
  "this-week",
  "this-month",
  "last-month",
  "this-quarter",
  "this-year",
] as const;

export const reportQuickDateLabels: Record<
  (typeof reportQuickDatePresets)[number],
  string
> = {
  today: "Today",
  "this-week": "This Week",
  "this-month": "This Month",
  "last-month": "Last Month",
  "this-quarter": "This Quarter",
  "this-year": "This Year",
};

export const defaultReportFilters = (): ReportFilters => ({
  datePreset: "this-month",
  dateFrom: "",
  dateTo: "",
  customer: "all",
  deal: "all",
  status: "all",
  category: "all",
  employee: "all",
  vendor: "all",
  search: "",
});

export function getReportDeals(deals: Deal[], invoices: Invoice[] = []) {
  const map = new Map<string, string>();
  for (const deal of deals) {
    map.set(deal.id, deal.title);
  }
  for (const invoice of invoices) {
    map.set(invoice.dealId, invoice.dealTitle);
  }
  return Array.from(map.entries())
    .map(([id, title]) => ({ id, title }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getReportCustomers(
  customers: Customer[],
  invoices: Invoice[] = []
) {
  const map = new Map<string, string>();
  for (const customer of customers) {
    map.set(customer.id, customer.name);
  }
  for (const invoice of invoices) {
    map.set(invoice.customerId, invoice.customerName);
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getDateBounds(filters: ReportFilters) {
  return getDateRangeForPreset(
    filters.datePreset,
    filters.dateFrom,
    filters.dateTo
  );
}

function matchesDate(dateStr: string, filters: ReportFilters): boolean {
  const { from, to } = getDateBounds(filters);
  const date = new Date(dateStr);
  return (!from || date >= from) && (!to || date <= to);
}

function matchesSearch(values: string[], search: string): boolean {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;
  return values.join(" ").toLowerCase().includes(normalized);
}

export function filterInvoicesForReport(
  invoices: Invoice[],
  filters: ReportFilters
): Invoice[] {
  return invoices.filter((invoice) => {
    const matchesDateRange = matchesDate(invoice.invoiceDate, filters);
    const matchesQuery = matchesSearch(
      [invoice.invoiceNo, invoice.customerName, invoice.dealTitle],
      filters.search
    );
    const matchesCustomer =
      filters.customer === "all" || invoice.customerId === filters.customer;
    const matchesDeal =
      filters.deal === "all" || invoice.dealId === filters.deal;
    const matchesStatus =
      filters.status === "all" || invoice.status === filters.status;

    return (
      matchesDateRange &&
      matchesQuery &&
      matchesCustomer &&
      matchesDeal &&
      matchesStatus
    );
  });
}

export function filterExpensesForReport(
  transactions: ExpenseTransaction[],
  filters: ReportFilters,
  categories: ExpenseCategoryItem[]
): ExpenseTransaction[] {
  return transactions.filter((transaction) => {
    const categoryName =
      categories.find((category) => category.id === transaction.categoryId)?.name ??
      "";

    const matchesDateRange = matchesDate(transaction.date, filters);
    const matchesQuery = matchesSearch(
      [
        transaction.name,
        transaction.vendorOrEmployee,
        categoryName,
        transaction.referenceNumber ?? "",
      ],
      filters.search
    );
    const matchesCategory =
      filters.category === "all" || transaction.categoryId === filters.category;
    const matchesStatus =
      filters.status === "all" || transaction.status === filters.status;
    const matchesVendor =
      filters.vendor === "all" ||
      transaction.vendorId === filters.vendor ||
      transaction.vendorOrEmployee === filters.vendor;
    const matchesEmployee =
      filters.employee === "all" ||
      transaction.employeeId === filters.employee ||
      transaction.vendorOrEmployee === filters.employee;

    return (
      matchesDateRange &&
      matchesQuery &&
      matchesCategory &&
      matchesStatus &&
      matchesVendor &&
      matchesEmployee
    );
  });
}

export function filterOutstandingForReport(
  invoices: Invoice[],
  filters: ReportFilters
): Invoice[] {
  return filterInvoicesForReport(
    invoices.filter((invoice) => invoice.outstanding > 0),
    filters
  ).filter((invoice) => {
    if (filters.status === "all") return true;
    if (filters.status === "pending") {
      return invoice.status === "sent" || invoice.status === "partial";
    }
    return invoice.status === filters.status;
  });
}

export function filterRenewalsForReport(
  renewals: CompanyRenewalRow[],
  filters: ReportFilters
): CompanyRenewalRow[] {
  const renewalFilters = {
    customer: filters.customer,
    renewalType: "all" as const,
    date: "all" as const,
    status:
      filters.status === "all"
        ? ("all" as const)
        : (filters.status as "upcoming" | "overdue" | "renewed"),
  };

  const filtered = filterCompanyRenewals(renewals, renewalFilters).filter(
    (renewal) => {
      const matchesDateRange = matchesDate(renewal.renewalDate, filters);
      const matchesQuery = matchesSearch(
        [renewal.customerName, renewal.dealTitle, renewal.renewalLabel],
        filters.search
      );
      const matchesDeal =
        filters.deal === "all" || renewal.dealId === filters.deal;

      return matchesDateRange && matchesQuery && matchesDeal;
    }
  );

  return filtered;
}

export function computeRevenueReportStats(invoices: Invoice[]) {
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const collected = invoices.reduce((sum, invoice) => sum + invoice.received, 0);
  const outstanding = invoices.reduce(
    (sum, invoice) => sum + invoice.outstanding,
    0
  );
  const average =
    invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0;

  return {
    totalRevenue: formatInvoiceCurrency(totalRevenue),
    collected: formatInvoiceCurrency(collected),
    outstanding: formatInvoiceCurrency(outstanding),
    averageInvoiceValue: formatInvoiceCurrency(average),
  };
}

export function computeExpenseReportStats(
  transactions: ExpenseTransaction[],
  recurringCount: number
) {
  const stats = computeRegisterStats(transactions, []);
  return {
    totalExpense: formatExpenseCurrency(stats.totalExpense),
    paid: formatExpenseCurrency(stats.paid),
    pending: formatExpenseCurrency(stats.pending),
    recurringExpenses: String(recurringCount),
  };
}

export function computeOutstandingReportStats(invoices: Invoice[]) {
  const outstandingAmount = invoices.reduce(
    (sum, invoice) => sum + invoice.outstanding,
    0
  );
  const pendingCount = invoices.length;
  const overdueCount = invoices.filter(
    (invoice) => invoice.status === "overdue"
  ).length;
  const average =
    pendingCount > 0 ? Math.round(outstandingAmount / pendingCount) : 0;

  return {
    outstandingAmount: formatInvoiceCurrency(outstandingAmount),
    invoicesPending: String(pendingCount),
    overdueInvoices: String(overdueCount),
    averageOutstanding: formatInvoiceCurrency(average),
  };
}

export function computeRenewalReportStats(
  renewals: CompanyRenewalRow[],
  deals: Deal[] = []
) {
  const upcoming = renewals.filter((renewal) => renewal.status === "upcoming").length;
  const overdue = renewals.filter((renewal) => renewal.status === "overdue").length;
  const renewed = renewals.filter((renewal) => renewal.status === "renewed").length;
  const renewalValue = renewals.reduce((sum, renewal) => {
    const deal = deals.find((item) => item.id === renewal.dealId);
    return sum + (deal?.contractValue ?? 0);
  }, 0);

  return {
    upcomingRenewals: String(upcoming),
    overdueRenewals: String(overdue),
    renewed: String(renewed),
    renewalValue:
      renewalValue > 0 ? formatInvoiceCurrency(renewalValue) : "—",
  };
}

export function getOutstandingRows(invoices: Invoice[]) {
  return buildCollectionRows(invoices, []).map(({ invoice }) => ({
    invoice,
    daysOverdue: getDaysOverdue(invoice.dueDate),
  }));
}

export function getAllRenewals(deals: Deal[]): CompanyRenewalRow[] {
  return getCompanyRenewals(deals);
}
