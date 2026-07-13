import { z } from 'zod';

const isActiveSchema = z.boolean().default(true);

const optionalEmailSchema = z
  .string()
  .default('')
  .refine((value) => value === '' || z.string().email().safeParse(value).success, {
    message: 'Invalid email address',
  });

const optionalWebsiteSchema = z
  .string()
  .default('')
  .refine(
    (value) =>
      value === '' ||
      /^https?:\/\/.+/i.test(value) ||
      /^[\w.-]+\.[a-z]{2,}([/:].*)?$/i.test(value),
    { message: 'Invalid website URL' },
  );

const optionalUrlSchema = z
  .string()
  .default('')
  .refine((value) => value === '' || /^https?:\/\/.+/i.test(value), {
    message: 'Invalid URL — must start with http:// or https://',
  });

const optionalPhoneSchema = z
  .string()
  .default('')
  .refine((value) => value === '' || /^[+]?[\d\s()-]{7,20}$/.test(value), {
    message: 'Invalid phone number',
  });

const optionalGstinSchema = z
  .string()
  .default('')
  .refine(
    (value) =>
      value === '' ||
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(value.trim()),
    { message: 'Invalid GSTIN format' },
  );

const optionalPanSchema = z
  .string()
  .default('')
  .refine((value) => value === '' || /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(value.trim()), {
    message: 'Invalid PAN format',
  });

const hexColor = (fallback: string) =>
  z
    .string()
    .default(fallback)
    .refine((value) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value), {
      message: 'Color must be a valid hex value (e.g. #3b82f6)',
    });

const currencyCodeSchema = z
  .string()
  .min(1)
  .default('INR')
  .refine((value) => /^[A-Z]{3}$/i.test(value.trim()), {
    message: 'Currency must be a 3-letter ISO code',
  })
  .transform((value) => value.trim().toUpperCase());

const invoicePrefixSchema = z
  .string()
  .min(1, 'Invoice prefix is required')
  .default('INV')
  .refine((value) => /^[A-Za-z0-9_-]{1,20}$/.test(value.trim()), {
    message: 'Invoice prefix must be 1-20 alphanumeric characters',
  });

export const stageApplicableForSchema = z.enum(['opportunity', 'customer', 'both']);

export const stageReminderOffsetSchema = z.enum([
  'same-day',
  '1-day-before',
  '3-days-before',
  '7-days-before',
]);

export const companyMasterCreateSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  gstin: optionalGstinSchema,
  pan: optionalPanSchema,
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  website: optionalWebsiteSchema,
  address: z.string().optional().default(''),
  currency: currencyCodeSchema,
  financialYear: z.string().optional().default(''),
});

export const companyMasterUpdateSchema = companyMasterCreateSchema.partial();

export const stageMasterCreateSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  sequence: z.coerce.number().int().positive().default(1),
  color: hexColor('#3b82f6'),
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
  code: z
    .string()
    .min(2)
    .max(3, 'Country code must be 2-3 characters')
    .transform((value) => value.trim().toUpperCase()),
  isActive: isActiveSchema,
});

export const countryUpdateSchema = countryCreateSchema.partial();

export const stateCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z
    .string()
    .min(1, 'State code is required')
    .transform((value) => value.trim().toUpperCase()),
  countryId: z.string().min(1, 'Country ID is required'),
  isActive: isActiveSchema,
});

export const stateUpdateSchema = stateCreateSchema.partial();

export const invoiceConfigurationCreateSchema = z.object({
  invoicePrefix: invoicePrefixSchema,
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
  logoUrl: optionalUrlSchema,
  faviconUrl: optionalUrlSchema,
  primaryColor: hexColor('#3b82f6'),
  secondaryColor: hexColor('#64748b'),
  accentColor: hexColor('#10b981'),
  tagline: z.string().optional().default(''),
});

export const brandingUpdateSchema = brandingCreateSchema.partial();

export const slugifyMasterName = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
