import { computeComponentTaxable } from "@/features/deals/utils/deal-component-utils";
import type { DealComponent } from "@/features/deals/types/deal-component";
import type {
  Invoice,
  InvoiceFilters,
  InvoiceLineItem,
  InvoiceNumberSort,
  InvoiceStatus,
} from "@/features/revenue/types/invoice";
import { formatCurrency } from "@/shared/utils/format-currency";

export { formatCurrency as formatInvoiceCurrency } from "@/shared/utils/format-currency";
export { formatDate as formatInvoiceDate } from "@/shared/utils/format-date";

/** Base and GST stay separate. The bracket is base plus GST. */
export function formatBaseWithGst(base: number, gstAmount: number): string {
  if (gstAmount <= 0.009) return formatCurrency(base);
  return `${formatCurrency(base)} + GST ${formatCurrency(gstAmount)} (Total ${formatCurrency(base + gstAmount)})`;
}

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

/**
 * One row per component. Saved invoice lines win. Older invoices use each
 * linked component's own base and GST, so a multi-component bill is not
 * only a combined total.
 */
export function billedComponentLines(
  invoice: Invoice,
  components: DealComponent[],
): InvoiceLineItem[] {
  if (invoice.lineItems.length > 0) return invoice.lineItems;

  const byId = new Map(components.map((component) => [component.id, component]));
  const linked = invoice.componentIds
    .map((id) => byId.get(id))
    .filter((component): component is DealComponent => Boolean(component));
  if (linked.length === 0) return [];

  const nonGst = invoice.billingType === "non_gst";
  return linked.map((component) => {
    const taxable = roundMoney(computeComponentTaxable(component));
    const gstPercent = nonGst ? 0 : Number(component.gstPercent) || invoice.gstPercent || 0;
    const gstAmount = nonGst ? 0 : roundMoney((taxable * gstPercent) / 100);
    return {
      componentId: component.id,
      name: component.name,
      taxable,
      gstPercent,
      gstAmount,
      total: roundMoney(taxable + gstAmount),
    };
  });
}

/** Paid amount equals the invoice's base (pre-GST) balance, i.e. the client skipped GST. */
export function isBaseOnlyPayment(invoice: Invoice, amount: number): boolean {
  if (invoice.billingType !== "gst" || invoice.tax <= 0.009) return false;
  if (!Number.isFinite(amount) || amount <= 0) return false;
  return Math.abs(invoice.received + amount - invoice.subtotal) <= 1;
}

export const defaultInvoiceFilters: InvoiceFilters = {
  status: "all",
  customer: "all",
  date: "all",
  billingType: "all",
};

export const invoiceBillingTypeLabels: Record<InvoiceFilters["billingType"], string> = {
  all: "GST & Non-GST",
  gst: "With GST",
  non_gst: "Without GST",
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
  switch (status.trim().toLowerCase()) {
    case "sent":
    case "overdue":
      return "due";
    case "partial":
      return "partially_paid";
    case "draft":
      return "draft";
    case "due":
      return "due";
    case "partially_paid":
      return "partially_paid";
    case "paid":
      return "paid";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "draft";
  }
}

export function effectiveInvoiceOutstanding(invoice: {
  status: string;
  outstanding: number;
}): number {
  const status = normalizeInvoiceStatus(invoice.status);
  if (status === "cancelled" || status === "draft" || status === "paid") {
    return 0;
  }
  return invoice.outstanding;
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

    const matchesBillingType =
      filters.billingType === "all" || invoice.billingType === filters.billingType;

    return (
      matchesSearch && matchesStatus && matchesCustomer && matchesDate && matchesBillingType
    );
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

/** Combine settings prefix with the user-entered remainder. */
export function composeInvoiceNumber(prefix: string, rest: string): string {
  const trimmedPrefix = prefix.trim();
  const trimmedRest = rest.trim();
  if (!trimmedRest) return "";
  if (!trimmedPrefix) return trimmedRest;
  if (trimmedRest.toUpperCase().startsWith(trimmedPrefix.toUpperCase())) {
    return trimmedRest;
  }
  if (/[-/]$/.test(trimmedPrefix) || /^[-/]/.test(trimmedRest)) {
    return `${trimmedPrefix}${trimmedRest}`;
  }
  return `${trimmedPrefix}-${trimmedRest}`;
}

export function splitInvoiceNumber(
  invoiceNumber: string,
  prefix: string
): { prefix: string; rest: string } {
  const trimmedPrefix = prefix.trim();
  const trimmedNumber = invoiceNumber.trim();
  if (
    trimmedPrefix &&
    trimmedNumber.toUpperCase().startsWith(trimmedPrefix.toUpperCase())
  ) {
    return {
      prefix: trimmedPrefix,
      rest: trimmedNumber.slice(trimmedPrefix.length).replace(/^[-/]/, ""),
    };
  }
  return { prefix: trimmedPrefix, rest: trimmedNumber };
}
