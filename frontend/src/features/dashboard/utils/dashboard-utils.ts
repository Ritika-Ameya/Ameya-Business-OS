import { formatInvoiceCurrency, formatInvoiceDate } from "@/features/revenue/utils/invoice-utils";
import { formatDate } from "@/shared/utils/format-date";
import type { DashboardSummaryDto } from "@/features/dashboard/api/dashboard.dto";
import type {
  DashboardActivity,
  DashboardKpi,
  FounderInsight,
} from "@/features/dashboard/types/dashboard";

export function resolveIanaTimeZone(timeZone?: string | null): string | undefined {
  const raw = timeZone?.trim();
  if (!raw) return undefined;
  if (raw.toUpperCase() === "UTC") return "UTC";
  // Preferences store values like "Asia/Kolkata (IST)"
  const match = raw.match(/^([A-Za-z_]+\/[A-Za-z_]+)/);
  return match?.[1] ?? (raw.includes("/") ? raw.split(/\s+/)[0] : undefined);
}

function getHourInTimeZone(timeZone?: string | null): number {
  const iana = resolveIanaTimeZone(timeZone);
  if (!iana) return new Date().getHours();

  try {
    const hourPart = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: iana,
    })
      .formatToParts(new Date())
      .find((part) => part.type === "hour")?.value;

    const hour = Number(hourPart);
    if (Number.isFinite(hour)) return hour === 24 ? 0 : hour;
  } catch {
    // Fall through to local clock
  }

  return new Date().getHours();
}

export function getTimeOfDayGreeting(timeZone?: string | null): string {
  const hour = getHourInTimeZone(timeZone);
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatTodayDate(): string {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(now);
  const dateOnly = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `${weekday}, ${formatDate(dateOnly)}`;
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

export function getUpcomingRevenue(summary: DashboardSummaryDto | null): {
  items: Array<{
    id: string;
    customer: string;
    invoiceNumber: string;
    dueDate: string;
    amount: string;
    status: string;
  }>;
  totalExpectedRevenue: string;
} {
  if (!summary?.upcomingRevenue) {
    return { items: [], totalExpectedRevenue: formatInvoiceCurrency(0) };
  }

  return {
    items: summary.upcomingRevenue.items.map((item) => ({
      id: item.id,
      customer: item.customer,
      invoiceNumber: item.invoiceNumber,
      dueDate: formatInvoiceDate(item.dueDate),
      amount: formatInvoiceCurrency(item.amount),
      status: item.status,
    })),
    totalExpectedRevenue: formatInvoiceCurrency(
      summary.upcomingRevenue.totalExpectedRevenue
    ),
  };
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
