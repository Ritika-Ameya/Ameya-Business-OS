import type { Invoice } from "@/features/revenue/types/invoice";
import type { Payment, PaymentFormData } from "@/features/revenue/types/payment";
import type {
  InvoiceCreateBody,
  InvoiceDto,
  PaymentCreateBody,
  PaymentDto,
} from "@/features/revenue/api/revenue.dto";

export function mapInvoiceFromDto(dto: InvoiceDto): Invoice {
  return {
    id: dto.id,
    invoiceNo: dto.invoiceNumber,
    customerId: dto.customerId,
    customerName: dto.customerName,
    dealId: dto.dealId,
    dealTitle: dto.dealTitle,
    amount: dto.total,
    received: dto.received,
    outstanding: dto.outstanding,
    invoiceDate: dto.issueDate,
    dueDate: dto.dueDate,
    status: dto.status,
    gstPercent: dto.taxPercent,
    componentIds: Array.isArray(dto.componentIds) ? dto.componentIds : [],
    notes: dto.notes || undefined,
    timeline: Array.isArray(dto.timeline)
      ? dto.timeline.map((entry) => ({
          id: entry.id,
          action: entry.action,
          stageName: entry.stageName,
          notes: entry.notes,
          timestamp: entry.timestamp,
        }))
      : [],
  };
}

export function mapPaymentFromDto(dto: PaymentDto): Payment {
  return {
    id: dto.id,
    invoiceId: dto.invoiceId,
    paymentDate: dto.paidAt,
    amount: dto.amount,
    mode: dto.method,
    referenceNumber: dto.reference || undefined,
    receivedBy: dto.receivedBy || undefined,
    transactionId: dto.transactionId || undefined,
    status: dto.status,
    notes: dto.notes || undefined,
  };
}

export function mapPaymentFormToBody(data: PaymentFormData): PaymentCreateBody {
  return {
    paymentDate: data.paymentDate,
    amount: Number.parseFloat(data.amount.replace(/,/g, "")) || 0,
    mode: data.mode,
    referenceNumber: data.referenceNumber.trim(),
    receivedBy: data.receivedBy.trim(),
    transactionId: data.transactionId.trim(),
    notes: data.notes.trim(),
    status: "received",
  };
}

export type { InvoiceCreateBody };
