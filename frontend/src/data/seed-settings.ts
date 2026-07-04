import type {
  CompanySettings,
  FinanceSettings,
  PreferencesSettings,
  SettingsDealType,
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
  {
    id: "ven-004",
    name: "BESCOM",
    category: "Electricity",
    contactPerson: "Billing",
    phone: "",
    email: "",
    status: "active",
  },
  {
    id: "ven-005",
    name: "Google",
    category: "Software",
    contactPerson: "Billing",
    phone: "",
    email: "",
    status: "active",
  },
  {
    id: "ven-006",
    name: "GoDaddy",
    category: "Domain",
    contactPerson: "Support",
    phone: "",
    email: "",
    status: "active",
  },
  {
    id: "ven-007",
    name: "HDFC ERGO",
    category: "Insurance",
    contactPerson: "Agent",
    phone: "",
    email: "",
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
    name: "AWS",
    description: "Cloud infrastructure and hosting",
    status: "active",
  },
  {
    id: "cat-004",
    name: "Marketing",
    description: "Advertising and growth spend",
    status: "active",
  },
  {
    id: "cat-005",
    name: "Internet",
    description: "Internet and connectivity",
    status: "active",
  },
  {
    id: "cat-006",
    name: "Electricity",
    description: "Power and utilities",
    status: "active",
  },
  {
    id: "cat-007",
    name: "Insurance",
    description: "Business insurance premiums",
    status: "active",
  },
  {
    id: "cat-008",
    name: "Hosting",
    description: "Web hosting services",
    status: "active",
  },
  {
    id: "cat-009",
    name: "Domain",
    description: "Domain registrations",
    status: "active",
  },
  {
    id: "cat-010",
    name: "Google Workspace",
    description: "Productivity subscriptions",
    status: "active",
  },
  {
    id: "cat-011",
    name: "Office Maintenance",
    description: "Repairs and upkeep",
    status: "active",
  },
  {
    id: "cat-012",
    name: "Travel",
    description: "Business travel expenses",
    status: "active",
  },
  {
    id: "cat-013",
    name: "Professional Fees",
    description: "Consulting and legal fees",
    status: "active",
  },
  {
    id: "cat-014",
    name: "Other",
    description: "Miscellaneous expenses",
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
  { id: "pay-001", name: "Cash", slug: "cash", status: "active" },
  { id: "pay-002", name: "Bank Transfer", slug: "bank-transfer", status: "active" },
  { id: "pay-003", name: "UPI", slug: "upi", status: "active" },
  { id: "pay-004", name: "Cheque", slug: "cheque", status: "active" },
  { id: "pay-005", name: "Credit Card", slug: "credit-card", status: "active" },
  { id: "pay-006", name: "Debit Card", slug: "debit-card", status: "active" },
  { id: "pay-007", name: "Other", slug: "other", status: "active" },
];

export const seedSettingsDealTypes: SettingsDealType[] = [
  {
    id: "dtype-001",
    name: "Annual Maintenance",
    slug: "annual-maintenance",
    status: "active",
  },
  {
    id: "dtype-002",
    name: "Consulting",
    slug: "consulting",
    status: "active",
  },
  {
    id: "dtype-003",
    name: "Project",
    slug: "project",
    status: "active",
  },
  {
    id: "dtype-004",
    name: "Subscription",
    slug: "subscription",
    status: "active",
  },
];

/** Maps legacy expense category slugs to canonical App Config IDs. */
export const legacyCategoryIdMap: Record<string, string> = {
  salary: "cat-001",
  "office-rent": "cat-002",
  aws: "cat-003",
  marketing: "cat-004",
  internet: "cat-005",
  electricity: "cat-006",
  insurance: "cat-007",
  hosting: "cat-008",
  domain: "cat-009",
  "google-workspace": "cat-010",
  "office-maintenance": "cat-011",
  travel: "cat-012",
  "professional-fees": "cat-013",
  other: "cat-014",
};
