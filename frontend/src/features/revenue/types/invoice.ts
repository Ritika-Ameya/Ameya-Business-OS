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
  componentIds: string[];
  notes?: string;
  timeline?: InvoiceTimelineEntry[];
  cancelledReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export type InvoiceStatusFilter = "all" | InvoiceStatus;
export type InvoiceDateFilter = "all" | "this-month" | "last-month" | "overdue";
export type InvoiceNumberSort = "asc" | "desc";

export interface InvoiceFilters {
  status: InvoiceStatusFilter;
  customer: string;
  date: InvoiceDateFilter;
}

export interface GenerateInvoiceContext {
  customerId: string;
  customerName: string;
  dealId: string;
  dealTitle: string;
  componentIds?: string[];
}
