import type { Invoice, InvoiceFilters } from "@/features/revenue/types/invoice";

export { formatCurrency as formatInvoiceCurrency } from "@/shared/utils/format-currency";
export { formatDate as formatInvoiceDate } from "@/shared/utils/format-date";

export const defaultInvoiceFilters: InvoiceFilters = {
  status: "all",
  customer: "all",
  date: "all",
};

export const invoiceStatusLabels: Record<InvoiceFilters["status"], string> = {
  all: "All Status",
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  draft: "Draft",
  sent: "Sent",
};

export const invoiceDateLabels: Record<InvoiceFilters["date"], string> = {
  all: "All Dates",
  "this-month": "This Month",
  "last-month": "Last Month",
  overdue: "Overdue",
};

export const invoiceStatusStyles: Record<
  Exclude<InvoiceFilters["status"], "all">,
  string
> = {
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  partial: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
};

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
      [
        invoice.invoiceNo,
        invoice.customerName,
        invoice.dealTitle,
      ].some((field) => field.toLowerCase().includes(normalizedQuery));

    const matchesStatus =
      filters.status === "all" || invoice.status === filters.status;

    const matchesCustomer =
      filters.customer === "all" || invoice.customerId === filters.customer;

    const invoiceDate = new Date(invoice.invoiceDate);
    const matchesDate =
      filters.date === "all" ||
      (filters.date === "this-month" &&
        invoiceDate.getMonth() === now.getMonth() &&
        invoiceDate.getFullYear() === now.getFullYear()) ||
      (filters.date === "last-month" &&
        invoiceDate.getMonth() === (now.getMonth() + 11) % 12 &&
        invoiceDate.getFullYear() ===
          (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())) ||
      (filters.date === "overdue" && invoice.status === "overdue");

    return matchesSearch && matchesStatus && matchesCustomer && matchesDate;
  });
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

export function getInvoicesByDealId(invoices: Invoice[], dealId: string): Invoice[] {
  return invoices.filter((invoice) => invoice.dealId === dealId);
}

export function getUniqueCustomers(invoices: Invoice[]) {
  const map = new Map<string, string>();
  for (const invoice of invoices) {
    map.set(invoice.customerId, invoice.customerName);
  }
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}
