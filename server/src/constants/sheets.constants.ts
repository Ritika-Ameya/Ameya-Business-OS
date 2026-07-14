/** Google Sheets tab names aligned with Ameya Business OS Data Model v1.0 */
export const SHEET_TABS = {
  COMPANY: 'Company',
  USERS: 'Users',
  CUSTOMERS: 'Customers',
  DEALS: 'Deals',
  DEAL_COMPONENTS: 'DealComponents',
  INVOICES: 'Invoices',
  PAYMENTS: 'Payments',
  EXPENSES: 'Expenses',
  EXPENSE_MASTERS: 'ExpenseMasters',
  RENEWALS: 'Renewals',
  DOCUMENTS: 'Documents',
  ACTIVITY_LOGS: 'ActivityLogs',
  SETTINGS: 'Settings',
} as const;

export type SheetTabName = (typeof SHEET_TABS)[keyof typeof SHEET_TABS];

/** Standard columns present on every persisted entity */
export const BASE_ENTITY_COLUMNS = [
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'deletedAt',
  'isDeleted',
  'version',
] as const;

export type BaseEntityColumn = (typeof BASE_ENTITY_COLUMNS)[number];

export const SHEET_HEADER_ROW = 1;
export const SHEET_DATA_START_ROW = 2;
