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
}

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
}

export type InvoiceTimelineAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'payment_recorded'
  | 'outstanding_updated'
  | 'status_changed'
  | 'renewal_updated';

export const INVOICE_TIMELINE_LABELS: Record<InvoiceTimelineAction, string> = {
  created: 'Invoice Created',
  updated: 'Invoice Updated',
  deleted: 'Invoice Deleted',
  payment_recorded: 'Payment Recorded',
  outstanding_updated: 'Outstanding Updated',
  status_changed: 'Status Changed',
  renewal_updated: 'Renewal Updated',
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
