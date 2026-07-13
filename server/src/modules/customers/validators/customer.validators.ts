import { z } from 'zod';

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

const phoneSchema = z
  .string()
  .min(1, 'Phone is required')
  .refine((value) => /^[+]?[\d\s()-]{7,20}$/.test(value), {
    message: 'Invalid phone number',
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
  .transform((value) => value.trim().toUpperCase())
  .refine(
    (value) =>
      value === '' ||
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(value),
    { message: 'Invalid GSTIN format' },
  );

const optionalIdSchema = z.string().default('');

const optionalDateSchema = z.string().default('');

const tagsSchema = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .default([])
  .transform((value) => {
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
  });

export const recordTypeSchema = z.enum(['opportunity', 'customer']);
export const customerStatusSchema = z.enum(['active', 'inactive', 'prospect']);

const customerFieldsSchema = z.object({
  recordType: recordTypeSchema.default('opportunity'),
  status: customerStatusSchema.optional(),
  currentStageId: optionalIdSchema,
  companyName: z.string().default(''),
  gstin: optionalGstinSchema,
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

export const customerCreateSchema = customerFieldsSchema;

export const customerUpdateSchema = customerFieldsSchema.partial().extend({
  contactPerson: z.string().min(1, 'Contact person is required').optional(),
  phone: phoneSchema.optional(),
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
