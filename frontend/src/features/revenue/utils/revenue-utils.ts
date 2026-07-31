import { formatInvoiceCurrency, getUniqueCustomers } from "@/features/revenue/utils/invoice-utils";
import type { Deal, RenewalFrequency } from "@/features/deals/types/deal";
import type { Invoice } from "@/features/revenue/types/invoice";
import type { Payment } from "@/features/revenue/types/payment";
import type {
  CollectionFilters,
  CollectionStatusFilter,
  RenewalFilters,
  RenewalStatusFilter,
} from "@/features/revenue/types/revenue";
import {
  getCurrentQuarterIndex,
  getRenewalDateRange,
  isDateInRenewalRange,
  isRenewalInMonth,
  isRenewalInQuarter,
} from "@/features/revenue/utils/renewal-date-utils";

export type CompanyRenewalStatus = "upcoming" | "expired" | "renewed";

export interface CollectionRow {
  invoice: Invoice;
  payments: Payment[];
  invoiceAmount: number;
  collectedAmount: number;
  balanceAmount: number;
  paymentModes: string[];
  paymentDates: string[];
}

export interface CompanyRenewalRow {
  id: string;
  dealId: string;
  customerId: string;
  customerName: string;
  renewalLabel: string;
  dealTitle: string;
  renewalDate: string;
  amount: string;
  amountValue: number;
  status: CompanyRenewalStatus;
  renewalType: "annual" | "quarterly" | "monthly";
  /** True when the deal timeline recorded at least one renewal update. */
  wasRenewed: boolean;
}

export const defaultCollectionFilters: CollectionFilters = {
  customer: "all",
  status: "all",
  date: "all",
};

export const defaultRenewalFilters: RenewalFilters = {
  customer: "all",
  renewalType: "all",
  date: "all",
  status: "all",
  customFrom: "",
  customTo: "",
  selectedMonth: "",
  selectedQuarter: "",
};

export const collectionStatusLabels: Record<CollectionStatusFilter, string> = {
  all: "All Status",
  partially_paid: "Partially Paid",
  due: "Due",
  pending: "Pending",
};

export const renewalTypeLabels: Record<RenewalFilters["renewalType"], string> = {
  all: "All Types",
  annual: "Annual",
  quarterly: "Quarterly",
  monthly: "Monthly",
};

export const renewalStatusLabels: Record<string, string> = {
  all: "All Status",
  upcoming: "Upcoming",
  expired: "Expired",
  overdue: "Expired",
  renewed: "Renewed",
};

export const companyRenewalStatusStyles: Record<string, string> = {
  upcoming: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  expired: "bg-red-500/10 text-red-700 dark:text-red-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
  renewed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export function getCollectionInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter(
    (invoice) =>
      invoice.status !== "cancelled" &&
      invoice.status !== "draft" &&
      invoice.status !== "paid" &&
      (invoice.outstanding > 0 ||
        invoice.status === "partially_paid" ||
        invoice.status === "due")
  );
}

export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function getInvoicePayments(
  invoiceId: string,
  payments: Payment[]
): Payment[] {
  return payments
    .filter((payment) => payment.invoiceId === invoiceId)
    .sort(
      (a, b) =>
        new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
    );
}

export function buildCollectionRows(
  invoices: Invoice[],
  payments: Payment[]
): CollectionRow[] {
  return invoices.map((invoice) => {
    const invoicePayments = getInvoicePayments(invoice.id, payments);
    const collectedAmount =
      invoicePayments.length > 0
        ? invoicePayments.reduce((sum, payment) => sum + payment.amount, 0)
        : invoice.received;

    return {
      invoice,
      payments: invoicePayments,
      invoiceAmount: invoice.amount,
      collectedAmount,
      balanceAmount: invoice.outstanding,
      paymentModes: invoicePayments.map((payment) => payment.mode || "—"),
      paymentDates: invoicePayments.map((payment) => payment.paymentDate),
    };
  });
}

