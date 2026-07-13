/** Master Data Management sheet tabs — one tab per master entity */
export const MASTER_SHEET_TABS = {
  COMPANY: 'MasterCompany',
  STAGES: 'MasterStages',
  OPPORTUNITY_SOURCES: 'MasterOpportunitySources',
  INDUSTRIES: 'MasterIndustries',
  DEAL_TYPES: 'MasterDealTypes',
  PAYMENT_METHODS: 'MasterPaymentMethods',
  EXPENSE_CATEGORIES: 'MasterExpenseCategories',
  RENEWAL_FREQUENCIES: 'MasterRenewalFrequencies',
  COUNTRIES: 'MasterCountries',
  STATES: 'MasterStates',
  INVOICE_CONFIGURATION: 'MasterInvoiceConfiguration',
  NOTIFICATION_CONFIGURATION: 'MasterNotificationConfiguration',
  BRANDING: 'MasterBranding',
} as const;

export type MasterSheetTabName = (typeof MASTER_SHEET_TABS)[keyof typeof MASTER_SHEET_TABS];
