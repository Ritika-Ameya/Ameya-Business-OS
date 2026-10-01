import type { BaseEntity } from '../../../types';
import type {
  InvoiceStatus,
  InvoiceTimelineEntry,
  PaymentStatus,
} from '../../../types/entity.contracts';

export type {
  InvoiceStatus,
  InvoiceTimelineEntry,
  PaymentStatus,
} from '../../../types/entity.contracts';

export type RevenueEntityBase = BaseEntity & Record<string, unknown>;

export type InvoiceBillingType = 'gst' | 'non_gst';

/** What was billed for one component, frozen when the invoice is created. */
export interface InvoiceLineItem {
  componentId: string;
  name: string;
  taxable: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
}

export interface InvoiceEntity extends RevenueEntityBase {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  dealId: string;
  dealTitle: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxPercent: number;
  tax: number;
  total: number;
  currency: string;
  received: number;
  outstanding: number;
  componentIds: string[];
  notes: string;
  timeline: InvoiceTimelineEntry[];
  cancelledReason: string;
  cancelledAt: string;
  cancelledBy: string;
  /** Manual collection / invoice follow-up date (YYYY-MM-DD). */
  nextActionDate: string;
  billingType: InvoiceBillingType;
  /** Empty on invoices created before line items were stored. */
  lineItems: InvoiceLineItem[];
}

/** Which bank account the money landed in. */
export type PaymentAccount = 'gst' | 'other';

export interface PaymentEntity extends RevenueEntityBase {
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  paidAt: string;
  reference: string;
  receivedBy: string;
  transactionId: string;
  notes: string;
  /** Empty on payments recorded before the account was tracked. */
  receivedAccount: PaymentAccount | '';
}

export type InvoiceTimelineAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'payment_recorded'
  | 'outstanding_updated'
  | 'status_changed'
  | 'renewal_updated'
  | 'cancelled'
  | 'gst_removed'
  | 'gst_added';

export const INVOICE_TIMELINE_LABELS: Record<InvoiceTimelineAction, string> = {
  created: 'Invoice Created',
  updated: 'Invoice Updated',
  deleted: 'Invoice Deleted',
  payment_recorded: 'Payment Recorded',
  outstanding_updated: 'Outstanding Updated',
  status_changed: 'Status Changed',
  renewal_updated: 'Renewal Updated',
  cancelled: 'Invoice Cancelled',
  gst_removed: 'GST Removed',
  gst_added: 'GST Added',
};

export const INVOICE_SEARCH_FIELDS = [
  'invoiceNumber',
  'customerName',
  'dealTitle',
  'status',
  'notes',
] as const;

export type InvoiceSearchField = (typeof INVOICE_SEARCH_FIELDS)[number];
export type SearchMode = 'contains' | 'startsWith' | 'exact';
