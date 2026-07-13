import type { BaseEntity } from '../../../types';
import { createBaseEntityMapper } from '../../../utils/entityMapper.util';
import { parseBoolean, parseNumberField } from '../../../utils/sheetMapper.util';
import type {
  BrandingEntity,
  CompanyMasterEntity,
  CountryEntity,
  DealTypeEntity,
  ExpenseCategoryEntity,
  IndustryEntity,
  InvoiceConfigurationEntity,
  NotificationConfigurationEntity,
  OpportunitySourceEntity,
  PaymentMethodEntity,
  RenewalFrequencyEntity,
  StageMasterEntity,
  StateEntity,
} from '../types/master.entities';

const str = (record: Record<string, string>, key: string, fallback = ''): string =>
  record[key] ?? fallback;

const bool = (record: Record<string, string>, key: string): boolean => parseBoolean(record[key]);

const num = (record: Record<string, string>, key: string, fallback = 0): number =>
  parseNumberField(record[key], fallback);

const rowStr = (entity: Partial<Record<string, unknown>>, key: string): string =>
  String(entity[key] ?? '');

const rowBool = (entity: Partial<Record<string, unknown>>, key: string): string =>
  String(entity[key] ?? false);

export const companyMasterMapper = createBaseEntityMapper<CompanyMasterEntity>(
  (record, base) => ({
    ...base,
    companyName: str(record, 'companyName'),
    gstin: str(record, 'gstin'),
    pan: str(record, 'pan'),
    email: str(record, 'email'),
    phone: str(record, 'phone'),
    website: str(record, 'website'),
    address: str(record, 'address'),
    currency: str(record, 'currency'),
    financialYear: str(record, 'financialYear'),
  }),
  (entity) => ({
    companyName: rowStr(entity, 'companyName'),
    gstin: rowStr(entity, 'gstin'),
    pan: rowStr(entity, 'pan'),
    email: rowStr(entity, 'email'),
    phone: rowStr(entity, 'phone'),
    website: rowStr(entity, 'website'),
    address: rowStr(entity, 'address'),
    currency: rowStr(entity, 'currency'),
    financialYear: rowStr(entity, 'financialYear'),
  }),
);

export const stageMasterMapper = createBaseEntityMapper<StageMasterEntity>(
  (record, base) => ({
    ...base,
    name: str(record, 'name'),
    sequence: num(record, 'sequence', 1),
    color: str(record, 'color', '#3b82f6'),
    applicableFor: str(record, 'applicableFor', 'both') as StageMasterEntity['applicableFor'],
    dateRequired: bool(record, 'dateRequired'),
    notesRequired: bool(record, 'notesRequired'),
    reminderOffset: str(record, 'reminderOffset', '1-day-before') as StageMasterEntity['reminderOffset'],
    canConvertToCustomer: bool(record, 'canConvertToCustomer'),
    isActive: bool(record, 'isActive'),
  }),
  (entity) => ({
    name: rowStr(entity, 'name'),
    sequence: String(entity.sequence ?? 1),
    color: rowStr(entity, 'color'),
    applicableFor: rowStr(entity, 'applicableFor'),
    dateRequired: rowBool(entity, 'dateRequired'),
    notesRequired: rowBool(entity, 'notesRequired'),
    reminderOffset: rowStr(entity, 'reminderOffset'),
    canConvertToCustomer: rowBool(entity, 'canConvertToCustomer'),
    isActive: rowBool(entity, 'isActive'),
  }),
);

export const opportunitySourceMapper = createBaseEntityMapper<OpportunitySourceEntity>(
  (record, base) => ({
    ...base,
    name: str(record, 'name'),
    description: str(record, 'description'),
    isActive: bool(record, 'isActive'),
  }),
  (entity) => ({
    name: rowStr(entity, 'name'),
    description: rowStr(entity, 'description'),
    isActive: rowBool(entity, 'isActive'),
  }),
);

export const industryMapper = createBaseEntityMapper<IndustryEntity>(
  (record, base) => ({
    ...base,
    name: str(record, 'name'),
    description: str(record, 'description'),
    isActive: bool(record, 'isActive'),
  }),
  (entity) => ({
    name: rowStr(entity, 'name'),
    description: rowStr(entity, 'description'),
    isActive: rowBool(entity, 'isActive'),
  }),
);

export const dealTypeMapper = createBaseEntityMapper<DealTypeEntity>(
  (record, base) => ({
    ...base,
    name: str(record, 'name'),
    slug: str(record, 'slug'),
    isActive: bool(record, 'isActive'),
  }),
  (entity) => ({
    name: rowStr(entity, 'name'),
    slug: rowStr(entity, 'slug'),
    isActive: rowBool(entity, 'isActive'),
  }),
);

export const paymentMethodMapper = createBaseEntityMapper<PaymentMethodEntity>(
  (record, base) => ({
    ...base,
    name: str(record, 'name'),
    slug: str(record, 'slug'),
    isActive: bool(record, 'isActive'),
  }),
  (entity) => ({
    name: rowStr(entity, 'name'),
    slug: rowStr(entity, 'slug'),
    isActive: rowBool(entity, 'isActive'),
  }),
);

