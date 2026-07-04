import type {
  CompanySettings,
  FinanceSettings,
  PreferencesSettings,
  SettingsEmployee,
  SettingsExpenseCategory,
  SettingsPaymentMethod,
  SettingsRenewalType,
  SettingsVendor,
} from "@/types/settings";

export const seedCompanySettings: CompanySettings = {
  companyName: "Ameya Business Solutions",
  gstin: "29AABCA1234F1Z5",
  pan: "AABCA1234F",
  email: "hello@ameya.business",
  phone: "+91 98765 43210",
  website: "https://ameya.business",
  address: "Indiranagar, Bengaluru, Karnataka 560038",
  currency: "INR",
  financialYear: "April – March",
};

export const seedFinanceSettings: FinanceSettings = {
  invoicePrefix: "INV",
  nextInvoiceNumber: "0062",
  defaultTaxPercentage: "18",
  defaultPaymentTerms: "Net 15",
  currencySymbol: "₹",
};

export const seedPreferencesSettings: PreferencesSettings = {
  theme: "System",
  dateFormat: "DD MMM YYYY",
  currencyFormat: "Indian Rupee (INR)",
  timeZone: "Asia/Kolkata (IST)",
};

export const seedSettingsEmployees: SettingsEmployee[] = [
  {
    id: "emp-001",
    name: "Jaya",
    department: "Operations",
    designation: "Account Manager",
    status: "active",
  },
  {
    id: "emp-002",
    name: "Abhay",
    department: "Leadership",
    designation: "Founder",
    status: "active",
  },
  {
    id: "emp-003",
    name: "Ayush",
    department: "Leadership",
    designation: "Co-Founder",
    status: "active",
  },
];

export const seedSettingsVendors: SettingsVendor[] = [
  {
    id: "ven-001",
    name: "WeWork Bangalore",
    category: "Office Rent",
    contactPerson: "Facility Manager",
    phone: "+91 80 1234 5678",
    email: "bengaluru@wework.com",
    status: "active",
  },
  {
    id: "ven-002",
    name: "Amazon Web Services",
    category: "Cloud",
    contactPerson: "Billing Support",
    phone: "",
    email: "billing@aws.amazon.com",
    status: "active",
  },
  {
    id: "ven-003",
    name: "Airtel Business",
    category: "Internet",
    contactPerson: "Account Executive",
    phone: "+91 98765 11111",
    email: "enterprise@airtel.in",
    status: "active",
  },
];

export const seedSettingsExpenseCategories: SettingsExpenseCategory[] = [
  {
    id: "cat-001",
    name: "Salary",
    description: "Employee payroll and compensation",
    status: "active",
  },
  {
    id: "cat-002",
    name: "Office Rent",
    description: "Workspace and facility rental",
    status: "active",
  },
  {
    id: "cat-003",
    name: "Cloud Infrastructure",
    description: "AWS, hosting and cloud services",
    status: "active",
  },
  {
    id: "cat-004",
    name: "Marketing",
    description: "Advertising and growth spend",
    status: "active",
  },
];

export const seedSettingsRenewalTypes: SettingsRenewalType[] = [
  { id: "ren-001", name: "AMC", status: "active" },
  { id: "ren-002", name: "Hosting", status: "active" },
  { id: "ren-003", name: "Domain", status: "active" },
  { id: "ren-004", name: "Cloud", status: "active" },
  { id: "ren-005", name: "WhatsApp API", status: "active" },
  { id: "ren-006", name: "AI Subscription", status: "active" },
  { id: "ren-007", name: "Software License", status: "active" },
  { id: "ren-008", name: "Other", status: "active" },
];

export const seedSettingsPaymentMethods: SettingsPaymentMethod[] = [
  { id: "pay-001", name: "Cash", status: "active" },
  { id: "pay-002", name: "Bank Transfer", status: "active" },
  { id: "pay-003", name: "UPI", status: "active" },
  { id: "pay-004", name: "Cheque", status: "active" },
  { id: "pay-005", name: "Credit Card", status: "active" },
  { id: "pay-006", name: "Other", status: "active" },
];
