import { apiRequest } from "@/shared/api/client";
import type { PaginatedData } from "@/shared/api/types";
import type {
  InvoiceCreateBody,
  InvoiceDocumentDto,
  InvoiceDto,
  PaymentCreateBody,
  PaymentDto,
} from "@/features/revenue/api/revenue.dto";
import type { InvoiceStatus } from "@/features/revenue/types/invoice";

const INVOICES_BASE = "/invoices";
const LIST_LIMIT = 200;

export const invoicesApi = {
  list: async (): Promise<InvoiceDto[]> => {
    const result = await apiRequest<PaginatedData<InvoiceDto>>(INVOICES_BASE, {
      params: { page: 1, limit: LIST_LIMIT, sort: "issueDate:desc" },
    });
    return result.items;
  },

  getById: (id: string) => apiRequest<InvoiceDto>(`${INVOICES_BASE}/${id}`),

  create: (body: InvoiceCreateBody) =>
    apiRequest<InvoiceDto>(INVOICES_BASE, { method: "POST", body }),

  update: (id: string, body: Partial<InvoiceCreateBody>) =>
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

  listPayments: (id: string) =>
    apiRequest<PaymentDto[]>(`${INVOICES_BASE}/${id}/payments`),

  addPayment: (id: string, body: PaymentCreateBody) =>
    apiRequest<{ payment: PaymentDto; invoice: InvoiceDto }>(
      `${INVOICES_BASE}/${id}/payments`,
      { method: "POST", body }
    ),

  removePayment: (id: string, paymentId: string) =>
    apiRequest<InvoiceDto>(`${INVOICES_BASE}/${id}/payments/${paymentId}`, {
      method: "DELETE",
    }),

  listFiles: (id: string) =>
    apiRequest<InvoiceDocumentDto[]>(`${INVOICES_BASE}/${id}/files`),

  addFile: (
    id: string,
    body: { name: string; fileType?: string; mimeType?: string; size?: number }
  ) =>
    apiRequest<{ document: InvoiceDocumentDto; invoice: InvoiceDto }>(
      `${INVOICES_BASE}/${id}/files`,
      { method: "POST", body }
    ),

  removeFile: (id: string, fileId: string) =>
    apiRequest<null>(`${INVOICES_BASE}/${id}/files/${fileId}`, { method: "DELETE" }),
};
