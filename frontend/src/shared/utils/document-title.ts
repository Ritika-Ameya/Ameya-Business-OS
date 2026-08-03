import { DOCUMENT_TITLE_FALLBACK } from "@/shared/utils/company-brand";

const PAGE_TITLES: Record<string, string> = {
  login: "Sign in",
  dashboard: "Dashboard",
  customers: "Customers",
  deals: "Deals",
  invoices: "Invoices",
  revenue: "Revenue",
  expenses: "Expenses",
  reports: "Reports",
  settings: "Settings",
};

/** Map a pathname to the short page label used in the browser tab. */
export function getPageTitleLabel(pathname: string): string | null {
  const segment = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!segment) return null;
  return PAGE_TITLES[segment] ?? null;
}

/** Build `Page | Company` (or company-only when no page label). */
export function formatDocumentTitle(
  pathname: string,
  companyName: string
): string {
  const brand = companyName.trim() || DOCUMENT_TITLE_FALLBACK;
  const page = getPageTitleLabel(pathname);
  return page ? `${page} | ${brand}` : brand;
}