export const expenseCategoryMapper = createBaseEntityMapper<ExpenseCategoryEntity>(
  (record, base) => ({
    ...base,
    name: str(record, 'name'),
    description: str(record, 'description'),
    isActive: bool(record, 'isActive'),
  }),
  (entity) => ({
    name: rowStr(entity, 'name'),
    description: rowStr(entity, 'description'),
    isActive: rowBool(entity, 'isActive'),
  }),
);

export const renewalFrequencyMapper = createBaseEntityMapper<RenewalFrequencyEntity>(
  (record, base) => ({
    ...base,
    name: str(record, 'name'),
    isActive: bool(record, 'isActive'),
  }),
  (entity) => ({
    name: rowStr(entity, 'name'),
    isActive: rowBool(entity, 'isActive'),
  }),
);

export const countryMapper = createBaseEntityMapper<CountryEntity>(
  (record, base) => ({
    ...base,
    name: str(record, 'name'),
    code: str(record, 'code'),
    isActive: bool(record, 'isActive'),
  }),
  (entity) => ({
    name: rowStr(entity, 'name'),
    code: rowStr(entity, 'code'),
    isActive: rowBool(entity, 'isActive'),
  }),
);

export const stateMapper = createBaseEntityMapper<StateEntity>(
  (record, base) => ({
    ...base,
    name: str(record, 'name'),
    code: str(record, 'code'),
    countryId: str(record, 'countryId'),
    isActive: bool(record, 'isActive'),
  }),
  (entity) => ({
    name: rowStr(entity, 'name'),
    code: rowStr(entity, 'code'),
    countryId: rowStr(entity, 'countryId'),
    isActive: rowBool(entity, 'isActive'),
  }),
);

export const invoiceConfigurationMapper = createBaseEntityMapper<InvoiceConfigurationEntity>(
  (record, base) => ({
    ...base,
    invoicePrefix: str(record, 'invoicePrefix'),
    nextInvoiceNumber: str(record, 'nextInvoiceNumber'),
    defaultTaxPercentage: str(record, 'defaultTaxPercentage'),
    defaultPaymentTerms: str(record, 'defaultPaymentTerms'),
    currencySymbol: str(record, 'currencySymbol'),
  }),
  (entity) => ({
    invoicePrefix: rowStr(entity, 'invoicePrefix'),
    nextInvoiceNumber: rowStr(entity, 'nextInvoiceNumber'),
    defaultTaxPercentage: rowStr(entity, 'defaultTaxPercentage'),
    defaultPaymentTerms: rowStr(entity, 'defaultPaymentTerms'),
    currencySymbol: rowStr(entity, 'currencySymbol'),
  }),
);

export const notificationConfigurationMapper =
  createBaseEntityMapper<NotificationConfigurationEntity>(
    (record, base) => ({
      ...base,
      emailNotificationsEnabled: bool(record, 'emailNotificationsEnabled'),
      smsNotificationsEnabled: bool(record, 'smsNotificationsEnabled'),
      pushNotificationsEnabled: bool(record, 'pushNotificationsEnabled'),
      renewalReminderEnabled: bool(record, 'renewalReminderEnabled'),
      invoiceReminderEnabled: bool(record, 'invoiceReminderEnabled'),
      defaultReminderDays: num(record, 'defaultReminderDays', 7),
    }),
    (entity) => ({
      emailNotificationsEnabled: rowBool(entity, 'emailNotificationsEnabled'),
      smsNotificationsEnabled: rowBool(entity, 'smsNotificationsEnabled'),
      pushNotificationsEnabled: rowBool(entity, 'pushNotificationsEnabled'),
      renewalReminderEnabled: rowBool(entity, 'renewalReminderEnabled'),
      invoiceReminderEnabled: rowBool(entity, 'invoiceReminderEnabled'),
      defaultReminderDays: String(entity.defaultReminderDays ?? 7),
    }),
  );

export const brandingMapper = createBaseEntityMapper<BrandingEntity>(
  (record, base) => ({
    ...base,
    logoUrl: str(record, 'logoUrl'),
    faviconUrl: str(record, 'faviconUrl'),
    primaryColor: str(record, 'primaryColor', '#3b82f6'),
    secondaryColor: str(record, 'secondaryColor', '#64748b'),
    accentColor: str(record, 'accentColor', '#10b981'),
    tagline: str(record, 'tagline'),
  }),
  (entity) => ({
    logoUrl: rowStr(entity, 'logoUrl'),
    faviconUrl: rowStr(entity, 'faviconUrl'),
    primaryColor: rowStr(entity, 'primaryColor'),
    secondaryColor: rowStr(entity, 'secondaryColor'),
    accentColor: rowStr(entity, 'accentColor'),
    tagline: rowStr(entity, 'tagline'),
  }),
);

export type MasterEntity = BaseEntity & Record<string, unknown>;
