import type { DealComponent } from "@/features/deals/types/deal-component";
import type { FinanceSettings } from "@/features/settings/types/settings";
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

export function getComponentLineTotal(component: DealComponent): number {
  const quantity = component.quantity ?? 1;
  const unitPrice = component.amount;
  const subtotal = unitPrice * quantity;
  const discount = component.discount ?? 0;
  return subtotal - (subtotal * discount) / 100;
}

export interface InvoiceSummary {
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  gstPercent: number;
}

export function calculateInvoiceSummary(
  components: DealComponent[],
  componentIds: string[],
  gstPercent: number
): InvoiceSummary {
  const selected = components.filter((component) => componentIds.includes(component.id));
  const subtotal = selected.reduce((sum, component) => sum + getComponentLineTotal(component), 0);
  const gstAmount = (subtotal * gstPercent) / 100;
  const grandTotal = subtotal + gstAmount;

  return { subtotal, gstAmount, grandTotal, gstPercent };
}

export function generateInvoiceNumber(finance: FinanceSettings): string {
  const year = new Date().getFullYear();
  const sequence = finance.nextInvoiceNumber.padStart(3, "0");
  return `${finance.invoicePrefix}-${year}-${sequence}`;
}

export function getNextInvoiceNumberValue(current: string): string {
  const parsed = Number.parseInt(current, 10);
  return String(Number.isNaN(parsed) ? 1 : parsed + 1);
}

export function deriveInvoiceStatus(
  amount: number,
  received: number,
  dueDate: string,
  currentStatus?: Invoice["status"]
): Invoice["status"] {
  if (currentStatus === "draft" && received === 0) return "draft";
  if (received >= amount) return "paid";
  if (received > 0) {
    const overdue = getDaysOverdueForInvoice(dueDate) > 0;
    return overdue ? "overdue" : "partial";
  }
  const overdue = getDaysOverdueForInvoice(dueDate) > 0;
  if (overdue) return "overdue";
  return currentStatus === "draft" ? "sent" : currentStatus ?? "sent";
}

function getDaysOverdueForInvoice(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
}

export interface CreateInvoiceInput {
  customerId: string;
  customerName: string;
  dealId: string;
  dealTitle: string;
  componentIds: string[];
  invoiceDate: string;
  dueDate: string;
  gstPercent: number;
  notes?: string;
}

export function buildInvoiceFromInput(
  input: CreateInvoiceInput,
  components: DealComponent[],
  finance: FinanceSettings
): Invoice {
  const summary = calculateInvoiceSummary(components, input.componentIds, input.gstPercent);

  return {
    id: `inv-${crypto.randomUUID().slice(0, 8)}`,
    invoiceNo: generateInvoiceNumber(finance),
    customerId: input.customerId,
    customerName: input.customerName,
    dealId: input.dealId,
    dealTitle: input.dealTitle,
    amount: summary.grandTotal,
    received: 0,
    outstanding: summary.grandTotal,
    invoiceDate: input.invoiceDate,
    dueDate: input.dueDate,
    status: "sent",
    gstPercent: input.gstPercent,
    componentIds: input.componentIds,
    notes: input.notes,
  };
}

export function getUniqueCustomers(invoices: Invoice[]) {
  const map = new Map<string, string>();
  for (const invoice of invoices) {
    map.set(invoice.customerId, invoice.customerName);
  }
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}
