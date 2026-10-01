export type InvoiceStatus =
  | "draft"
  | "due"
  | "partially_paid"
  | "paid"
  | "cancelled";

export interface InvoiceTimelineEntry {
  id: string;
  action?: string;
  stageName: string;
  notes?: string;
  timestamp: string;
}

export type InvoiceBillingType = "gst" | "non_gst";

export interface InvoiceLineItem {
  componentId: string;
  name: string;
  taxable: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  dealId: string;
  dealTitle: string;
  amount: number;
  received: number;
  outstanding: number;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  gstPercent: number;
  billingType: InvoiceBillingType;
  /** Amount before GST. */
  subtotal: number;
  tax: number;
  /** Empty on invoices created before billed lines were saved. */
  lineItems: InvoiceLineItem[];
  componentIds: string[];
  notes?: string;
  timeline?: InvoiceTimelineEntry[];
  cancelledReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  nextActionDate?: string;
}

export type InvoiceStatusFilter = "all" | InvoiceStatus;
export type InvoiceDateFilter = "all" | "this-month" | "last-month" | "overdue";
export type InvoiceNumberSort = "asc" | "desc";

export interface InvoiceFilters {
  status: InvoiceStatusFilter;
  customer: string;
  date: InvoiceDateFilter;
  billingType: "all" | InvoiceBillingType;
}

export interface GenerateInvoiceContext {
  customerId: string;
  customerName: string;
  /** When set, the deal field is locked. Omit it to let the user pick this customer's deal. */
  dealId?: string;
  dealTitle?: string;
  componentIds?: string[];
}
