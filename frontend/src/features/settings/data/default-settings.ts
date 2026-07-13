import type {
  BrandingSettings,
  CompanySettings,
  FinanceSettings,
  PreferencesSettings,
} from "@/features/settings/types/settings";

export const defaultCompanySettings: CompanySettings = {
  companyName: "",
  gstin: "",
  pan: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  currency: "INR",
  financialYear: "April – March",
};

export const defaultFinanceSettings: FinanceSettings = {
  invoicePrefix: "INV",
  nextInvoiceNumber: "0001",
  defaultTaxPercentage: "18",
  defaultPaymentTerms: "Net 15",
  currencySymbol: "₹",
};

export const defaultBrandingSettings: BrandingSettings = {
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#3b82f6",
  secondaryColor: "#64748b",
  accentColor: "#10b981",
  tagline: "",
};

export const defaultPreferencesSettings: PreferencesSettings = {
  theme: "System",
  dateFormat: "DD MMM YYYY",
  currencyFormat: "Indian Rupee (INR)",
  timeZone: "Asia/Kolkata (IST)",
};
