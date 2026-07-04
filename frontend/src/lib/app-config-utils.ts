import type { AppConfigState } from "@/types/app-config";
import type {
  SettingsDealType,
  SettingsEmployee,
  SettingsExpenseCategory,
  SettingsPaymentMethod,
  SettingsRenewalType,
  SettingsVendor,
} from "@/types/settings";
import type { ExpenseCategoryItem, EmployeeItem, VendorItem } from "@/types/expense";
import type { CompanySettings, FinanceSettings } from "@/types/settings";

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

export function isValidGstin(gstin: string): boolean {
  const normalized = gstin.trim().toUpperCase();
  if (!normalized) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(normalized);
}

export function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatAppCurrency(
  amount: number,
  config?: Pick<AppConfigState, "company" | "finance">
): string {
  const currency = config?.company.currency ?? "INR";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDefaultTaxPercentage(finance: FinanceSettings): string {
  return finance.defaultTaxPercentage || "18";
}

export function getActiveItems<T extends { status: string }>(items: T[]): T[] {
  return items.filter((item) => item.status === "active");
}

export function getActiveCategories(
  categories: SettingsExpenseCategory[]
): SettingsExpenseCategory[] {
  return getActiveItems(categories);
}

export function getActiveVendors(vendors: SettingsVendor[]): SettingsVendor[] {
  return getActiveItems(vendors);
}

export function getActiveEmployees(
  employees: SettingsEmployee[]
): SettingsEmployee[] {
  return getActiveItems(employees);
}

export function getActivePaymentMethods(
  methods: SettingsPaymentMethod[]
): SettingsPaymentMethod[] {
  return getActiveItems(methods);
}

export function getActiveDealTypes(dealTypes: SettingsDealType[]): SettingsDealType[] {
  return getActiveItems(dealTypes);
}

export function getActiveRenewalTypes(
  renewalTypes: SettingsRenewalType[]
): SettingsRenewalType[] {
  return getActiveItems(renewalTypes);
}

export function getPaymentMethodLabel(
  slug: string | undefined,
  methods: SettingsPaymentMethod[]
): string {
  if (!slug) return "—";
  return methods.find((method) => method.slug === slug)?.name ?? slug;
}

export function getCategoryNameById(
  categories: SettingsExpenseCategory[],
  categoryId: string
): string {
  return categories.find((category) => category.id === categoryId)?.name ?? categoryId;
}

export function toExpenseCategoryItems(
  categories: SettingsExpenseCategory[]
): ExpenseCategoryItem[] {
  return getActiveCategories(categories).map((category) => ({
    id: category.id,
    name: category.name,
  }));
}

export function toVendorItems(vendors: SettingsVendor[]): VendorItem[] {
  return getActiveVendors(vendors).map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
  }));
}

export function toEmployeeItems(employees: SettingsEmployee[]): EmployeeItem[] {
  return getActiveEmployees(employees).map((employee) => ({
    id: employee.id,
    name: employee.name,
  }));
}

export function getCustomerBillingAddress(customer: {
  billingAddress?: string;
  serviceAddress?: string;
  address?: string;
}): string {
  return customer.billingAddress ?? customer.address ?? "";
}

export function getCustomerServiceAddress(customer: {
  billingAddress?: string;
  serviceAddress?: string;
  address?: string;
}): string {
  return customer.serviceAddress ?? customer.billingAddress ?? customer.address ?? "";
}

export type InvoiceAddressType = "billing" | "service";

export function resolveCustomerAddress(
  customer: {
    billingAddress?: string;
    serviceAddress?: string;
    address?: string;
  },
  type: InvoiceAddressType
): string {
  if (type === "service") return getCustomerServiceAddress(customer);
  return getCustomerBillingAddress(customer);
}

export function getCompanyDisplayName(company: CompanySettings): string {
  return company.companyName;
}
