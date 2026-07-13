import { apiRequest } from "@/shared/api/client";
import type { PaginatedData } from "@/shared/api/types";
import type {
  BrandingDto,
  CompanyMasterDto,
  CountryMasterDto,
  NamedMasterDto,
  SimpleMasterDto,
  SlugMasterDto,
  StageMasterDto,
  StateMasterDto,
  InvoiceConfigurationDto,
} from "@/features/settings/api/master.dto";

const MASTERS_BASE = "/settings/masters";
const LIST_LIMIT = 200;

async function listAll<T>(path: string): Promise<T[]> {
  const result = await apiRequest<PaginatedData<T>>(path, {
    params: { page: 1, limit: LIST_LIMIT },
  });
  return result.items;
}

async function getSingleton<T>(path: string): Promise<T | null> {
  return apiRequest<T | null>(path);
}

async function upsertSingleton<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PUT", body });
}

async function createItem<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body });
}

async function updateItem<T>(path: string, id: string, body: unknown): Promise<T> {
  return apiRequest<T>(`${path}/${id}`, { method: "PUT", body });
}

async function deleteItem(path: string, id: string): Promise<void> {
  await apiRequest<null>(`${path}/${id}`, { method: "DELETE" });
}

export const mastersApi = {
  company: {
    get: () => getSingleton<CompanyMasterDto>(`${MASTERS_BASE}/company`),
    save: (body: unknown) =>
      upsertSingleton<CompanyMasterDto>(`${MASTERS_BASE}/company`, body),
  },
  invoiceConfiguration: {
    get: () => getSingleton<InvoiceConfigurationDto>(`${MASTERS_BASE}/invoice-configuration`),
    save: (body: unknown) =>
      upsertSingleton<InvoiceConfigurationDto>(`${MASTERS_BASE}/invoice-configuration`, body),
  },
  branding: {
    get: () => getSingleton<BrandingDto>(`${MASTERS_BASE}/branding`),
    save: (body: unknown) => upsertSingleton<BrandingDto>(`${MASTERS_BASE}/branding`, body),
  },
  stages: {
    list: () => listAll<StageMasterDto>(`${MASTERS_BASE}/stages`),
    create: (body: unknown) => createItem<StageMasterDto>(`${MASTERS_BASE}/stages`, body),
    update: (id: string, body: unknown) =>
      updateItem<StageMasterDto>(`${MASTERS_BASE}/stages`, id, body),
    delete: (id: string) => deleteItem(`${MASTERS_BASE}/stages`, id),
  },
  opportunitySources: {
    list: () => listAll<NamedMasterDto>(`${MASTERS_BASE}/opportunity-sources`),
    create: (body: unknown) =>
      createItem<NamedMasterDto>(`${MASTERS_BASE}/opportunity-sources`, body),
    update: (id: string, body: unknown) =>
      updateItem<NamedMasterDto>(`${MASTERS_BASE}/opportunity-sources`, id, body),
    delete: (id: string) => deleteItem(`${MASTERS_BASE}/opportunity-sources`, id),
  },
  industries: {
    list: () => listAll<NamedMasterDto>(`${MASTERS_BASE}/industries`),
    create: (body: unknown) => createItem<NamedMasterDto>(`${MASTERS_BASE}/industries`, body),
    update: (id: string, body: unknown) =>
      updateItem<NamedMasterDto>(`${MASTERS_BASE}/industries`, id, body),
    delete: (id: string) => deleteItem(`${MASTERS_BASE}/industries`, id),
  },
  dealTypes: {
    list: () => listAll<SlugMasterDto>(`${MASTERS_BASE}/deal-types`),
    create: (body: unknown) => createItem<SlugMasterDto>(`${MASTERS_BASE}/deal-types`, body),
    update: (id: string, body: unknown) =>
      updateItem<SlugMasterDto>(`${MASTERS_BASE}/deal-types`, id, body),
    delete: (id: string) => deleteItem(`${MASTERS_BASE}/deal-types`, id),
  },
  paymentMethods: {
    list: () => listAll<SlugMasterDto>(`${MASTERS_BASE}/payment-methods`),
    create: (body: unknown) =>
      createItem<SlugMasterDto>(`${MASTERS_BASE}/payment-methods`, body),
    update: (id: string, body: unknown) =>
      updateItem<SlugMasterDto>(`${MASTERS_BASE}/payment-methods`, id, body),
    delete: (id: string) => deleteItem(`${MASTERS_BASE}/payment-methods`, id),
  },
  expenseCategories: {
    list: () => listAll<NamedMasterDto>(`${MASTERS_BASE}/expense-categories`),
    create: (body: unknown) =>
      createItem<NamedMasterDto>(`${MASTERS_BASE}/expense-categories`, body),
    update: (id: string, body: unknown) =>
      updateItem<NamedMasterDto>(`${MASTERS_BASE}/expense-categories`, id, body),
    delete: (id: string) => deleteItem(`${MASTERS_BASE}/expense-categories`, id),
  },
  renewalFrequencies: {
    list: () => listAll<SimpleMasterDto>(`${MASTERS_BASE}/renewal-frequencies`),
    create: (body: unknown) =>
      createItem<SimpleMasterDto>(`${MASTERS_BASE}/renewal-frequencies`, body),
    update: (id: string, body: unknown) =>
      updateItem<SimpleMasterDto>(`${MASTERS_BASE}/renewal-frequencies`, id, body),
    delete: (id: string) => deleteItem(`${MASTERS_BASE}/renewal-frequencies`, id),
  },
  countries: {
    list: () => listAll<CountryMasterDto>(`${MASTERS_BASE}/countries`),
    create: (body: unknown) => createItem<CountryMasterDto>(`${MASTERS_BASE}/countries`, body),
    update: (id: string, body: unknown) =>
      updateItem<CountryMasterDto>(`${MASTERS_BASE}/countries`, id, body),
    delete: (id: string) => deleteItem(`${MASTERS_BASE}/countries`, id),
  },
  states: {
    list: () => listAll<StateMasterDto>(`${MASTERS_BASE}/states`),
    create: (body: unknown) => createItem<StateMasterDto>(`${MASTERS_BASE}/states`, body),
    update: (id: string, body: unknown) =>
      updateItem<StateMasterDto>(`${MASTERS_BASE}/states`, id, body),
    delete: (id: string) => deleteItem(`${MASTERS_BASE}/states`, id),
  },
};
