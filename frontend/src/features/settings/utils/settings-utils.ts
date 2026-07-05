import type { SettingsEntityStatus } from "@/features/settings/types/settings";

export const settingsSectionLabels = {
  company: "Company",
  masters: "Masters",
  finance: "Finance",
  preferences: "Preferences",
} as const;

export const masterTabLabels = {
  employees: "Employees",
  vendors: "Vendors",
  "expense-categories": "Expense Categories",
  "renewal-types": "Renewal Types",
  "payment-methods": "Payment Methods",
  "deal-types": "Deal Types",
  stages: "Stage Builder",
} as const;

export const statusLabels: Record<SettingsEntityStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const statusStyles: Record<SettingsEntityStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
};

export const currencyOptions = ["INR", "USD", "EUR", "GBP"];

export const financialYearOptions = [
  "April – March",
  "January – December",
  "July – June",
];

export const dateFormatOptions = [
  "DD MMM YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
  "DD/MM/YYYY",
];

export const currencyFormatOptions = [
  "Indian Rupee (INR)",
  "US Dollar (USD)",
  "Compact (1.2K)",
];

export const timeZoneOptions = [
  "Asia/Kolkata (IST)",
  "UTC",
  "America/New_York (EST)",
  "Europe/London (GMT)",
];

export const themeOptions = ["System", "Light", "Dark"];

export function filterByQuery<T>(
  items: T[],
  query: string,
  fields: (item: T) => string[]
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;

  return items.filter((item) =>
    fields(item).join(" ").toLowerCase().includes(normalized)
  );
}
