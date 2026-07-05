export type PaymentStatus = "received" | "pending" | "failed";

export type PaymentMode = string;

export interface Payment {
  id: string;
  invoiceId: string;
  paymentDate: string;
  amount: number;
  mode: PaymentMode;
  referenceNumber?: string;
  receivedBy?: string;
  transactionId?: string;
  status: PaymentStatus;
  notes?: string;
}

export interface PaymentFormData {
  paymentDate: string;
  amount: string;
  mode: PaymentMode;
  referenceNumber: string;
  receivedBy: string;
  transactionId: string;
  notes: string;
}
