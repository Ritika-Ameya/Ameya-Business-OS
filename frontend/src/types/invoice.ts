export type InvoiceStatus = "paid" | "partial" | "overdue" | "draft" | "sent";

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
}

export type InvoiceStatusFilter = "all" | InvoiceStatus;
export type InvoiceDateFilter = "all" | "this-month" | "last-month" | "overdue";

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
}
