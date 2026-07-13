import type { SettingsEntityStatus } from "@/features/settings/types/settings";

export const settingsSectionLabels = {
  company: "Company",
  masters: "Masters",
  finance: "Finance",
  branding: "Branding",
  preferences: "Preferences",
} as const;

export const masterTabLabels = {
  "opportunity-sources": "Opportunity Sources",
  industries: "Industries",
  stages: "Stage Builder",
  "deal-types": "Deal Types",
  "payment-methods": "Payment Methods",
  "expense-categories": "Expense Categories",
  "renewal-types": "Renewal Frequencies",
  countries: "Countries",
  states: "States",
  employees: "Employees",
  vendors: "Vendors",
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
