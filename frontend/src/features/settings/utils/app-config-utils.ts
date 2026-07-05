import type {
  SettingsDealType,
  SettingsEmployee,
  SettingsExpenseCategory,
  SettingsPaymentMethod,
  SettingsVendor,
} from "@/features/settings/types/settings";
import type { ExpenseCategoryItem, EmployeeItem, VendorItem } from "@/features/expenses/types/expense";
import type { FinanceSettings } from "@/features/settings/types/settings";

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

export function getDefaultTaxPercentage(finance: FinanceSettings): string {
  return finance.defaultTaxPercentage || "18";
}

function getActiveItems<T extends { status: string }>(items: T[]): T[] {
  return items.filter((item) => item.status === "active");
}

function getActiveCategories(
  categories: SettingsExpenseCategory[]
): SettingsExpenseCategory[] {
  return getActiveItems(categories);
}

function getActiveVendors(vendors: SettingsVendor[]): SettingsVendor[] {
  return getActiveItems(vendors);
}

function getActiveEmployees(
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

export function getPaymentMethodLabel(
  slug: string | undefined,
  methods: SettingsPaymentMethod[]
): string {
  if (!slug) return "—";
  return methods.find((method) => method.slug === slug)?.name ?? slug;
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
