import { ChevronRight } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { seedInvoices } from "@/data/seed-invoices";
import { useCustomers } from "@/hooks/use-customers";
import { useDeals } from "@/hooks/use-deals";
import { getInvoiceById } from "@/lib/invoice-utils";
import { revenueTabLabels } from "@/lib/revenue-utils";
import { masterTabLabels, settingsSectionLabels } from "@/lib/settings-utils";
import type { MasterTab } from "@/types/settings";
import { navItems } from "./navigation";

function segmentToTitle(segment: string): string {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSegmentLabel(segment: string, index: number, segments: string[]): string {
  if (segments[index + 1] === "new" && segment === "deals") {
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
  getDeal: (id: string) => { title: string } | undefined
): string | null {
  const segment = segments[index];
  const parent = segments[index - 1];

  if (parent === "customers" && segment.startsWith("cust-")) {
    return getCustomer(segment)?.name ?? null;
  }

  if (parent === "deals" && segment.startsWith("deal-")) {
    return getDeal(segment)?.title ?? null;
  }

  if (parent === "invoices" && segment.startsWith("inv-")) {
    if (segment === "inv-new") {
      return "New Invoice";
    }
    return getInvoiceById(seedInvoices, segment)?.invoiceNo ?? null;
  }

  return null;
}

function shouldSkipSegment(segments: string[], index: number): boolean {
  const segment = segments[index];
  const parent = segments[index - 1];
  return segment === "new" && parent === "deals";
}

export function Breadcrumb() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { getCustomer } = useCustomers();
  const { getDeal } = useDeals();
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
    <div className="flex min-h-8 items-center gap-1 text-sm text-muted-foreground">
      <Link to="/dashboard" className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
        Home
      </Link>
      {visibleSegments.map(({ segment, index }) => {
        const href =
          segments[index + 1] === "new" && segment === "deals"
            ? `/${segments.slice(0, index).join("/")}`
            : `/${segments.slice(0, index + 1).join("/")}`;
        const entityLabel = resolveEntityLabel(segments, index, getCustomer, getDeal);
        const label = entityLabel ?? getSegmentLabel(segment, index, segments);
        const isLast = index === lastVisibleIndex && !trailingLabel;

        return (
          <div key={`${href}-${segment}`} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link to={href} className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
                {label}
              </Link>
            )}
          </div>
        );
      })}
      {trailingLabel ? (
        <div className="flex items-center gap-1">
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-foreground">{trailingLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
