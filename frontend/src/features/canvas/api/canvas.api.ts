import { apiRequest } from "@/shared/api/client";
import type { CanvasBoard, ReceiptSourceType } from "@/features/canvas/types/canvas";

const BASE = "/canvas";

export const canvasApi = {
  getBoard: () => apiRequest<CanvasBoard>(BASE),

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
  }) => apiRequest<CanvasBoard>(`${BASE}/receipts`, { method: "POST", body }),

  updateReceipt: (body: {
    cardId: string;
    expectedAmount?: number;
    expectedDate?: string;
    sourceType?: ReceiptSourceType;
    reason?: string;
    status?: "expected" | "received" | "cancelled";
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
};
