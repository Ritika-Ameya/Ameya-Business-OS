import { seedDeals } from "@/features/deals/data/seed-deals";
import { seedInvoices } from "@/features/revenue/data/seed-invoices";
import { seedPayments } from "@/features/revenue/data/seed-payments";
import { formatInvoiceCurrency, getUniqueCustomers } from "@/features/revenue/utils/invoice-utils";
import type { Deal, RenewalFrequency } from "@/features/deals/types/deal";
import type { Invoice } from "@/features/revenue/types/invoice";
import type {
  CollectionFilters,
  CollectionStatusFilter,
  RenewalFilters,
} from "@/features/revenue/types/revenue";

export type CompanyRenewalStatus = "upcoming" | "overdue" | "renewed";

export interface CollectionRow {
  invoice: Invoice;
  daysOverdue: number;
  lastPaymentDate?: string;
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
  status: CompanyRenewalStatus;
  renewalType: "annual" | "quarterly" | "monthly";
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
};

export const collectionStatusLabels: Record<CollectionStatusFilter, string> = {
  all: "All Status",
  partial: "Partial",
  overdue: "Overdue",
  sent: "Sent",
  pending: "Pending",
};

export const renewalTypeLabels: Record<RenewalFilters["renewalType"], string> = {
  all: "All Types",
  annual: "Annual",
  quarterly: "Quarterly",
  monthly: "Monthly",
};

export const renewalStatusLabels: Record<RenewalFilters["status"], string> = {
  all: "All Status",
  upcoming: "Upcoming",
  overdue: "Overdue",
  renewed: "Renewed",
};

export const companyRenewalStatusStyles: Record<CompanyRenewalStatus, string> = {
  upcoming: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
  renewed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export function getCollectionInvoices(): Invoice[] {
  return seedInvoices.filter(
    (invoice) =>
      invoice.outstanding > 0 ||
      invoice.status === "partial" ||
      invoice.status === "overdue" ||
      invoice.status === "sent"
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

export function getLastPaymentDate(invoiceId: string): string | undefined {
  const payments = seedPayments
    .filter((payment) => payment.invoiceId === invoiceId)
    .sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  return payments[0]?.paymentDate;
}

export function buildCollectionRows(invoices: Invoice[]): CollectionRow[] {
  return invoices.map((invoice) => ({
    invoice,
    daysOverdue: getDaysOverdue(invoice.dueDate),
    lastPaymentDate: getLastPaymentDate(invoice.id),
  }));
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
        (invoice.status === "sent" || invoice.status === "partial"));

    const invoiceDate = new Date(invoice.invoiceDate);
    const matchesDate =
      filters.date === "all" ||
      (filters.date === "this-month" &&
        invoiceDate.getMonth() === now.getMonth() &&
        invoiceDate.getFullYear() === now.getFullYear()) ||
      (filters.date === "last-month" &&
        invoiceDate.getMonth() === (now.getMonth() + 11) % 12) ||
      (filters.date === "overdue" && invoice.status === "overdue");

    return matchesCustomer && matchesStatus && matchesDate;
  });
}

export function getCollectionStats() {
  const collectionInvoices = getCollectionInvoices();
  const outstandingAmount = collectionInvoices.reduce(
    (sum, invoice) => sum + invoice.outstanding,
    0
  );
  const pendingCount = collectionInvoices.filter((i) => i.outstanding > 0).length;
  const overdueCount = collectionInvoices.filter((i) => i.status === "overdue").length;

  const now = new Date();
  const collectedThisMonth = seedPayments
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

export function getCompanyRenewals(deals: Deal[] = seedDeals): CompanyRenewalRow[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return deals
    .filter((deal) => deal.nextRenewal && deal.renewalFrequency !== "none")
    .map((deal) => {
      const renewalDate = new Date(deal.nextRenewal!);
      renewalDate.setHours(0, 0, 0, 0);
      const status: CompanyRenewalStatus =
        renewalDate < now ? "overdue" : "upcoming";

      return {
        id: `renewal-${deal.id}`,
        dealId: deal.id,
        customerId: deal.customerId,
        customerName: deal.customerName,
        renewalLabel: `${deal.title} Renewal`,
        dealTitle: deal.title,
        renewalDate: deal.nextRenewal!,
        amount: deal.contractValue
          ? formatInvoiceCurrency(deal.contractValue)
          : "—",
        status,
        renewalType: mapRenewalType(deal.renewalFrequency),
      };
    })
    .sort(
      (a, b) =>
        new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
    );
}

export function filterCompanyRenewals(
  renewals: CompanyRenewalRow[],
  filters: RenewalFilters
): CompanyRenewalRow[] {
  const now = new Date();

  return renewals.filter((renewal) => {
    const matchesCustomer =
      filters.customer === "all" || renewal.customerId === filters.customer;

    const matchesType =
      filters.renewalType === "all" || renewal.renewalType === filters.renewalType;

    const matchesStatus =
      filters.status === "all" || renewal.status === filters.status;

    const renewalDate = new Date(renewal.renewalDate);
    const matchesDate =
      filters.date === "all" ||
      (filters.date === "this-month" &&
        renewalDate.getMonth() === now.getMonth() &&
        renewalDate.getFullYear() === now.getFullYear()) ||
      (filters.date === "last-month" &&
        renewalDate.getMonth() === (now.getMonth() + 11) % 12) ||
      (filters.date === "overdue" && renewal.status === "overdue");

    return matchesCustomer && matchesType && matchesStatus && matchesDate;
  });
}

export function getRenewalStats(renewals: CompanyRenewalRow[]) {
  const now = new Date();
  const upcomingThisMonth = renewals.filter((renewal) => {
    const date = new Date(renewal.renewalDate);
    return (
      renewal.status === "upcoming" &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  const overdue = renewals.filter((r) => r.status === "overdue").length;
  const renewed = 0;

  return {
    upcomingThisMonth: String(upcomingThisMonth),
    overdue: String(overdue),
    renewed: String(renewed),
    renewalValue: "—",
  };
}

export function getRevenueCustomers() {
  return getUniqueCustomers(seedInvoices);
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
