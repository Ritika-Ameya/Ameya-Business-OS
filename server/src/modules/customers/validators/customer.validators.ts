import { z } from 'zod';
import { normalizePhoneToE164 } from '../../../utils/phone.util';

const isOptionalEmail = (value: string): boolean =>
  value === '' || z.string().email().safeParse(value).success;

const isOptionalWebsite = (value: string): boolean =>
  value === '' ||
  /^https?:\/\/.+/i.test(value) ||
  /^[\w.-]+\.[a-z]{2,}([/:].*)?$/i.test(value);

const optionalEmailSchema = z
  .string()
  .default('')
  .refine(isOptionalEmail, {
    message: 'Invalid email address',
  });

const optionalWebsiteSchema = z
  .string()
  .default('')
  .refine(isOptionalWebsite, { message: 'Invalid website URL' });

const phoneSchema = z
  .string()
  .min(1, 'Phone is required')
  .transform((value, ctx) => {
    try {
      return normalizePhoneToE164(value, { required: true });
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: (error as Error).message || 'Please enter a valid mobile number.',
      });
      return z.NEVER;
    }
  });

const normalizeOptionalPhone = (value: string, ctx: z.RefinementCtx): string => {
  try {
    return normalizePhoneToE164(value);
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: (error as Error).message || 'Please enter a valid mobile number.',
    });
    return z.NEVER;
  }
};

const optionalPhoneSchema = z.string().default('').transform(normalizeOptionalPhone);

const isOptionalGstin = (value: string): boolean =>
  value === '' || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(value);

const optionalGstinSchema = z
  .string()
  .default('')
  .transform((value) => value.trim().toUpperCase())
  .refine(isOptionalGstin, { message: 'Invalid GSTIN format' });

const optionalIdSchema = z.string().default('');

const optionalDateSchema = z.string().default('');

const parseTagsInput = (value: string[] | string): string[] => {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  if (!value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.map((item) => String(item));
  } catch {
    // CSV fallback
  }
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
};

const tagsSchema = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .default([])
  .transform(parseTagsInput);

export const recordTypeSchema = z.enum(['opportunity', 'customer']);
export const customerStatusSchema = z.enum(['active', 'inactive', 'prospect']);

const customerFieldsSchema = z.object({
  recordType: recordTypeSchema.default('opportunity'),
  status: customerStatusSchema.optional(),
  currentStageId: optionalIdSchema,
  companyName: z.string().default(''),
  gstin: optionalGstinSchema,
  vatId: z.string().default(''),
  licenseNo: z.string().default(''),
  industryId: optionalIdSchema,
  sourceId: optionalIdSchema,
  contactPerson: z.string().min(1, 'Contact person is required'),
  phone: phoneSchema,
  alternatePhone: optionalPhoneSchema,
  email: optionalEmailSchema,
  website: optionalWebsiteSchema,
  billingAddress: z.string().default(''),
  serviceAddress: z.string().default(''),
  countryId: optionalIdSchema,
  stateId: optionalIdSchema,
  city: z.string().default(''),
  pincode: z.string().default(''),
  notes: z.string().default(''),
  businessValue: z.coerce.number().min(0).default(0),
  expectedRevenue: z.coerce.number().min(0).default(0),
  nextActionDate: optionalDateSchema,
  lastContactDate: optionalDateSchema,
  renewalDate: optionalDateSchema,
  outstandingAmount: z.coerce.number().min(0).default(0),
  tags: tagsSchema,
  isActive: z.boolean().default(true),
  activeDeals: z.coerce.number().int().min(0).default(0),
  lastPayment: optionalDateSchema,
  businessSince: optionalDateSchema,
});

export const customerCreateSchema = customerFieldsSchema.extend({
  /** When true, skip companyName uniqueness and allow a second record with the same company. */
  allowDuplicateCompanyName: z.boolean().optional().default(false),
});

/**
 * Update accepts only the fields that were sent. Zod 4 applies `.default()`
 * even inside `.partial()`, so deriving this from the create schema would
 * reset omitted fields (record type, stage, dates, values) on every edit.
 */
export const customerUpdateSchema = z.object({
  recordType: recordTypeSchema.optional(),
  status: customerStatusSchema.optional(),
  currentStageId: z.string().optional(),
  companyName: z.string().optional(),
  gstin: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .refine(isOptionalGstin, { message: 'Invalid GSTIN format' })
    .optional(),
  vatId: z.string().optional(),
  licenseNo: z.string().optional(),
  industryId: z.string().optional(),
  sourceId: z.string().optional(),
  contactPerson: z.string().min(1, 'Contact person is required').optional(),
  phone: phoneSchema.optional(),
  alternatePhone: z.string().transform(normalizeOptionalPhone).optional(),
  email: z.string().refine(isOptionalEmail, { message: 'Invalid email address' }).optional(),
  website: z.string().refine(isOptionalWebsite, { message: 'Invalid website URL' }).optional(),
  billingAddress: z.string().optional(),
  serviceAddress: z.string().optional(),
  countryId: z.string().optional(),
  stateId: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  notes: z.string().optional(),
  businessValue: z.coerce.number().min(0).optional(),
  expectedRevenue: z.coerce.number().min(0).optional(),
  nextActionDate: z.string().optional(),
  lastContactDate: z.string().optional(),
  renewalDate: z.string().optional(),
  outstandingAmount: z.coerce.number().min(0).optional(),
  tags: z.union([z.array(z.string()), z.string()]).transform(parseTagsInput).optional(),
  isActive: z.boolean().optional(),
  activeDeals: z.coerce.number().int().min(0).optional(),
  lastPayment: z.string().optional(),
  businessSince: z.string().optional(),
  allowDuplicateCompanyName: z.boolean().optional(),
});

export const customerStageChangeSchema = z.object({
  stageId: z.string().min(1, 'Stage is required'),
  nextActionDate: z.string().optional(),
  notes: z.string().optional(),
});

export const customerRecordTypeChangeSchema = z.object({
  recordType: recordTypeSchema,
});

export const customerTimelineNoteSchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
  nextActionDate: z.string().optional(),
});

export const customerDocumentCreateSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  fileType: z.string().default(''),
  mimeType: z.string().default(''),
  size: z.coerce.number().int().min(0).default(0),
  contentBase64: z.string().min(1, 'File content is required'),
});

export const customerIdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const customerFileParamsSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  fileId: z.string().min(1, 'File ID is required'),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type CustomerStageChangeInput = z.infer<typeof customerStageChangeSchema>;
export type CustomerRecordTypeChangeInput = z.infer<typeof customerRecordTypeChangeSchema>;
export type CustomerTimelineNoteInput = z.infer<typeof customerTimelineNoteSchema>;
export type CustomerDocumentCreateInput = z.infer<typeof customerDocumentCreateSchema>;
