import { z } from 'zod';

const isActiveSchema = z.boolean().default(true);

export const stageApplicableForSchema = z.enum(['opportunity', 'customer', 'both']);

export const stageReminderOffsetSchema = z.enum([
  'same-day',
  '1-day-before',
  '3-days-before',
  '7-days-before',
]);

export const companyMasterCreateSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  gstin: z.string().optional().default(''),
  pan: z.string().optional().default(''),
  email: z.string().default(''),
  phone: z.string().optional().default(''),
  website: z.string().optional().default(''),
  address: z.string().optional().default(''),
  currency: z.string().min(1).default('INR'),
  financialYear: z.string().optional().default(''),
});

export const companyMasterUpdateSchema = companyMasterCreateSchema.partial();

export const stageMasterCreateSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  sequence: z.coerce.number().int().positive().default(1),
  color: z.string().min(1).default('#3b82f6'),
  applicableFor: stageApplicableForSchema.default('both'),
  dateRequired: z.boolean().default(false),
  notesRequired: z.boolean().default(false),
  reminderOffset: stageReminderOffsetSchema.default('1-day-before'),
  canConvertToCustomer: z.boolean().default(false),
  isActive: isActiveSchema,
});

export const stageMasterUpdateSchema = stageMasterCreateSchema.partial();

export const opportunitySourceCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  isActive: isActiveSchema,
});

export const opportunitySourceUpdateSchema = opportunitySourceCreateSchema.partial();

export const industryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  isActive: isActiveSchema,
});

export const industryUpdateSchema = industryCreateSchema.partial();

export const slugMasterCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1).optional(),
  isActive: isActiveSchema,
});

export const slugMasterUpdateSchema = slugMasterCreateSchema.partial();

export const expenseCategoryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  isActive: isActiveSchema,
});

export const expenseCategoryUpdateSchema = expenseCategoryCreateSchema.partial();

export const renewalFrequencyCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isActive: isActiveSchema,
});

export const renewalFrequencyUpdateSchema = renewalFrequencyCreateSchema.partial();

export const countryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(2).max(3, 'Country code must be 2-3 characters'),
  isActive: isActiveSchema,
});

export const countryUpdateSchema = countryCreateSchema.partial();

export const stateCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'State code is required'),
  countryId: z.string().min(1, 'Country ID is required'),
  isActive: isActiveSchema,
});

export const stateUpdateSchema = stateCreateSchema.partial();

export const invoiceConfigurationCreateSchema = z.object({
  invoicePrefix: z.string().min(1).default('INV'),
  nextInvoiceNumber: z.string().min(1).default('0001'),
  defaultTaxPercentage: z.string().default('18'),
  defaultPaymentTerms: z.string().default('Net 15'),
  currencySymbol: z.string().default('₹'),
});

export const invoiceConfigurationUpdateSchema = invoiceConfigurationCreateSchema.partial();

export const notificationConfigurationCreateSchema = z.object({
  emailNotificationsEnabled: z.boolean().default(true),
  smsNotificationsEnabled: z.boolean().default(false),
  pushNotificationsEnabled: z.boolean().default(true),
  renewalReminderEnabled: z.boolean().default(true),
  invoiceReminderEnabled: z.boolean().default(true),
  defaultReminderDays: z.coerce.number().int().positive().default(7),
});

export const notificationConfigurationUpdateSchema =
  notificationConfigurationCreateSchema.partial();

export const brandingCreateSchema = z.object({
  logoUrl: z.string().optional().default(''),
  faviconUrl: z.string().optional().default(''),
  primaryColor: z.string().default('#3b82f6'),
  secondaryColor: z.string().default('#64748b'),
  accentColor: z.string().default('#10b981'),
  tagline: z.string().optional().default(''),
});

export const brandingUpdateSchema = brandingCreateSchema.partial();

export const slugifyMasterName = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