export function filterCollectionRows(
  rows: CollectionRow[],
  filters: CollectionFilters
): CollectionRow[] {
  const now = new Date();

  return rows.filter(({ invoice }) => {
    const matchesCustomer =
      filters.customer === "all" || invoice.customerId === filters.customer;

    const matchesStatus =
      filters.status === "all" ||
      invoice.status === filters.status ||
      (filters.status === "pending" &&
        (invoice.status === "due" || invoice.status === "partially_paid"));

    const invoiceDate = new Date(invoice.invoiceDate);
    const due = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const isPastDue =
      Boolean(invoice.dueDate) && due < today && invoice.outstanding > 0;

    const matchesDate =
      filters.date === "all" ||
      (filters.date === "this-month" &&
        invoiceDate.getMonth() === now.getMonth() &&
        invoiceDate.getFullYear() === now.getFullYear()) ||
      (filters.date === "last-month" &&
        invoiceDate.getMonth() === (now.getMonth() + 11) % 12) ||
      (filters.date === "overdue" && isPastDue);

    return matchesCustomer && matchesStatus && matchesDate;
  });
}

export function getCollectionStats(invoices: Invoice[], payments: Payment[]) {
  const collectionInvoices = getCollectionInvoices(invoices);
  const outstandingAmount = collectionInvoices.reduce(
    (sum, invoice) => sum + invoice.outstanding,
    0
  );
  const pendingCount = collectionInvoices.filter((i) => i.outstanding > 0).length;
  const overdueCount = collectionInvoices.filter((invoice) => {
    const due = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Boolean(invoice.dueDate) && due < today && invoice.outstanding > 0;
  }).length;

  const now = new Date();
  const collectedThisMonth = payments
    .filter((payment) => {
      const date = new Date(payment.paymentDate);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, payment) => sum + payment.amount, 0);

  return {
    outstandingAmount: formatInvoiceCurrency(outstandingAmount),
    pendingCount: String(pendingCount),
    overdueCount: String(overdueCount),
    collectedThisMonth: formatInvoiceCurrency(collectedThisMonth),
  };
}

function mapRenewalType(frequency?: RenewalFrequency): CompanyRenewalRow["renewalType"] {
  switch (frequency) {
    case "monthly":
      return "monthly";
    case "quarterly":
      return "quarterly";
    default:
      return "annual";
  }
}

function dealWasRenewed(deal: Deal): boolean {
  return (deal.timeline ?? []).some((entry) => entry.action === "renewal_updated");
}

export function getCompanyRenewals(deals: Deal[] = []): CompanyRenewalRow[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return deals
    .filter((deal) => deal.nextRenewal && deal.renewalFrequency !== "none")
    .map((deal) => {
      const renewalDate = new Date(deal.nextRenewal!);
      renewalDate.setHours(0, 0, 0, 0);
      const wasRenewed = dealWasRenewed(deal);
      const isExpired = renewalDate < now;
      const status: CompanyRenewalStatus = isExpired
        ? "expired"
        : wasRenewed
          ? "renewed"
          : "upcoming";

      const amountValue = Number(deal.contractValue || 0);

      return {
        id: `renewal-${deal.id}`,
        dealId: deal.id,
        customerId: deal.customerId,
        customerName: deal.customerName,
        renewalLabel: `${deal.title} Renewal`,
        dealTitle: deal.title,
        renewalDate: deal.nextRenewal!,
        amount: amountValue ? formatInvoiceCurrency(amountValue) : "—",
        amountValue,
        status,
        renewalType: mapRenewalType(deal.renewalFrequency),
        wasRenewed,
      };
    })
    .sort(
      (a, b) =>
        new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
    );
}

/** Customer + type only — used as the base for period cards. */
export function filterRenewalsByScope(
  renewals: CompanyRenewalRow[],
  filters: Pick<RenewalFilters, "customer" | "renewalType">
): CompanyRenewalRow[] {
  return renewals.filter((renewal) => {
    const matchesCustomer =
      filters.customer === "all" || renewal.customerId === filters.customer;
    const matchesType =
      filters.renewalType === "all" || renewal.renewalType === filters.renewalType;
    return matchesCustomer && matchesType;
  });
}

