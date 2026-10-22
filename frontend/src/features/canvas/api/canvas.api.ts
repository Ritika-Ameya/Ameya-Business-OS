import { apiRequest } from "@/shared/api/client";
import type {
  CanvasBoard,
  LeadTemperature,
  ReceiptSourceType,
} from "@/features/canvas/types/canvas";

const BASE = "/canvas";

export const canvasApi = {
  getBoard: () => apiRequest<CanvasBoard>(BASE),

  listCustomerReceiptPayments: (customerId: string) =>
    apiRequest<
      Array<{
        receiptId: string;
        index: number;
        customerId: string;
        dealId: string;
        dealTitle: string;
        componentId: string;
        reason: string;
        paymentDate: string;
        amount: number;
        mode: string;
        tdsAmount: number;
        tdsSettles: boolean;
        status: "received";
      }>
    >(`${BASE}/customers/${customerId}/receipt-payments`),

  removeReceiptPayment: (receiptId: string, index: number) =>
    apiRequest<{ removed: boolean }>(`${BASE}/receipts/${receiptId}/payments/${index}`, {
      method: "DELETE",
    }),

  listDealForecasts: (dealId: string) =>
    apiRequest<
      Array<{
        id: string;
        reason: string;
        expectedAmount: number;
        expectedDate: string;
        sourceType: ReceiptSourceType;
      }>
    >(`${BASE}/deals/${dealId}/forecasts`),

  setTemperature: (customerId: string, temperature: "hot" | "warm" | "cold" | "") =>
    apiRequest<CanvasBoard>(`${BASE}/temperatures/${customerId}`, {
      method: "PUT",
      body: { temperature },
    }),

  schedule: (cardId: string, monthKey: string) =>
    apiRequest<CanvasBoard>(`${BASE}/receipts/schedule`, {
      method: "POST",
      body: { cardId, monthKey },
    }),

  createReceipt: (body: {
    customerId: string;
    expectedAmount: number;
    expectedDate: string;
    sourceType: ReceiptSourceType;
    reason: string;
    dealId?: string;
    componentId?: string;
    gstPercent?: 0 | 18;
  }) => apiRequest<CanvasBoard>(`${BASE}/receipts`, { method: "POST", body }),

  updateReceipt: (body: {
    cardId: string;
    expectedAmount?: number;
    expectedDate?: string;
    sourceType?: ReceiptSourceType;
    reason?: string;
    status?: "expected" | "received" | "cancelled";
    gstPercent?: 0 | 18;
  }) => apiRequest<CanvasBoard>(`${BASE}/receipts`, { method: "PATCH", body }),

  dismiss: (cardId: string) =>
    apiRequest<CanvasBoard>(`${BASE}/receipts/dismiss`, {
      method: "POST",
      body: { cardId },
    }),

  split: (body: {
    invoiceId: string;
    parts: Array<{ expectedAmount: number; expectedDate: string; reason?: string }>;
  }) => apiRequest<CanvasBoard>(`${BASE}/receipts/split`, { method: "POST", body }),

  markPaid: (body: {
    cardId: string;
    invoiceId?: string;
    amount: number;
    paymentDate: string;
    mode: string;
    referenceNumber?: string;
    notes?: string;
    removeGstReason?: string;
    receivedAccount?: "gst" | "other";
    tdsAmount?: number;
    tdsSettles?: boolean;
  }) => apiRequest<CanvasBoard>(`${BASE}/receipts/mark-paid`, { method: "POST", body }),

  getLeadTemperature: (customerId: string) =>
    apiRequest<{ customerId: string; temperature: LeadTemperature }>(
      `${BASE}/lead-temperatures/${customerId}`
    ),

  setLeadTemperature: (customerId: string, temperature: LeadTemperature) =>
    apiRequest<{ customerId: string; temperature: LeadTemperature }>(
      `${BASE}/lead-temperatures/${customerId}`,
      { method: "PUT", body: { temperature } }
    ),
};
