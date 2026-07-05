export type SettingsEntityStatus = "active" | "inactive";

export interface CompanySettings {
  companyName: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  currency: string;
  financialYear: string;
}

export interface SettingsEmployee {
  id: string;
  name: string;
  department: string;
  designation: string;
  status: SettingsEntityStatus;
}

export interface SettingsVendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: SettingsEntityStatus;
}

export interface SettingsExpenseCategory {
  id: string;
  name: string;
  description: string;
  status: SettingsEntityStatus;
}

export interface SettingsRenewalType {
  id: string;
  name: string;
  status: SettingsEntityStatus;
}

export interface SettingsPaymentMethod {
  id: string;
  name: string;
  slug: string;
  status: SettingsEntityStatus;
}

export interface SettingsDealType {
  id: string;
  name: string;
  slug: string;
  status: SettingsEntityStatus;
}

export interface FinanceSettings {
  invoicePrefix: string;
  nextInvoiceNumber: string;
  defaultTaxPercentage: string;
  defaultPaymentTerms: string;
  currencySymbol: string;
}

export interface PreferencesSettings {
  theme: string;
  dateFormat: string;
  currencyFormat: string;
  timeZone: string;
}

export interface EmployeeFormData {
  name: string;
  department: string;
  designation: string;
  status: SettingsEntityStatus;
}

export interface VendorFormData {
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: SettingsEntityStatus;
}

export interface ExpenseCategoryFormData {
  name: string;
  description: string;
  status: SettingsEntityStatus;
}

export interface RenewalTypeFormData {
  name: string;
  status: SettingsEntityStatus;
}

export interface PaymentMethodFormData {
  name: string;
  slug: string;
  status: SettingsEntityStatus;
}

export interface DealTypeFormData {
  name: string;
  slug: string;
  status: SettingsEntityStatus;
}

export type SettingsSection = "company" | "masters" | "finance" | "preferences";

export type MasterTab =
  | "employees"
  | "vendors"
  | "expense-categories"
  | "renewal-types"
  | "payment-methods"
  | "deal-types";
