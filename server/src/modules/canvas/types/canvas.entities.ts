import type { BaseEntity } from '../../../types';

export type CanvasEntityBase = BaseEntity & Record<string, unknown>;

export type ReceiptOrigin = 'override' | 'manual' | 'installment' | 'dismissed';

export type ReceiptSourceType =
  | 'invoice_balance'
  | 'invoice_installment'
  | 'renewal'
  | 'license'
  | 'subscription'
  | 'deal_advance'
  | 'deal_expected'
  | 'opportunity_conversion'
  | 'other';

export type ReceiptSourceRefType = 'invoice' | 'component' | 'deal' | 'customer' | '';

export type ReceiptStoredStatus = 'expected' | 'received' | 'cancelled' | 'superseded';

export type LeadTemperatureValue = 'hot' | 'warm' | 'cold';

export interface ExpectedReceiptEntity extends CanvasEntityBase {
  origin: ReceiptOrigin;
  sourceType: ReceiptSourceType;
  sourceRefType: ReceiptSourceRefType;
  sourceRefId: string;
  customerId: string;
  dealId: string;
  invoiceId: string;
  componentId: string;
  installmentIndex: number;
  expectedAmount: number;
  currency: string;
  expectedDate: string;
  reason: string;
  status: ReceiptStoredStatus;
}

export interface LeadTemperatureEntity extends CanvasEntityBase {
  customerId: string;
  temperature: LeadTemperatureValue;
}

export type CanvasRowKey = 'unclassified' | 'hot' | 'warm' | 'cold' | 'customer';

export type CanvasDisplayStatus = 'expected' | 'overdue' | 'received' | 'cancelled' | 'superseded';

export interface CanvasCard {
  id: string;
  persistedId: string | null;
  kind: 'receipt' | 'account';
  customerId: string;
  companyName: string;
  recordType: 'opportunity' | 'customer';
  temperature: LeadTemperatureValue | '';
  rowKey: CanvasRowKey;
  monthKey: string;
  expectedAmount: number | null;
  amountExGst: number | null;
  gstAmount: number | null;
  gstPercent: number | null;
  expectedDate: string;
  sourceType: ReceiptSourceType | '';
  reason: string;
  dealId: string;
  dealTitle: string;
  invoiceId: string;
  invoiceNumber: string;
  componentId: string;
  status: CanvasDisplayStatus;
  liveBalance: number | null;
  amountOverridden: boolean;
  origin: ReceiptOrigin | 'suggestion' | 'account';
  installmentIndex: number;
  currency: string;
}

export interface CanvasAccountOption {
  id: string;
  companyName: string;
  recordType: 'opportunity' | 'customer';
  temperature: LeadTemperatureValue | '';
}

export interface CanvasDealOption {
  id: string;
  title: string;
  customerId: string;
  probability: number;
  contractValue: number;
  expectedCloseDate: string;
}

export type CanvasRenewalStatus = 'overdue' | 'this_month' | 'next_month' | 'later';

export interface CanvasRenewalReminder {
  id: string;
  componentId: string;
  componentName: string;
  customerId: string;
  companyName: string;
  dealId: string;
  dealTitle: string;
  renewalDate: string;
  renewalFrequency: string;
  lastRenewedDate: string;
  amount: number;
  status: CanvasRenewalStatus;
  /** Open invoice already raised for this renewal cycle, if any. */
  invoiceId: string;
  invoiceNumber: string;
}

export interface CanvasPaidEntry {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  companyName: string;
  amount: number;
  paidAt: string;
}

export interface CanvasBoardPayload {
  today: string;
  dragHint: string;
  cards: CanvasCard[];
  accounts: CanvasAccountOption[];
  deals: CanvasDealOption[];
  renewals: CanvasRenewalReminder[];
  paid: CanvasPaidEntry[];
}
