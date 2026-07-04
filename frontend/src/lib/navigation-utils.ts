/** Whether a primary sidebar nav item should appear active for the current path. */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/settings") {
    return pathname.startsWith("/settings");
  }
  if (href === "/customers") {
    return pathname.startsWith("/customers");
  }
  if (href === "/deals") {
    return pathname.startsWith("/deals");
  }
  if (href === "/revenue") {
    return pathname.startsWith("/revenue") || pathname.startsWith("/invoices");
  }
  if (href === "/expenses") {
    return pathname.startsWith("/expenses");
  }
  if (href === "/reports") {
    return pathname.startsWith("/reports");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
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
