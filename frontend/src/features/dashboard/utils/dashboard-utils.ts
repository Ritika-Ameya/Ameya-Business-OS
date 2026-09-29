import { formatInvoiceCurrency, formatInvoiceDate } from "@/features/revenue/utils/invoice-utils";
import { formatDate } from "@/shared/utils/format-date";
import {
  ALL_TIME,
  thisMonthPeriod,
  thisQuarterPeriod,
} from "@/shared/utils/period-label";
import type { DashboardSummaryDto } from "@/features/dashboard/api/dashboard.dto";
import { DEFAULT_RENEWAL_FILTER, filterRenewals } from "@/features/dashboard/utils/renewal-filter";
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

const trendCopy = (pct: number): Pick<DashboardKpi, "trend" | "trendDirection"> => ({
  trend: pct === 0 ? "Flat vs last month" : `${pct > 0 ? "+" : ""}${pct}% vs last month`,
  trendDirection: pct > 0 ? "up" : pct < 0 ? "down" : "neutral",
});

export function getDashboardKpis(
  summary: DashboardSummaryDto | null
): DashboardKpi[] {
  const loading = !summary;
  const received = summary?.received;
  const invoiced = summary?.invoiced;
  const renewals = summary?.renewalsAll ?? [];
  const nextMonth = filterRenewals(renewals, DEFAULT_RENEWAL_FILTER);
  const overdueRenewals = filterRenewals(renewals, "overdue").length;
  const loadingCopy = { trend: "Loading…", trendDirection: "neutral" as const };

  return [
    {
      id: "received",
      label: "Received This Month",
      value: loading ? "—" : formatInvoiceCurrency(received?.thisMonth ?? 0),
      ...(loading ? loadingCopy : trendCopy(received?.trendPct ?? 0)),
      href: "/revenue?tab=collections",
      period: thisMonthPeriod(),
    },
    {
      id: "invoiced",
      label: "Invoiced This Month",
      value: loading ? "—" : formatInvoiceCurrency(invoiced?.thisMonth ?? 0),
      ...(loading ? loadingCopy : trendCopy(invoiced?.trendPct ?? 0)),
      href: "/revenue?tab=invoices",
      period: thisMonthPeriod(),
    },
    {
      id: "collections",
      label: "Outstanding Collections",
      value: summary ? formatInvoiceCurrency(summary.outstandingCollections) : "—",
      ...(!summary
        ? loadingCopy
        : {
            trend:
              summary.pendingInvoiceCount === 0
                ? "All clear"
                : `${summary.pendingInvoiceCount} invoice${summary.pendingInvoiceCount === 1 ? "" : "s"} pending`,
            trendDirection: "neutral" as const,
          }),
      href: "/revenue?tab=collections",
      period: ALL_TIME,
    },
    {
      id: "renewals",
      label: "Renewals Next Month",
      value: loading ? "—" : String(nextMonth.length),
      ...(loading
        ? loadingCopy
        : {
            trend:
              overdueRenewals > 0
                ? `${overdueRenewals} overdue · tap to filter`
                : `${formatInvoiceCurrency(nextMonth.reduce((sum, item) => sum + item.amount, 0))} due`,
            trendDirection: overdueRenewals > 0 ? ("down" as const) : ("neutral" as const),
          }),
      href: "/revenue?tab=renewals",
      period: nextMonthPeriod(),
    },
    {
      id: "renewed",
      label: "Customers Renewed",
      value: summary ? String(summary.renewedCustomersThisQuarter) : "—",
      ...(!summary
        ? loadingCopy
        : {
            trend: summary.renewedCustomersThisQuarter > 0 ? "This quarter" : "None this quarter",
            trendDirection: summary.renewedCustomersThisQuarter > 0 ? ("up" as const) : ("neutral" as const),
          }),
      href: "/revenue?tab=renewals",
      period: thisQuarterPeriod(),
    },
  ];
}

const nextMonthPeriod = (): string => {
  const now = new Date();
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
    new Date(now.getFullYear(), now.getMonth() + 1, 1)
  );
};


export function getPendingCollectionsTop5(summary: DashboardSummaryDto | null) {
  if (!summary) return [];
  return summary.pendingCollections.slice(0, 5).map((item) => ({
    id: item.id,
    customer: item.customer,
    outstanding: formatInvoiceCurrency(item.outstanding),
    dueDate: formatInvoiceDate(item.dueDate),
  }));
}

export function getUpcomingRenewalsTop5(summary: DashboardSummaryDto | null) {
  if (!summary) return [];
  return summary.upcomingRenewalsList.slice(0, 5).map((item) => ({
    id: item.id,
    customer: item.customer,
    deal: item.deal || "—",
    renewal: item.renewal,
    dueDate: formatDate(item.dueDate),
    amount: formatInvoiceCurrency(item.amount),
  }));
}

export function getRenewedCustomersTop5(summary: DashboardSummaryDto | null) {
  if (!summary) return [];
  return (summary.renewedCustomersList ?? []).slice(0, 5).map((item) => ({
    id: item.id,
    customer: item.customer,
    deal: item.deal || "—",
    component: item.component || "—",
    lastRenewedDate: formatDate(item.lastRenewedDate),
    amount: formatInvoiceCurrency(item.amount || 0),
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
