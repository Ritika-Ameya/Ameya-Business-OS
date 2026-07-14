import { formatInvoiceCurrency, formatInvoiceDate } from "@/features/revenue/utils/invoice-utils";
import { formatDate } from "@/shared/utils/format-date";
import type { DashboardSummaryDto } from "@/features/dashboard/api/dashboard.dto";
import type {
  DashboardActivity,
  DashboardKpi,
  FounderInsight,
} from "@/features/dashboard/types/dashboard";

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
  summary: DashboardSummaryDto | null
): FounderInsight {
  if (!summary) {
    return { message: "Loading business insight…" };
  }
  return summary.insight;
}

export function getDashboardKpis(
  summary: DashboardSummaryDto | null
): DashboardKpi[] {
  if (!summary) {
    return [
      {
        id: "revenue",
        label: "Revenue This Month",
        value: "—",
        trend: "Loading…",
        trendDirection: "neutral",
        href: "/revenue?tab=invoices",
      },
      {
        id: "collections",
        label: "Outstanding Collections",
        value: "—",
        trend: "Loading…",
        trendDirection: "neutral",
        href: "/revenue?tab=collections",
      },
      {
        id: "renewals",
        label: "Upcoming Renewals",
        value: "—",
        trend: "Loading…",
        trendDirection: "neutral",
        href: "/revenue?tab=renewals",
      },
      {
        id: "cash",
        label: "Cash Position",
        value: "—",
        trend: "Loading…",
        trendDirection: "neutral",
      },
    ];
  }

  const trendPct = summary.revenueTrendPct;
  const revenueTrend =
    trendPct === 0
      ? "Flat vs last month"
      : `${trendPct > 0 ? "+" : ""}${trendPct}% vs last month`;

  return [
    {
      id: "revenue",
      label: "Revenue This Month",
      value: formatInvoiceCurrency(summary.revenueThisMonth),
      trend: revenueTrend,
      trendDirection: trendPct > 0 ? "up" : trendPct < 0 ? "down" : "neutral",
      href: "/revenue?tab=invoices",
    },
    {
      id: "collections",
      label: "Outstanding Collections",
      value: formatInvoiceCurrency(summary.outstandingCollections),
      trend:
        summary.pendingInvoiceCount === 0
          ? "All clear"
          : `${summary.pendingInvoiceCount} invoice${summary.pendingInvoiceCount === 1 ? "" : "s"} pending`,
      trendDirection: "neutral",
      href: "/revenue?tab=collections",
    },
    {
      id: "renewals",
      label: "Upcoming Renewals",
      value: String(summary.upcomingRenewals),
      trend:
        summary.upcomingRenewals > 0 ? "Due this quarter" : "None scheduled",
      trendDirection: summary.upcomingRenewals > 0 ? "down" : "neutral",
      href: "/revenue?tab=renewals",
    },
    {
      id: "cash",
      label: "Cash Position",
      value: formatInvoiceCurrency(summary.cashPosition),
      trend: summary.cashPosition >= 0 ? "Healthy runway" : "Monitor closely",
      trendDirection: summary.cashPosition >= 0 ? "up" : "down",
    },
  ];
}

export function getPendingCollectionsTop5(summary: DashboardSummaryDto | null) {
  if (!summary) return [];
  return summary.pendingCollections.map((item) => ({
    id: item.id,
    customer: item.customer,
    outstanding: formatInvoiceCurrency(item.outstanding),
    dueDate: formatInvoiceDate(item.dueDate),
  }));
}

export function getUpcomingRenewalsTop5(summary: DashboardSummaryDto | null) {
  if (!summary) return [];
  return summary.upcomingRenewalsList.map((item) => ({
    id: item.id,
    customer: item.customer,
    renewal: item.renewal,
    dueDate: formatDate(item.dueDate),
  }));
}

export function getRecentActivity(
  summary: DashboardSummaryDto | null
): DashboardActivity[] {
  if (!summary) return [];
  return [...summary.activity].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
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
