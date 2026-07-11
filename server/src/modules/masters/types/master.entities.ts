import type { BaseEntity } from '../../../types';

export type MasterEntityBase = BaseEntity & Record<string, unknown>;

export type StageApplicableFor = 'opportunity' | 'customer' | 'both';

export type StageReminderOffset =
  | 'same-day'
  | '1-day-before'
  | '3-days-before'
  | '7-days-before';

export interface CompanyMasterEntity extends MasterEntityBase {
  companyName: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  currency: string;
  financialYear: string;
}

export interface StageMasterEntity extends MasterEntityBase {
  name: string;
  sequence: number;
  color: string;
  applicableFor: StageApplicableFor;
  dateRequired: boolean;
  notesRequired: boolean;
  reminderOffset: StageReminderOffset;
  canConvertToCustomer: boolean;
  isActive: boolean;
}

export interface OpportunitySourceEntity extends MasterEntityBase {
  name: string;
  description: string;
  isActive: boolean;
}

export interface IndustryEntity extends MasterEntityBase {
  name: string;
  description: string;
  isActive: boolean;
}

export interface DealTypeEntity extends MasterEntityBase {
  name: string;
  slug: string;
  isActive: boolean;
}

export interface PaymentMethodEntity extends MasterEntityBase {
  name: string;
  slug: string;
  isActive: boolean;
}

export interface ExpenseCategoryEntity extends MasterEntityBase {
  name: string;
  description: string;
  isActive: boolean;
}

export interface RenewalFrequencyEntity extends MasterEntityBase {
  name: string;
  isActive: boolean;
}

export interface CountryEntity extends MasterEntityBase {
  name: string;
  code: string;
  isActive: boolean;
}

export interface StateEntity extends MasterEntityBase {
  name: string;
  code: string;
  countryId: string;
  isActive: boolean;
}

export interface InvoiceConfigurationEntity extends MasterEntityBase {
  invoicePrefix: string;
  nextInvoiceNumber: string;
  defaultTaxPercentage: string;
  defaultPaymentTerms: string;
  currencySymbol: string;
}

export interface NotificationConfigurationEntity extends MasterEntityBase {
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  renewalReminderEnabled: boolean;
  invoiceReminderEnabled: boolean;
  defaultReminderDays: number;
}

export interface BrandingEntity extends MasterEntityBase {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline: string;
}

export type MasterListEntity =
  | StageMasterEntity
  | OpportunitySourceEntity
  | IndustryEntity
  | DealTypeEntity
  | PaymentMethodEntity
  | ExpenseCategoryEntity
  | RenewalFrequencyEntity
  | CountryEntity
  | StateEntity;

export type MasterSingletonEntity =
  | CompanyMasterEntity
  | InvoiceConfigurationEntity
  | NotificationConfigurationEntity
  | BrandingEntity;
