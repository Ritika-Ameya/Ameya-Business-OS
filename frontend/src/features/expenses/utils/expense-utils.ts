import type {
  DatePreset,
  ExpenseCategoryItem,
  ExpenseMasterFilters,
  ExpenseMasterFormData,
  ExpenseMasterTemplate,
  ExpenseRegisterFilters,
  ExpenseTransaction,
  ExpenseTransactionFormData,
  ExpenseTransactionStatus,
} from "@/features/expenses/types/expense";

export const frequencyLabels = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  "half-yearly": "Half-Yearly",
  yearly: "Yearly",
  "one-time": "One Time",
} as const;

export const transactionStatusLabels: Record<ExpenseTransactionStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  partial: "Partial",
  cancelled: "Cancelled",
};

export const datePresetLabels: Record<DatePreset, string> = {
  all: "All Time",
  today: "Today",
  "this-week": "This Week",
  "this-month": "This Month",
  "last-month": "Last Month",
  "this-quarter": "This Quarter",
  "this-year": "This Year",
  custom: "Custom Range",
};

export const defaultRegisterFilters = (): ExpenseRegisterFilters => ({
  datePreset: "this-month",
  dateFrom: "",
  dateTo: "",
  category: "all",
  status: "all",
  vendor: "all",
  employee: "all",
  paymentMethod: "all",
});

export const defaultMasterFilters: ExpenseMasterFilters = {
  category: "all",
  status: "all",
  frequency: "all",
};

export { formatCurrency as formatExpenseCurrency } from "@/shared/utils/format-currency";
export { formatDate as formatExpenseDate } from "@/shared/utils/format-date";

export function getCategoryName(
  categories: ExpenseCategoryItem[],
  categoryId: string
): string {
  return categories.find((category) => category.id === categoryId)?.name ?? categoryId;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function getDateRangeForPreset(
  preset: DatePreset,
  customFrom?: string,
  customTo?: string
): { from: Date | null; to: Date | null } {
  const now = new Date();

  if (preset === "all") return { from: null, to: null };

  if (preset === "custom") {
    return {
      from: customFrom ? startOfDay(new Date(customFrom)) : null,
      to: customTo ? endOfDay(new Date(customTo)) : null,
    };
  }

  if (preset === "today") {
    return { from: startOfDay(now), to: endOfDay(now) };
  }

  if (preset === "this-week") {
    const from = new Date(now);
    from.setDate(now.getDate() - now.getDay());
    return { from: startOfDay(from), to: endOfDay(now) };
  }

  if (preset === "this-month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: startOfDay(from), to: endOfDay(to) };
  }

  if (preset === "last-month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: startOfDay(from), to: endOfDay(to) };
  }

  if (preset === "this-quarter") {
    const quarter = Math.floor(now.getMonth() / 3);
    const from = new Date(now.getFullYear(), quarter * 3, 1);
    const to = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    return { from: startOfDay(from), to: endOfDay(to) };
  }

  const from = new Date(now.getFullYear(), 0, 1);
  const to = new Date(now.getFullYear(), 11, 31);
  return { from: startOfDay(from), to: endOfDay(to) };
}

export function filterTransactions(
  transactions: ExpenseTransaction[],
  query: string,
  filters: ExpenseRegisterFilters
): ExpenseTransaction[] {
  const normalizedQuery = query.trim().toLowerCase();
  const { from, to } = getDateRangeForPreset(
    filters.datePreset,
    filters.dateFrom,
    filters.dateTo
  );

  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    const matchesDate =
      (!from || transactionDate >= from) && (!to || transactionDate <= to);

    const matchesSearch =
      normalizedQuery.length === 0 ||
      [
        transaction.name,
        transaction.vendorOrEmployee,
        transaction.referenceNumber ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    const matchesCategory =
      filters.category === "all" || transaction.categoryId === filters.category;

    const matchesStatus =
      filters.status === "all" || transaction.status === filters.status;

    const matchesVendor =
      filters.vendor === "all" ||
      transaction.vendorId === filters.vendor ||
      transaction.vendorOrEmployee === filters.vendor;

    const matchesEmployee =
      filters.employee === "all" ||
      transaction.employeeId === filters.employee ||
      transaction.vendorOrEmployee === filters.employee;

    const matchesPayment =
      filters.paymentMethod === "all" ||
      transaction.paymentMethod === filters.paymentMethod;

    return (
      matchesDate &&
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesVendor &&
      matchesEmployee &&
      matchesPayment
    );
  });
}

export function filterMasters(
  masters: ExpenseMasterTemplate[],
  query: string,
  filters: ExpenseMasterFilters
): ExpenseMasterTemplate[] {
  const normalizedQuery = query.trim().toLowerCase();

  return masters.filter((master) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      [master.name, master.vendorOrEmployee]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    const matchesCategory =
      filters.category === "all" || master.categoryId === filters.category;

    const matchesStatus =
      filters.status === "all" || master.status === filters.status;

    const matchesFrequency =
      filters.frequency === "all" || master.frequency === filters.frequency;

    return matchesSearch && matchesCategory && matchesStatus && matchesFrequency;
  });
}

export interface RegisterStats {
  totalExpense: number;
  paid: number;
  pending: number;
  upcomingRecurring: number;
}

