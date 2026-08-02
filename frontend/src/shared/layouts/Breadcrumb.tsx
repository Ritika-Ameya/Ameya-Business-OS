import { ChevronRight } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { revenueTabLabels } from "@/features/revenue/utils/revenue-utils";
import { masterTabLabels, settingsSectionLabels } from "@/features/settings/utils/settings-utils";
import type { MasterTab } from "@/features/settings/types/settings";
import { navItems } from "./navigation";

function segmentToTitle(segment: string): string {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSegmentLabel(segment: string, index: number, segments: string[]): string {
  if (segment === "new" && segments[index - 1] === "deals") {
    return "Create Deal";
  }
  if (
    segments[index + 1] === "new" &&
    segment === "deals" &&
    segments[0] === "customers"
  ) {
    return "Create Deal";
  }

  if (segments[0] === "settings" && index === 1) {
    const section = segment as keyof typeof settingsSectionLabels;
    if (section in settingsSectionLabels) {
      return settingsSectionLabels[section];
    }
  }

  const item = navItems.find((nav) => nav.href === `/${segments.slice(0, index + 1).join("/")}`);
  if (item) return item.label;

  return segmentToTitle(segment);
}

function resolveEntityLabel(
  segments: string[],
  index: number,
  getCustomer: (id: string) => { name: string } | undefined,
  getDeal: (id: string) => { title: string } | undefined,
  getInvoice: (id: string) => { invoiceNo: string } | undefined
): string | null {
  const segment = segments[index];
  if (!segment) return null;

  const parent = segments[index - 1];

  // IDs are UUIDs (not legacy cust-/deal-/inv- prefixes) — resolve by lookup.
  if (parent === "customers") {
    return getCustomer(segment)?.name ?? null;
  }

  if (parent === "deals") {
    return getDeal(segment)?.title ?? null;
  }

  if (parent === "invoices") {
    return getInvoice(segment)?.invoiceNo ?? null;
  }

  return null;
}

function shouldSkipSegment(segments: string[], index: number): boolean {
  const segment = segments[index];
  const parent = segments[index - 1];
  // Nested create path: /customers/:id/deals/new — skip "new" (label is on "deals")
  return (
    segment === "new" && parent === "deals" && segments[0] === "customers"
  );
}

export function Breadcrumb() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { getCustomer } = useCustomers();
  const { getDeal } = useDeals();
  const { getInvoice } = useRevenue();
  const segments = pathname.split("/").filter(Boolean);

  const masterTab = searchParams.get("tab") as MasterTab | null;
  const masterTabLabel =
    segments[0] === "settings" &&
    segments[1] === "masters" &&
    masterTab &&
    masterTab in masterTabLabels
      ? masterTabLabels[masterTab]
      : null;

  const reportTabLabels: Record<string, string> = {
    revenue: "Revenue Report",
    expense: "Expense Report",
    outstanding: "Outstanding Report",
    renewal: "Renewal Report",
  };

  const reportTab = searchParams.get("tab");
  const reportTabLabel =
    segments[0] === "reports" && reportTab && reportTab in reportTabLabels
      ? reportTabLabels[reportTab]
      : null;

  const expenseTabLabels: Record<string, string> = {
    register: "Expense Register",
    master: "Expense Master",
  };

  const expenseTab = searchParams.get("tab");
  const expenseTabLabel =
    segments[0] === "expenses" && expenseTab && expenseTab in expenseTabLabels
      ? expenseTabLabels[expenseTab]
      : segments[0] === "expenses"
        ? expenseTabLabels.register
        : null;

  const revenueTab = searchParams.get("tab");
  const revenueTabLabel =
    segments[0] === "revenue" && revenueTab && revenueTab in revenueTabLabels
      ? revenueTabLabels[revenueTab]
      : segments[0] === "revenue"
        ? revenueTabLabels.invoices
        : pathname.startsWith("/invoices")
          ? revenueTabLabels.invoices
          : null;

  const invoiceWorkspaceTab =
    pathname.startsWith("/invoices/") && searchParams.get("tab");
  const invoiceWorkspaceTabLabel =
    invoiceWorkspaceTab === "payments"
      ? "Payments"
      : invoiceWorkspaceTab === "timeline"
        ? "Timeline"
        : invoiceWorkspaceTab === "documents"
          ? "Documents"
          : null;

  const dealWorkspaceTab =
    pathname.startsWith("/deals/") && searchParams.get("tab");
  const dealWorkspaceTabLabels: Record<string, string> = {
    components: "Components",
    invoices: "Invoices",
    payments: "Payments",
    renewals: "Renewals",
    documents: "Documents",
    timeline: "Timeline",
    notes: "Notes",
  };
  const dealWorkspaceTabLabel =
    dealWorkspaceTab && dealWorkspaceTab in dealWorkspaceTabLabels
      ? dealWorkspaceTabLabels[dealWorkspaceTab]
      : null;

  const trailingLabel =
    masterTabLabel ??
    reportTabLabel ??
    expenseTabLabel ??
    revenueTabLabel ??
    invoiceWorkspaceTabLabel ??
    dealWorkspaceTabLabel;

  const visibleSegments = segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ index }) => !shouldSkipSegment(segments, index));

  const lastVisibleIndex = visibleSegments.at(-1)?.index ?? -1;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-h-8 max-w-full items-center gap-1 overflow-x-auto text-sm text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <Link
        to="/dashboard"
        className="shrink-0 rounded-md px-2 py-1 hover:bg-muted hover:text-foreground"
      >
        Home
      </Link>
      {visibleSegments.map(({ segment, index }) => {
        const href =
          segments[index + 1] === "new" && segment === "deals"
            ? `/${segments.slice(0, index).join("/")}`
            : `/${segments.slice(0, index + 1).join("/")}`;
        const entityLabel = resolveEntityLabel(
          segments,
          index,
          getCustomer,
          getDeal,
          getInvoice
        );
        const label = entityLabel ?? getSegmentLabel(segment, index, segments);
        const isLast = index === lastVisibleIndex && !trailingLabel;

        return (
          <div key={`${href}-${segment}`} className="flex shrink-0 items-center gap-1">
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            {isLast ? (
              <span className="max-w-[40vw] truncate font-medium text-foreground sm:max-w-[28rem]">
                {label}
              </span>
            ) : (
              <Link
                to={href}
                className="max-w-[32vw] truncate rounded-md px-2 py-1 hover:bg-muted hover:text-foreground sm:max-w-[16rem]"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
      {trailingLabel ? (
        <div className="flex shrink-0 items-center gap-1">
          <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          <span className="max-w-[40vw] truncate font-medium text-foreground sm:max-w-[16rem]">
            {trailingLabel}
          </span>
        </div>
      ) : null}
    </nav>
  );
}
