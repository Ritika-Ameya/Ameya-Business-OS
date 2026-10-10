import { API_BASE_URL, DEV_API_KEY } from "@/shared/api/config";
import { tokenStorage } from "@/features/auth/utils/token-storage";
import { apiRequest } from "@/shared/api/client";
import type { PaginatedData } from "@/shared/api/types";
import type {
  InvoiceCreateBody,
  InvoiceDocumentDto,
  InvoiceDto,
  InvoiceUpdateBody,
  PaymentCreateBody,
  PaymentDto,
} from "@/features/revenue/api/revenue.dto";
import type { InvoiceStatus } from "@/features/revenue/types/invoice";

const INVOICES_BASE = "/invoices";
const LIST_LIMIT = 200;

export const invoicesApi = {
  list: async (): Promise<InvoiceDto[]> => {
    const result = await apiRequest<PaginatedData<InvoiceDto>>(INVOICES_BASE, {
      params: { page: 1, limit: LIST_LIMIT, sort: "invoiceNumber:asc" },
    });
    return result.items;
  },

  getById: (id: string) => apiRequest<InvoiceDto>(`${INVOICES_BASE}/${id}`),

  create: (body: InvoiceCreateBody) =>
    apiRequest<InvoiceDto>(INVOICES_BASE, { method: "POST", body }),

  update: (id: string, body: InvoiceUpdateBody) =>
    apiRequest<InvoiceDto>(`${INVOICES_BASE}/${id}`, { method: "PUT", body }),

  remove: (id: string) =>
    apiRequest<null>(`${INVOICES_BASE}/${id}`, { method: "DELETE" }),

  restore: (id: string) =>
    apiRequest<InvoiceDto>(`${INVOICES_BASE}/${id}/restore`, { method: "POST" }),

  changeStatus: (id: string, status: InvoiceStatus) =>
    apiRequest<InvoiceDto>(`${INVOICES_BASE}/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),

  cancel: (id: string, reason: string) =>
    apiRequest<InvoiceDto>(`${INVOICES_BASE}/${id}/cancel`, {
      method: "POST",
      body: { reason },
    }),

  listPayments: (id: string) =>
    apiRequest<PaymentDto[]>(`${INVOICES_BASE}/${id}/payments`),

  /** One request for all payments (SPA revenue bootstrap). */
  listAllPayments: () => apiRequest<PaymentDto[]>(`${INVOICES_BASE}/payments`),

  addPayment: (id: string, body: PaymentCreateBody) =>
    apiRequest<{ payment: PaymentDto; invoice: InvoiceDto }>(
      `${INVOICES_BASE}/${id}/payments`,
      { method: "POST", body }
    ),

  removePayment: (id: string, paymentId: string) =>
    apiRequest<InvoiceDto>(`${INVOICES_BASE}/${id}/payments/${paymentId}`, {
      method: "DELETE",
    }),

  updatePayment: (id: string, paymentId: string, body: PaymentCreateBody) =>
    apiRequest<{ payment: PaymentDto; invoice: InvoiceDto }>(
      `${INVOICES_BASE}/${id}/payments/${paymentId}`,
      { method: "PUT", body }
    ),

  listAttachedIds: () => apiRequest<string[]>(`${INVOICES_BASE}/attachments`),

  listFiles: (id: string) =>
    apiRequest<InvoiceDocumentDto[]>(`${INVOICES_BASE}/${id}/files`),

  addFile: (
    id: string,
    body: {
      name: string;
      fileType?: string;
      mimeType?: string;
      size?: number;
      contentBase64: string;
    }
  ) =>
    apiRequest<{ document: InvoiceDocumentDto; invoice: InvoiceDto }>(
      `${INVOICES_BASE}/${id}/files`,
      { method: "POST", body }
    ),

  removeFile: (id: string, fileId: string) =>
    apiRequest<null>(`${INVOICES_BASE}/${id}/files/${fileId}`, { method: "DELETE" }),

  downloadFiles: async (invoiceIds: string[]): Promise<void> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = tokenStorage.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (DEV_API_KEY) headers["X-DEV-KEY"] = DEV_API_KEY;
    const response = await fetch(`${API_BASE_URL}${INVOICES_BASE}/export`, {
      method: "POST",
      headers,
      body: JSON.stringify({ invoiceIds }),
    });
    if (!response.ok) {
      let message = `Download failed (${response.status})`;
      try {
        const body = (await response.json()) as { message?: string };
        if (body.message) message = body.message;
      } catch {
        // The body is not JSON.
      }
      throw new Error(message);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download =
      /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") ?? "")?.[1] ??
      "invoices.zip";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  },
};
