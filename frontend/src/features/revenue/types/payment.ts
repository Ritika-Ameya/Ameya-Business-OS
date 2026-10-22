export type PaymentStatus = "received" | "pending" | "failed";

export type PaymentMode = string;

/** Which bank account the money landed in. */
export type PaymentAccount = "gst" | "other";

export const PAYMENT_ACCOUNT_LABELS: Record<PaymentAccount, string> = {
  gst: "GST account",
  other: "Other account",
};

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
  /** Missing on payments recorded before the account was tracked. */
  receivedAccount?: PaymentAccount;
  /** Tax the client deducted. It is not the cash that reached the bank. */
  tdsAmount?: number;
  /** When true, this TDS was counted toward the bill. */
  tdsSettles?: boolean;
}

export interface PaymentFormData {
  paymentDate: string;
  amount: string;
  mode: PaymentMode;
  referenceNumber: string;
  receivedBy: string;
  transactionId: string;
  notes: string;
  receivedAccount: PaymentAccount;
  tdsAmount: string;
  tdsSettles: boolean;
}
