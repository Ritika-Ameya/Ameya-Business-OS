import type { Payment } from "@/types/payment";

export const seedPayments: Payment[] = [
  {
    id: "pay-001",
    invoiceId: "inv-001",
    paymentDate: "2026-06-10",
    amount: 75000,
    mode: "bank-transfer",
    referenceNumber: "NEFT-884521",
    receivedBy: "Accounts Team",
    transactionId: "TXN-20260610-001",
    status: "received",
  },
  {
    id: "pay-002",
    invoiceId: "inv-001",
    paymentDate: "2026-06-14",
    amount: 50000,
    mode: "upi",
    referenceNumber: "UPI-992341",
    receivedBy: "Accounts Team",
    status: "received",
  },
  {
    id: "pay-003",
    invoiceId: "inv-002",
    paymentDate: "2026-06-25",
    amount: 30000,
    mode: "cheque",
    referenceNumber: "CHQ-445821",
    receivedBy: "Accounts Team",
    status: "received",
  },
];
