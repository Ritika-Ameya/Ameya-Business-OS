export type ExpenseFrequency =
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly"
  | "one-time";

export type ExpenseMasterStatus = "active" | "inactive";

export type ExpenseTransactionStatus = "paid" | "pending" | "partial" | "cancelled";

export type PaymentMethod = string;

export type PayeeType = "vendor" | "employee";

export type DatePreset =
  | "all"
  | "today"
  | "this-week"
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "this-year"
  | "custom";

export interface ExpenseCategoryItem {
  id: string;
  name: string;
  isCustom?: boolean;
}

export interface VendorItem {
  id: string;
  name: string;
}

export interface EmployeeItem {
  id: string;
  name: string;
}

export interface ExpenseMasterTemplate {
  id: string;
  name: string;
  categoryId: string;
  vendorOrEmployee: string;
  payeeType: PayeeType;
  vendorId?: string;
  employeeId?: string;
  defaultAmount: number;
  frequency: ExpenseFrequency;
  startDate: string;
  endDate?: string;
  autoGenerate: boolean;
  status: ExpenseMasterStatus;
}

export interface ExpenseTransaction {
  id: string;
  date: string;
  categoryId: string;
  name: string;
  vendorOrEmployee: string;
  payeeType: PayeeType;
  vendorId?: string;
  employeeId?: string;
  amount: number;
  status: ExpenseTransactionStatus;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  hasAttachment: boolean;
  recurring: boolean;
  masterTemplateId?: string;
  generatedPeriod?: string;
}

export interface ExpenseTransactionFormData {
  date: string;
  categoryId: string;
  name: string;
  payeeType: PayeeType;
  vendorOrEmployee: string;
  vendorId?: string;
  employeeId?: string;
  amount: string;
  status: ExpenseTransactionStatus;
  paymentMethod: PaymentMethod | "";
  referenceNumber: string;
  notes: string;
  hasAttachment: boolean;
  recurring: boolean;
  createMaster?: boolean;
  masterFrequency?: ExpenseFrequency | "";
  masterAutoGenerate?: boolean;
}

export interface ExpenseMasterFormData {
  name: string;
  categoryId: string;
  payeeType: PayeeType;
  vendorOrEmployee: string;
  vendorId?: string;
  employeeId?: string;
  defaultAmount: string;
  frequency: ExpenseFrequency | "";
  startDate: string;
  endDate: string;
  autoGenerate: boolean;
  status: ExpenseMasterStatus;
}

export interface ExpenseRegisterFilters {
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
  category: string;
  status: ExpenseTransactionStatus | "all";
  vendor: string;
  employee: string;
  paymentMethod: PaymentMethod | "all";
}

export interface ExpenseMasterFilters {
  category: string;
  status: ExpenseMasterStatus | "all";
  frequency: ExpenseFrequency | "all";
}
