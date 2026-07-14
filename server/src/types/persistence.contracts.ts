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

/** Single worksheet for Opportunity + Customer lifecycle stages (recordType discriminator). */
export const CUSTOMERS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.CUSTOMERS,
  entityName: 'Customer',
  columns: withBaseColumns([
    'recordType',
    'status',
    'currentStageId',
    'companyName',
    'gstin',
    'industryId',
    'sourceId',
    'contactPerson',
    'phone',
    'alternatePhone',
    'email',
    'website',
    'billingAddress',
    'serviceAddress',
    'countryId',
    'stateId',
    'city',
    'pincode',
    'notes',
    'businessValue',
    'expectedRevenue',
    'nextActionDate',
    'lastContactDate',
    'renewalDate',
    'outstandingAmount',
    'tags',
    'isActive',
    'timeline',
    'activeDeals',
    'lastPayment',
    'businessSince',
  ]),
};

export const DEALS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.DEALS,
  entityName: 'Deal',
  columns: withBaseColumns([
    'dealNumber',
    'title',
    'customerId',
    'customerName',
    'status',
    'currentStageId',
    'dealType',
    'contractValue',
    'currency',
    'probability',
    'startDate',
    'expectedCloseDate',
    'actualCloseDate',
    'nextRenewal',
    'renewalFrequency',
    'nextActionDate',
    'owner',
    'description',
    'notes',
    'componentsCount',
    'timeline',
  ]),
};

export const DEAL_COMPONENTS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.DEAL_COMPONENTS,
  entityName: 'DealComponent',
  columns: withBaseColumns([
    'dealId',
    'name',
    'category',
    'description',
    'amount',
    'billingType',
    'status',
    'renewalDate',
  ]),
};

export const INVOICES_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.INVOICES,
  entityName: 'Invoice',
  columns: withBaseColumns([
    'invoiceNumber',
    'customerId',
    'customerName',
    'dealId',
    'dealTitle',
    'status',
    'issueDate',
    'dueDate',
    'subtotal',
    'taxPercent',
    'tax',
    'total',
    'currency',
    'received',
    'outstanding',
    'componentIds',
    'notes',
    'timeline',
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
    'receivedBy',
    'transactionId',
    'notes',
  ]),
};

/** Expense register transactions — aligned with frontend ExpenseTransaction. */
export const EXPENSES_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.EXPENSES,
  entityName: 'Expense',
  columns: withBaseColumns([
    'expenseDate',
    'name',
    'categoryId',
    'categoryName',
    'payeeType',
    'vendorOrEmployee',
    'vendorId',
    'employeeId',
    'amount',
    'currency',
    'status',
    'paymentMethod',
    'referenceNumber',
    'notes',
    'hasAttachment',
    'recurring',
    'masterTemplateId',
    'generatedPeriod',
  ]),
};

/** Recurring expense templates — aligned with frontend ExpenseMasterTemplate. */
export const EXPENSE_MASTERS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.EXPENSE_MASTERS,
  entityName: 'ExpenseMaster',
  columns: withBaseColumns([
    'name',
    'categoryId',
    'categoryName',
    'payeeType',
    'vendorOrEmployee',
    'vendorId',
    'employeeId',
    'defaultAmount',
    'frequency',
    'startDate',
    'endDate',
    'autoGenerate',
    'status',
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

/** Document metadata only — no Google Drive upload in this sprint. */
export const DOCUMENTS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.DOCUMENTS,
  entityName: 'Document',
  columns: withBaseColumns([
    'name',
    'fileType',
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
  expenseMasters: EXPENSE_MASTERS_CONTRACT,
  renewals: RENEWALS_CONTRACT,
  documents: DOCUMENTS_CONTRACT,
  activityLogs: ACTIVITY_LOGS_CONTRACT,
  settings: SETTINGS_CONTRACT,
} as const;

export type PersistenceContractKey = keyof typeof PERSISTENCE_CONTRACTS;
