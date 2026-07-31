import type {
  Invoice,
  InvoiceFilters,
  InvoiceNumberSort,
  InvoiceStatus,
} from "@/features/revenue/types/invoice";

export { formatCurrency as formatInvoiceCurrency } from "@/shared/utils/format-currency";
export { formatDate as formatInvoiceDate } from "@/shared/utils/format-date";

export const defaultInvoiceFilters: InvoiceFilters = {
  status: "all",
  customer: "all",
  date: "all",
};

export const invoiceStatusLabels: Record<InvoiceFilters["status"], string> = {
  all: "All Status",
  draft: "Draft",
  due: "Due",
  partially_paid: "Partially Paid",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const invoiceDateLabels: Record<InvoiceFilters["date"], string> = {
  all: "All Dates",
  "this-month": "This Month",
  "last-month": "Last Month",
  overdue: "Overdue",
};

export const invoiceStatusStyles: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  partially_paid: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  due: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  draft: "bg-muted text-muted-foreground",
  cancelled: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export function normalizeInvoiceStatus(status: string): InvoiceStatus {
  switch (status) {
    case "sent":
    case "overdue":
      return "due";
    case "partial":
      return "partially_paid";
    case "draft":
    case "due":
    case "partially_paid":
    case "paid":
    case "cancelled":
      return status;
    default:
      return "draft";
  }
}

export function filterInvoices(
  invoices: Invoice[],
  query: string,
  filters: InvoiceFilters
): Invoice[] {
  const normalizedQuery = query.trim().toLowerCase();
  const now = new Date();

  return invoices.filter((invoice) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      [invoice.invoiceNo, invoice.customerName, invoice.dealTitle].some((field) =>
        field.toLowerCase().includes(normalizedQuery)
      );

    const matchesStatus =
      filters.status === "all" || invoice.status === filters.status;

    const matchesCustomer =
      filters.customer === "all" || invoice.customerId === filters.customer;

    const invoiceDate = new Date(invoice.invoiceDate);
    const due = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const isPastDue =
      Boolean(invoice.dueDate) &&
      due < today &&
      invoice.outstanding > 0 &&
      invoice.status !== "cancelled" &&
      invoice.status !== "paid";

    const matchesDate =
      filters.date === "all" ||
      (filters.date === "this-month" &&
        invoiceDate.getMonth() === now.getMonth() &&
        invoiceDate.getFullYear() === now.getFullYear()) ||
      (filters.date === "last-month" &&
        invoiceDate.getMonth() === (now.getMonth() + 11) % 12 &&
        invoiceDate.getFullYear() ===
          (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())) ||
      (filters.date === "overdue" && isPastDue);

    return matchesSearch && matchesStatus && matchesCustomer && matchesDate;
  });
}

export function sortInvoicesByNumber(
  invoices: Invoice[],
  direction: InvoiceNumberSort
): Invoice[] {
  const sorted = [...invoices].sort((a, b) =>
    a.invoiceNo.localeCompare(b.invoiceNo, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
  return direction === "asc" ? sorted : sorted.reverse();
}

export function getInvoiceById(
  invoices: Invoice[],
  id: string
): Invoice | undefined {
  return invoices.find((invoice) => invoice.id === id);
}

export function getInvoicesByCustomerId(
  invoices: Invoice[],
  customerId: string
): Invoice[] {
  return invoices.filter((invoice) => invoice.customerId === customerId);
}

export function getUniqueCustomers(invoices: Invoice[]) {
  const map = new Map<string, { id: string; name: string }>();
  for (const invoice of invoices) {
    if (!map.has(invoice.customerId)) {
      map.set(invoice.customerId, {
        id: invoice.customerId,
        name: invoice.customerName,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getInvoiceStats(invoices: Invoice[]) {
  const total = invoices.length;
  const paid = invoices.filter((invoice) => invoice.status === "paid").length;
  const partiallyPaid = invoices.filter(
    (invoice) => invoice.status === "partially_paid"
  ).length;
  const due = invoices.filter((invoice) => invoice.status === "due").length;
  const outstanding = invoices.reduce(
    (sum, invoice) => sum + (invoice.status === "cancelled" ? 0 : invoice.outstanding),
    0
  );

  return { total, paid, partiallyPaid, due, outstanding };
}
