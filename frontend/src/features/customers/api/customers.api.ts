import { apiRequest } from "@/shared/api/client";
import type { PaginatedData } from "@/shared/api/types";
import type {
  CustomerCreateBody,
  CustomerDocumentDto,
  CustomerDto,
  CustomerStageChangeBody,
} from "@/features/customers/api/customer.dto";
import type { RecordType } from "@/features/customers/types/customer";

const CUSTOMERS_BASE = "/customers";
const LIST_LIMIT = 200;

export const customersApi = {
  list: async (): Promise<CustomerDto[]> => {
    const result = await apiRequest<PaginatedData<CustomerDto>>(CUSTOMERS_BASE, {
      params: { page: 1, limit: LIST_LIMIT, sort: "createdAt:desc" },
    });
    return result.items;
  },

  getById: (id: string) => apiRequest<CustomerDto>(`${CUSTOMERS_BASE}/${id}`),

  create: (body: CustomerCreateBody) =>
    apiRequest<CustomerDto>(CUSTOMERS_BASE, { method: "POST", body }),

  update: (id: string, body: Partial<CustomerCreateBody>) =>
    apiRequest<CustomerDto>(`${CUSTOMERS_BASE}/${id}`, { method: "PUT", body }),

  remove: (id: string) =>
    apiRequest<null>(`${CUSTOMERS_BASE}/${id}`, { method: "DELETE" }),

  restore: (id: string) =>
    apiRequest<CustomerDto>(`${CUSTOMERS_BASE}/${id}/restore`, { method: "POST" }),

  changeStage: (id: string, body: CustomerStageChangeBody) =>
    apiRequest<CustomerDto>(`${CUSTOMERS_BASE}/${id}/stage`, {
      method: "PATCH",
      body,
    }),

  changeRecordType: (id: string, recordType: RecordType) =>
    apiRequest<CustomerDto>(`${CUSTOMERS_BASE}/${id}/record-type`, {
      method: "PATCH",
      body: { recordType },
    }),

  getTimeline: (id: string) =>
    apiRequest<CustomerDto["timeline"]>(`${CUSTOMERS_BASE}/${id}/timeline`),

  addTimelineNote: (id: string, body: { notes: string; nextActionDate?: string }) =>
    apiRequest<CustomerDto>(`${CUSTOMERS_BASE}/${id}/timeline`, {
      method: "POST",
      body,
    }),

  listFiles: (id: string) =>
    apiRequest<CustomerDocumentDto[]>(`${CUSTOMERS_BASE}/${id}/files`),

  addFile: (id: string, body: { name: string; fileType?: string; mimeType?: string; size?: number }) =>
    apiRequest<{ document: CustomerDocumentDto; customer: CustomerDto }>(
      `${CUSTOMERS_BASE}/${id}/files`,
      { method: "POST", body }
    ),

  removeFile: (id: string, fileId: string) =>
    apiRequest<null>(`${CUSTOMERS_BASE}/${id}/files/${fileId}`, { method: "DELETE" }),
};