export function filterCompanyRenewals(
  renewals: CompanyRenewalRow[],
  filters: RenewalFilters
): CompanyRenewalRow[] {
  const scoped = filterRenewalsByScope(renewals, filters);
  const { from, to } = getRenewalDateRange(filters);

  return scoped.filter((renewal) => {
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "upcoming" &&
        (renewal.status === "upcoming" || renewal.status === "renewed")) ||
      (filters.status === "expired" && renewal.status === "expired") ||
      (filters.status === "renewed" && renewal.wasRenewed);

    const matchesDate = isDateInRenewalRange(renewal.renewalDate, from, to);

    return matchesStatus && matchesDate;
  });
}

export interface RenewalPeriodStats {
  upcomingThisMonth: string;
  nextMonth: string;
  quarter: string;
  nextQuarter: string;
  expired: string;
  renewed: string;
}

/** Period cards from scoped renewals (customer/type), independent of date/status filters. */
export function getRenewalStats(renewals: CompanyRenewalRow[]): RenewalPeriodStats {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarter = getCurrentQuarterIndex(now);
  const nextMonthDate = new Date(year, month + 1, 1);
  const nextQuarterDate = new Date(year, quarter * 3 + 3, 1);

  const upcoming = renewals.filter((r) => r.status === "upcoming" || r.status === "renewed");
  const upcomingThisMonth = upcoming.filter((r) =>
    isRenewalInMonth(r.renewalDate, year, month)
  ).length;
  const nextMonth = upcoming.filter((r) =>
    isRenewalInMonth(r.renewalDate, nextMonthDate.getFullYear(), nextMonthDate.getMonth())
  ).length;
  const quarterCount = upcoming.filter((r) =>
    isRenewalInQuarter(r.renewalDate, year, quarter)
  ).length;
  const nextQuarter = upcoming.filter((r) =>
    isRenewalInQuarter(
      r.renewalDate,
      nextQuarterDate.getFullYear(),
      getCurrentQuarterIndex(nextQuarterDate)
    )
  ).length;
  const expired = renewals.filter((r) => r.status === "expired").length;
  const renewed = renewals.filter((r) => r.wasRenewed).length;

  return {
    upcomingThisMonth: String(upcomingThisMonth),
    nextMonth: String(nextMonth),
    quarter: String(quarterCount),
    nextQuarter: String(nextQuarter),
    expired: String(expired),
    renewed: String(renewed),
  };
}

export type RenewalCardKey =
  | "upcomingThisMonth"
  | "nextMonth"
  | "quarter"
  | "nextQuarter"
  | "expired"
  | "renewed";

/** Map a period card click to the matching renewals filter. */
export function filtersForRenewalCard(
  card: RenewalCardKey,
  current: RenewalFilters
): RenewalFilters {
  switch (card) {
    case "upcomingThisMonth":
      return { ...current, date: "this-month", status: "upcoming" };
    case "nextMonth":
      return { ...current, date: "next-month", status: "upcoming" };
    case "quarter":
      return { ...current, date: "quarter", status: "upcoming" };
    case "nextQuarter":
      return { ...current, date: "next-quarter", status: "upcoming" };
    case "expired":
      return { ...current, date: "all", status: "expired" };
    case "renewed":
      return { ...current, date: "all", status: "renewed" };
    default:
      return current;
  }
}

export function isRenewalCardActive(
  card: RenewalCardKey,
  filters: RenewalFilters
): boolean {
  switch (card) {
    case "upcomingThisMonth":
      return filters.date === "this-month" && filters.status === "upcoming";
    case "nextMonth":
      return filters.date === "next-month" && filters.status === "upcoming";
    case "quarter":
      return filters.date === "quarter" && filters.status === "upcoming";
    case "nextQuarter":
      return filters.date === "next-quarter" && filters.status === "upcoming";
    case "expired":
      return filters.status === "expired" && filters.date === "all";
    case "renewed":
      return filters.status === "renewed" && filters.date === "all";
    default:
      return false;
  }
}

export function getRevenueCustomers(invoices: Invoice[]) {
  return getUniqueCustomers(invoices);
}

export const revenueTabLabels: Record<string, string> = {
  invoices: "Invoices",
  collections: "Collections",
  renewals: "Renewals",
};

export type RevenueTab = keyof typeof revenueTabLabels;

export function parseRevenueTab(value: string | null): RevenueTab {
  if (value === "collections" || value === "renewals") {
    return value;
  }
  return "invoices";
}
