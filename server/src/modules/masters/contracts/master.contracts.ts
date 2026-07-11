import { BASE_ENTITY_COLUMNS, MASTER_SHEET_TABS } from '../../../constants';
import type { PersistenceContract } from '../../../types';

const withBase = <T extends readonly string[]>(fields: T): readonly [...typeof BASE_ENTITY_COLUMNS, ...T] =>
  [...BASE_ENTITY_COLUMNS, ...fields];

export const COMPANY_MASTER_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.COMPANY,
  entityName: 'CompanyMaster',
  columns: withBase([
    'companyName',
    'gstin',
    'pan',
    'email',
    'phone',
    'website',
    'address',
    'currency',
    'financialYear',
  ]),
};

export const STAGE_MASTER_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.STAGES,
  entityName: 'StageMaster',
  columns: withBase([
    'name',
    'sequence',
    'color',
    'applicableFor',
    'dateRequired',
    'notesRequired',
    'reminderOffset',
    'canConvertToCustomer',
    'isActive',
  ]),
};

export const OPPORTUNITY_SOURCE_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.OPPORTUNITY_SOURCES,
  entityName: 'OpportunitySource',
  columns: withBase(['name', 'description', 'isActive']),
};

export const INDUSTRY_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.INDUSTRIES,
  entityName: 'Industry',
  columns: withBase(['name', 'description', 'isActive']),
};

export const DEAL_TYPE_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.DEAL_TYPES,
  entityName: 'DealType',
  columns: withBase(['name', 'slug', 'isActive']),
};

export const PAYMENT_METHOD_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.PAYMENT_METHODS,
  entityName: 'PaymentMethod',
  columns: withBase(['name', 'slug', 'isActive']),
};

export const EXPENSE_CATEGORY_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.EXPENSE_CATEGORIES,
  entityName: 'ExpenseCategory',
  columns: withBase(['name', 'description', 'isActive']),
};

export const RENEWAL_FREQUENCY_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.RENEWAL_FREQUENCIES,
  entityName: 'RenewalFrequency',
  columns: withBase(['name', 'isActive']),
};

export const COUNTRY_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.COUNTRIES,
  entityName: 'Country',
  columns: withBase(['name', 'code', 'isActive']),
};

export const STATE_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.STATES,
  entityName: 'State',
  columns: withBase(['name', 'code', 'countryId', 'isActive']),
};

export const INVOICE_CONFIGURATION_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.INVOICE_CONFIGURATION,
  entityName: 'InvoiceConfiguration',
  columns: withBase([
    'invoicePrefix',
    'nextInvoiceNumber',
    'defaultTaxPercentage',
    'defaultPaymentTerms',
    'currencySymbol',
  ]),
};

export const NOTIFICATION_CONFIGURATION_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.NOTIFICATION_CONFIGURATION,
  entityName: 'NotificationConfiguration',
  columns: withBase([
    'emailNotificationsEnabled',
    'smsNotificationsEnabled',
    'pushNotificationsEnabled',
    'renewalReminderEnabled',
    'invoiceReminderEnabled',
    'defaultReminderDays',
  ]),
};

export const BRANDING_CONTRACT: PersistenceContract = {
  tabName: MASTER_SHEET_TABS.BRANDING,
  entityName: 'Branding',
  columns: withBase([
    'logoUrl',
    'faviconUrl',
    'primaryColor',
    'secondaryColor',
    'accentColor',
    'tagline',
  ]),
};
