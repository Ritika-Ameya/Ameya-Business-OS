import type { BaseEntityDto } from "@/shared/api/types";
import type {
  InvoiceBillingType,
  InvoiceLineItem,
  InvoiceStatus,
} from "@/features/revenue/types/invoice";
import type { PaymentAccount, PaymentStatus } from "@/features/revenue/types/payment";

export interface InvoiceTimelineEntryDto {
  id: string;
  action?: string;
  stageName: string;
  notes?: string;
  timestamp: string;
}

export interface InvoiceDto extends BaseEntityDto {
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
  timeline: InvoiceTimelineEntryDto[];
  cancelledReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  nextActionDate?: string;
  billingType?: InvoiceBillingType;
  lineItems?: InvoiceLineItem[];
}

export interface PaymentDto extends BaseEntityDto {
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
  receivedAccount?: PaymentAccount | "";
}

export interface InvoiceDocumentDto extends BaseEntityDto {
  name: string;
  fileType: string;
  mimeType: string;
  size: number;
  driveFileId: string;
  entityType: string;
  entityId: string;
  uploadedBy: string;
}

export interface InvoiceCreateBody {
  customerId: string;
  customerName?: string;
  dealId: string;
  dealTitle?: string;
  status?: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxPercent?: number;
  tax?: number;
  total?: number;
  currency?: string;
  componentIds?: string[];
  notes?: string;
  nextActionDate?: string;
  invoiceNumber: string;
  billingType?: InvoiceBillingType;
}

export interface InvoiceUpdateBody extends Partial<InvoiceCreateBody> {
  /** Required by the server whenever `billingType` changes. */
  billingChangeReason?: string;
}

export interface PaymentCreateBody {
  paymentDate: string;
  amount: number;
  mode: string;
  referenceNumber?: string;
  receivedBy?: string;
  transactionId?: string;
  notes?: string;
  status?: PaymentStatus;
  currency?: string;
  receivedAccount?: PaymentAccount;
  /** Client paid only the base amount: the server turns the invoice into non-GST first. */
  removeGstReason?: string;
}
