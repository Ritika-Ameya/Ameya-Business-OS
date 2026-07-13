import { apiRequest } from "@/shared/api/client";
import type { PaginatedData } from "@/shared/api/types";
import type {
  DealComponentCreateBody,
  DealComponentDto,
  DealCreateBody,
  DealDocumentDto,
  DealDto,
  DealStageChangeBody,
} from "@/features/deals/api/deal.dto";
import type { DealStatus } from "@/features/deals/types/deal";

const DEALS_BASE = "/deals";
const LIST_LIMIT = 200;

export const dealsApi = {
  list: async (): Promise<DealDto[]> => {
    const result = await apiRequest<PaginatedData<DealDto>>(DEALS_BASE, {
      params: { page: 1, limit: LIST_LIMIT, sort: "createdAt:desc" },
    });
    return result.items;
  },

  getById: (id: string) => apiRequest<DealDto>(`${DEALS_BASE}/${id}`),

  create: (body: DealCreateBody) =>
    apiRequest<DealDto>(DEALS_BASE, { method: "POST", body }),

  update: (id: string, body: Partial<DealCreateBody>) =>
    apiRequest<DealDto>(`${DEALS_BASE}/${id}`, { method: "PUT", body }),

  remove: (id: string) =>
    apiRequest<null>(`${DEALS_BASE}/${id}`, { method: "DELETE" }),

  restore: (id: string) =>
    apiRequest<DealDto>(`${DEALS_BASE}/${id}/restore`, { method: "POST" }),

  changeStage: (id: string, body: DealStageChangeBody) =>
    apiRequest<DealDto>(`${DEALS_BASE}/${id}/stage`, { method: "PATCH", body }),

  changeStatus: (id: string, status: DealStatus) =>
    apiRequest<DealDto>(`${DEALS_BASE}/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),

  addTimelineNote: (id: string, body: { notes: string; nextActionDate?: string }) =>
    apiRequest<DealDto>(`${DEALS_BASE}/${id}/timeline`, { method: "POST", body }),

  listComponents: (id: string) =>
    apiRequest<DealComponentDto[]>(`${DEALS_BASE}/${id}/components`),

  addComponent: (id: string, body: DealComponentCreateBody) =>
    apiRequest<{ component: DealComponentDto; deal: DealDto }>(
      `${DEALS_BASE}/${id}/components`,
      { method: "POST", body }
    ),

  removeComponent: (id: string, componentId: string) =>
    apiRequest<DealDto>(`${DEALS_BASE}/${id}/components/${componentId}`, {
      method: "DELETE",
    }),

  listFiles: (id: string) =>
    apiRequest<DealDocumentDto[]>(`${DEALS_BASE}/${id}/files`),

  addFile: (
    id: string,
    body: { name: string; fileType?: string; mimeType?: string; size?: number }
  ) =>
    apiRequest<{ document: DealDocumentDto; deal: DealDto }>(
      `${DEALS_BASE}/${id}/files`,
      { method: "POST", body }
    ),

  removeFile: (id: string, fileId: string) =>
    apiRequest<null>(`${DEALS_BASE}/${id}/files/${fileId}`, { method: "DELETE" }),
};