export function computeRegisterStats(
  transactions: ExpenseTransaction[],
  masters: ExpenseMasterTemplate[]
): RegisterStats {
  const totalExpense = transactions.reduce((sum, txn) => sum + txn.amount, 0);
  const paid = transactions
    .filter((txn) => txn.status === "paid")
    .reduce((sum, txn) => sum + txn.amount, 0);
  const pending = transactions
    .filter((txn) => txn.status === "pending" || txn.status === "partial")
    .reduce((sum, txn) => sum + txn.amount, 0);

  const upcomingRecurring = masters
    .filter((master) => master.status === "active" && master.autoGenerate)
    .reduce((sum, master) => sum + master.defaultAmount, 0);

  return { totalExpense, paid, pending, upcomingRecurring };
}

export function formatPeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function periodToDate(period: string, startDate: string): string {
  const [year, month] = period.split("-").map(Number);
  const start = new Date(startDate);
  const day = start.getDate();
  const maxDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(day, maxDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

export function isPeriodDue(
  master: ExpenseMasterTemplate,
  period: string
): boolean {
  const [year, month] = period.split("-").map(Number);
  const periodDate = new Date(year, month - 1, 1);
  const start = startOfDay(new Date(master.startDate));

  if (periodDate < new Date(start.getFullYear(), start.getMonth(), 1)) return false;

  if (master.endDate) {
    const end = endOfDay(new Date(master.endDate));
    if (periodDate > end) return false;
  }

  const diff = monthsBetween(start, periodDate);

  switch (master.frequency) {
    case "monthly":
      return diff >= 0;
    case "quarterly":
      return diff >= 0 && diff % 3 === 0;
    case "half-yearly":
      return diff >= 0 && diff % 6 === 0;
    case "yearly":
      return diff >= 0 && diff % 12 === 0;
    case "one-time":
      return diff === 0 && period === formatPeriod(start);
    default:
      return false;
  }
}

export function getDuePeriods(
  master: ExpenseMasterTemplate,
  upTo: Date = new Date()
): string[] {
  const periods: string[] = [];
  const start = new Date(master.startDate);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const limit = new Date(upTo.getFullYear(), upTo.getMonth(), 1);

  while (cursor <= limit) {
    const period = formatPeriod(cursor);
    if (isPeriodDue(master, period)) {
      periods.push(period);
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (master.frequency === "one-time") {
    return periods.slice(0, 1);
  }

  return periods;
}

export function generateRecurringTransactions(
  masters: ExpenseMasterTemplate[],
  transactions: ExpenseTransaction[]
): ExpenseTransaction[] {
  const now = new Date();
  const generated: ExpenseTransaction[] = [];

  for (const master of masters) {
    if (master.status !== "active" || !master.autoGenerate) continue;

    const duePeriods = getDuePeriods(master, now);

    for (const period of duePeriods) {
      const exists = transactions.some(
        (txn) =>
          txn.masterTemplateId === master.id && txn.generatedPeriod === period
      );
      if (exists) continue;

      generated.push({
        id: `txn-${crypto.randomUUID().slice(0, 8)}`,
        date: periodToDate(period, master.startDate),
        categoryId: master.categoryId,
        name: master.name,
        vendorOrEmployee: master.vendorOrEmployee,
        payeeType: master.payeeType,
        vendorId: master.vendorId,
        employeeId: master.employeeId,
        amount: master.defaultAmount,
        status: "pending",
        hasAttachment: false,
        recurring: true,
        masterTemplateId: master.id,
        generatedPeriod: period,
      });
    }
  }

  return generated;
}

export function validateTransactionForm(
  data: ExpenseTransactionFormData
): Partial<Record<keyof ExpenseTransactionFormData, string>> {
  const errors: Partial<Record<keyof ExpenseTransactionFormData, string>> = {};

  if (!data.date) errors.date = "Expense date is required";
  if (!data.categoryId) errors.categoryId = "Category is required";
  if (!data.name.trim()) errors.name = "Expense name is required";
  if (!data.vendorOrEmployee.trim()) {
    errors.vendorOrEmployee = "Vendor or employee is required";
  }
  if (!data.amount.trim()) {
    errors.amount = "Amount is required";
  } else if (
    Number.isNaN(Number.parseFloat(data.amount)) ||
    Number.parseFloat(data.amount) <= 0
  ) {
    errors.amount = "Enter a valid amount";
  }

  return errors;
}

export function validateMasterForm(
  data: ExpenseMasterFormData
): Partial<Record<keyof ExpenseMasterFormData, string>> {
  const errors: Partial<Record<keyof ExpenseMasterFormData, string>> = {};

  if (!data.name.trim()) errors.name = "Template name is required";
  if (!data.categoryId) errors.categoryId = "Category is required";
  if (!data.defaultAmount.trim()) {
    errors.defaultAmount = "Amount is required";
  } else if (parseAmount(data.defaultAmount) <= 0) {
    errors.defaultAmount = "Enter a valid amount";
  }
  if (!data.startDate) errors.startDate = "Start date is required";
  if (!data.frequency) errors.frequency = "Frequency is required";

  const hasPayee =
    data.vendorOrEmployee.trim() ||
    (data.payeeType === "employee" ? data.employeeId : data.vendorId);
  if (!hasPayee) {
    errors.vendorOrEmployee = "Select or create a payee";
  }

  return errors;
}

export function parseAmount(value: string): number {
  return Number.parseFloat(value.replace(/,/g, ""));
}
