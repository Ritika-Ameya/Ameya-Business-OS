import { BASE_ENTITY_COLUMNS, SHEET_TABS, type SheetTabName } from '../constants/sheets.constants';
import type { MasterSheetTabName } from '../constants/masterSheets.constants';

/** Persistence contract — defines sheet tab and columns without implementing repository logic */

export type AnySheetTabName = SheetTabName | MasterSheetTabName;

export interface PersistenceContract {
  tabName: AnySheetTabName;
  entityName: string;
  columns: readonly string[];
}

const withBaseColumns = <T extends readonly string[]>(
  columns: T,
): readonly [...typeof BASE_ENTITY_COLUMNS, ...T] => [...BASE_ENTITY_COLUMNS, ...columns];

export const COMPANY_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.COMPANY,
  entityName: 'Company',
  columns: withBaseColumns(['name', 'legalName', 'taxId', 'address', 'phone', 'email', 'website']),
};

export const USERS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.USERS,
  entityName: 'User',
  columns: withBaseColumns(['email', 'name', 'role', 'status', 'lastLoginAt']),
};

export const CUSTOMERS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.CUSTOMERS,
  entityName: 'Customer',
  columns: withBaseColumns([
    'name',
    'email',
    'phone',
    'companyId',
    'stage',
    'source',
    'assignedTo',
  ]),
};

export const DEALS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.DEALS,
  entityName: 'Deal',
  columns: withBaseColumns([
    'title',
    'customerId',
    'stage',
    'value',
    'currency',
    'expectedCloseDate',
    'assignedTo',
  ]),
};

export const DEAL_COMPONENTS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.DEAL_COMPONENTS,
  entityName: 'DealComponent',
  columns: withBaseColumns(['dealId', 'name', 'type', 'quantity', 'unitPrice', 'totalPrice']),
};

export const INVOICES_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.INVOICES,
  entityName: 'Invoice',
  columns: withBaseColumns([
    'invoiceNumber',
    'customerId',
    'dealId',
    'status',
    'issueDate',
    'dueDate',
    'subtotal',
    'tax',
    'total',
    'currency',
  ]),
};

export const PAYMENTS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.PAYMENTS,
  entityName: 'Payment',
  columns: withBaseColumns([
    'invoiceId',
    'customerId',
    'amount',
    'currency',
    'method',
    'status',
    'paidAt',
    'reference',
  ]),
};

export const EXPENSES_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.EXPENSES,
  entityName: 'Expense',
  columns: withBaseColumns([
    'description',
    'category',
    'amount',
    'currency',
    'expenseDate',
    'vendor',
    'status',
    'receiptDocumentId',
  ]),
};

export const RENEWALS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.RENEWALS,
  entityName: 'Renewal',
  columns: withBaseColumns([
    'customerId',
    'dealId',
    'renewalDate',
    'amount',
    'currency',
    'status',
    'type',
  ]),
};

export const DOCUMENTS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.DOCUMENTS,
  entityName: 'Document',
  columns: withBaseColumns([
    'name',
    'mimeType',
    'size',
    'driveFileId',
    'entityType',
    'entityId',
    'uploadedBy',
  ]),
};

export const ACTIVITY_LOGS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.ACTIVITY_LOGS,
  entityName: 'ActivityLog',
  columns: withBaseColumns(['entityType', 'entityId', 'action', 'actorId', 'details', 'occurredAt']),
};

export const SETTINGS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.SETTINGS,
  entityName: 'Setting',
  columns: withBaseColumns(['key', 'value', 'category', 'description', 'isSystem']),
};

/** Registry of all persistence contracts for future repository implementations */
export const PERSISTENCE_CONTRACTS = {
  company: COMPANY_CONTRACT,
  users: USERS_CONTRACT,
  customers: CUSTOMERS_CONTRACT,
  deals: DEALS_CONTRACT,
  dealComponents: DEAL_COMPONENTS_CONTRACT,
  invoices: INVOICES_CONTRACT,
  payments: PAYMENTS_CONTRACT,
  expenses: EXPENSES_CONTRACT,
  renewals: RENEWALS_CONTRACT,
  documents: DOCUMENTS_CONTRACT,
  activityLogs: ACTIVITY_LOGS_CONTRACT,
  settings: SETTINGS_CONTRACT,
} as const;

export type PersistenceContractKey = keyof typeof PERSISTENCE_CONTRACTS;
