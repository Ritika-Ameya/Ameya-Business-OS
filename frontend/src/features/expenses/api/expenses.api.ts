import { apiRequest } from "@/shared/api/client";
import type { PaginatedData } from "@/shared/api/types";
import type {
  ExpenseCreateBody,
  ExpenseDocumentDto,
  ExpenseDto,
  ExpenseMasterCreateBody,
  ExpenseMasterDto,
} from "@/features/expenses/api/expense.dto";
import type { ExpenseTransactionStatus } from "@/features/expenses/types/expense";

const EXPENSES_BASE = "/expenses";
const MASTERS_BASE = "/expense-masters";
const LIST_LIMIT = 200;

export const expensesApi = {
  list: async (): Promise<ExpenseDto[]> => {
    const result = await apiRequest<PaginatedData<ExpenseDto>>(EXPENSES_BASE, {
      params: { page: 1, limit: LIST_LIMIT, sort: "expenseDate:desc" },
    });
    return result.items;
  },

  getById: (id: string) => apiRequest<ExpenseDto>(`${EXPENSES_BASE}/${id}`),

  create: (body: ExpenseCreateBody) =>
    apiRequest<ExpenseDto>(EXPENSES_BASE, { method: "POST", body }),

  update: (id: string, body: Partial<ExpenseCreateBody>) =>
    apiRequest<ExpenseDto>(`${EXPENSES_BASE}/${id}`, { method: "PUT", body }),

  remove: (id: string) =>
    apiRequest<null>(`${EXPENSES_BASE}/${id}`, { method: "DELETE" }),

  restore: (id: string) =>
    apiRequest<ExpenseDto>(`${EXPENSES_BASE}/${id}/restore`, { method: "POST" }),

  changeStatus: (id: string, status: ExpenseTransactionStatus) =>
    apiRequest<ExpenseDto>(`${EXPENSES_BASE}/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),

  listFiles: (id: string) =>
    apiRequest<ExpenseDocumentDto[]>(`${EXPENSES_BASE}/${id}/files`),

  addFile: (
    id: string,
    body: { name: string; fileType?: string; mimeType?: string; size?: number }
  ) =>
    apiRequest<{ document: ExpenseDocumentDto; expense: ExpenseDto }>(
      `${EXPENSES_BASE}/${id}/files`,
      { method: "POST", body }
    ),

  removeFile: (id: string, fileId: string) =>
    apiRequest<null>(`${EXPENSES_BASE}/${id}/files/${fileId}`, { method: "DELETE" }),
};

export const expenseMastersApi = {
  list: async (): Promise<ExpenseMasterDto[]> => {
    const result = await apiRequest<PaginatedData<ExpenseMasterDto>>(MASTERS_BASE, {
      params: { page: 1, limit: LIST_LIMIT, sort: "createdAt:desc" },
    });
    return result.items;
  },

  getById: (id: string) =>
    apiRequest<ExpenseMasterDto>(`${MASTERS_BASE}/${id}`),

  create: (body: ExpenseMasterCreateBody) =>
    apiRequest<ExpenseMasterDto>(MASTERS_BASE, { method: "POST", body }),

  update: (id: string, body: Partial<ExpenseMasterCreateBody>) =>
    apiRequest<ExpenseMasterDto>(`${MASTERS_BASE}/${id}`, { method: "PUT", body }),

  remove: (id: string) =>
    apiRequest<null>(`${MASTERS_BASE}/${id}`, { method: "DELETE" }),

  restore: (id: string) =>
    apiRequest<ExpenseMasterDto>(`${MASTERS_BASE}/${id}/restore`, {
      method: "POST",
    }),
};
