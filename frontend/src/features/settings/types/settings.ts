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

export interface SettingsOpportunitySource {
  id: string;
  name: string;
  description: string;
  status: SettingsEntityStatus;
}

export interface SettingsIndustry {
  id: string;
  name: string;
  description: string;
  status: SettingsEntityStatus;
}

export interface SettingsCountry {
  id: string;
  name: string;
  code: string;
  status: SettingsEntityStatus;
}

export interface SettingsState {
  id: string;
  name: string;
  code: string;
  countryId: string;
  status: SettingsEntityStatus;
}

export interface BrandingSettings {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline: string;
}

export interface OpportunitySourceFormData {
  name: string;
  description: string;
  status: SettingsEntityStatus;
}

export interface IndustryFormData {
  name: string;
  description: string;
  status: SettingsEntityStatus;
}

export interface CountryFormData {
  name: string;
  code: string;
  status: SettingsEntityStatus;
}

export interface StateFormData {
  name: string;
  code: string;
  countryId: string;
  status: SettingsEntityStatus;
}

export interface BrandingFormData {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline: string;
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

export type StageApplicableFor = "opportunity" | "customer" | "both";

export type StageReminderOffset =
  | "same-day"
  | "1-day-before"
  | "3-days-before"
  | "7-days-before";

export interface SettingsStage {
  id: string;
  name: string;
  color: string;
  sequence: number;
  applicableFor: StageApplicableFor;
  dateRequired: boolean;
  notesRequired: boolean;
  reminderOffset: StageReminderOffset;
  status: SettingsEntityStatus;
}

export interface StageFormData {
  name: string;
  color: string;
  sequence: number;
  applicableFor: StageApplicableFor;
  dateRequired: boolean;
  notesRequired: boolean;
  reminderOffset: StageReminderOffset;
  status: SettingsEntityStatus;
}

export type SettingsSection = "company" | "masters" | "finance" | "branding" | "preferences";

export type MasterTab =
  | "opportunity-sources"
  | "industries"
  | "stages"
  | "deal-types"
  | "payment-methods"
  | "expense-categories"
  | "renewal-types"
  | "countries"
  | "states"
  | "employees"
  | "vendors";
