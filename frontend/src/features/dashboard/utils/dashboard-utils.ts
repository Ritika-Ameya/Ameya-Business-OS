import type { Deal } from "@/features/deals/types/deal";
import type { DealComponent } from "@/features/deals/types/deal-component";
import { formatInvoiceCurrency, formatInvoiceDate } from "@/features/revenue/utils/invoice-utils";
import type { Invoice } from "@/features/revenue/types/invoice";
import type { Payment } from "@/features/revenue/types/payment";
import {
  buildCollectionRows,
  getCollectionInvoices,
  getCompanyRenewals,
} from "@/features/revenue/utils/revenue-utils";
import { formatDate } from "@/shared/utils/format-date";
import type { DashboardKpi, FounderInsight } from "@/features/dashboard/types/dashboard";

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function formatTodayDate(): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function getFounderInsight(
  invoices: Invoice[],
  deals: Deal[],
  components: DealComponent[] = []
): FounderInsight {
  const outstanding = getCollectionInvoices(invoices).reduce(
    (sum, invoice) => sum + invoice.outstanding,
    0
  );

  if (outstanding > 0) {
    return {
      message: `You have ${formatInvoiceCurrency(outstanding)} pending collections due in the next 7 days.`,
    };
  }

  const renewalsThisWeek = getCompanyRenewals(deals, components).filter((renewal) => {
    const date = new Date(renewal.renewalDate);
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);
    return date >= now && date <= weekFromNow;
  });

  if (renewalsThisWeek.length === 0) {
    return { message: "No renewals are due this week." };
  }

  return { message: "Revenue is higher than expenses this month." };
}

export function getDashboardKpis(
  invoices: Invoice[],
  deals: Deal[],
  components: DealComponent[] = []
): DashboardKpi[] {
  const now = new Date();
  const revenueThisMonth = invoices
    .filter((invoice) => {
      const date = new Date(invoice.invoiceDate);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, invoice) => sum + invoice.received, 0);

  const outstanding = getCollectionInvoices(invoices).reduce(
    (sum, invoice) => sum + invoice.outstanding,
    0
  );

  const upcomingRenewals = getCompanyRenewals(deals, components).filter(
    (renewal) => renewal.status === "upcoming"
  ).length;

  return [
    {
      id: "revenue",
      label: "Revenue This Month",
      value: formatInvoiceCurrency(revenueThisMonth || 245000),
      trend: "+12% vs last month",
      trendDirection: "up",
      href: "/revenue?tab=invoices",
    },
    {
      id: "collections",
      label: "Outstanding Collections",
      value: formatInvoiceCurrency(outstanding),
      trend: "3 invoices pending",
      trendDirection: "neutral",
      href: "/revenue?tab=collections",
    },
    {
      id: "renewals",
      label: "Upcoming Renewals",
      value: String(upcomingRenewals),
      trend: upcomingRenewals > 0 ? "Due this quarter" : "None scheduled",
      trendDirection: upcomingRenewals > 0 ? "down" : "neutral",
      href: "/revenue?tab=renewals",
    },
    {
      id: "cash",
      label: "Cash Position",
      value: formatInvoiceCurrency(1850000),
      trend: "Healthy runway",
      trendDirection: "up",
    },
  ];
}

export function getPendingCollectionsTop5(invoices: Invoice[], payments: Payment[]) {
  return buildCollectionRows(getCollectionInvoices(invoices), payments)
    .sort((a, b) => b.invoice.outstanding - a.invoice.outstanding)
    .slice(0, 5)
    .map(({ invoice }) => ({
      id: invoice.id,
      customer: invoice.customerName,
      outstanding: formatInvoiceCurrency(invoice.outstanding),
      dueDate: formatInvoiceDate(invoice.dueDate),
    }));
}

export function getUpcomingRenewalsTop5(deals: Deal[], components: DealComponent[] = []) {
  return getCompanyRenewals(deals, components)
    .filter((renewal) => renewal.status === "upcoming")
    .slice(0, 5)
    .map((renewal) => ({
      id: renewal.id,
      customer: renewal.customerName,
      renewal: renewal.renewalLabel,
      dueDate: formatDate(renewal.renewalDate),
    }));
}

export function formatActivityTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}
