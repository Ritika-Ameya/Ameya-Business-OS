import { z } from 'zod';
import { hasRenewalFrequency } from '../utils/renewalHelpers.util';

export const dealStatusSchema = z.enum(['draft', 'active', 'completed', 'on-hold']);
export const billingTypeSchema = z.enum([
  'one-time',
  'monthly',
  'quarterly',
  'half-yearly',
  'yearly',
]);
export const componentStatusSchema = z.enum(['pending', 'in-progress', 'completed']);
export const componentRenewalFrequencySchema = z.enum([
  'none',
  'monthly',
  'quarterly',
  'half-yearly',
  'yearly',
  'biennial',
  'custom',
]);

const optionalDateSchema = z.string().default('');

export const dealCreateSchema = z.object({
  title: z.string().min(1, 'Deal name is required').max(200),
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().default(''),
  status: dealStatusSchema.default('draft'),
  currentStageId: z.string().default(''),
  dealType: z.string().min(1, 'Deal type is required'),
  contractValue: z.coerce.number().positive('Contract value must be greater than 0'),
  currency: z.string().default('INR'),
  probability: z.coerce.number().min(0).max(100).default(0),
  startDate: z.string().min(1, 'Start date is required'),
  expectedCloseDate: optionalDateSchema,
  actualCloseDate: optionalDateSchema,
  nextActionDate: optionalDateSchema,
  owner: z.string().default(''),
  description: z.string().max(5000).default(''),
  notes: z.string().max(5000).default(''),
  dealNumber: z.string().default(''),
});

export const dealUpdateSchema = dealCreateSchema.partial().extend({
  title: z.string().min(1, 'Deal name is required').max(200).optional(),
  customerId: z.string().min(1, 'Customer is required').optional(),
  dealType: z.string().min(1, 'Deal type is required').optional(),
  contractValue: z.coerce.number().positive('Contract value must be greater than 0').optional(),
  startDate: z.string().min(1, 'Start date is required').optional(),
});

export const dealStageChangeSchema = z.object({
  stageId: z.string().min(1, 'Stage is required'),
  nextActionDate: z.string().optional(),
  notes: z.string().optional(),
});

export const dealStatusChangeSchema = z.object({
  status: dealStatusSchema,
});

export const dealTimelineNoteSchema = z.object({
  notes: z.string().min(1, 'Notes are required').max(5000),
  nextActionDate: z.string().optional(),
});

const componentRenewalRefine = <T extends {
  renewalFrequency?: string;
  renewalStartDate?: string;
  renewalDate?: string;
}>(
  data: T,
  ctx: z.RefinementCtx,
) => {
  const frequency = data.renewalFrequency ?? 'none';
  if (!hasRenewalFrequency(frequency)) return;

  if (!String(data.renewalStartDate ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Renewal start date is required when renewal frequency is selected',
      path: ['renewalStartDate'],
    });
  }

  if (frequency === 'custom' && !String(data.renewalDate ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Custom renewal date is required when frequency is Custom Date',
      path: ['renewalDate'],
    });
  }
};

export const dealComponentCreateSchema = z
  .object({
    name: z.string().min(1, 'Component name is required'),
    category: z.string().default(''),
    description: z.string().default(''),
    amount: z.coerce.number().min(0, 'Amount must be 0 or greater'),
    gstPercent: z.coerce.number().min(0).max(100).default(0),
    quantity: z.coerce.number().positive('Quantity must be greater than 0').default(1),
    discount: z.coerce.number().min(0).default(0),
    billingType: billingTypeSchema.default('one-time'),
    status: componentStatusSchema.default('pending'),
    renewalFrequency: componentRenewalFrequencySchema.default('none'),
    renewalStartDate: z.string().default(''),
    renewalDate: z.string().default(''),
    lastRenewedDate: z.string().default(''),
  })
  .superRefine(componentRenewalRefine);

export const dealComponentUpdateSchema = z
  .object({
    name: z.string().min(1, 'Component name is required').optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    amount: z.coerce.number().min(0, 'Amount must be 0 or greater').optional(),
    gstPercent: z.coerce.number().min(0).max(100).optional(),
    quantity: z.coerce.number().positive('Quantity must be greater than 0').optional(),
    discount: z.coerce.number().min(0).optional(),
    billingType: billingTypeSchema.optional(),
    status: componentStatusSchema.optional(),
    renewalFrequency: componentRenewalFrequencySchema.optional(),
    renewalStartDate: z.string().optional(),
    renewalDate: z.string().optional(),
    lastRenewedDate: z.string().optional(),
  })
  .superRefine(componentRenewalRefine);

export const dealDocumentCreateSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  fileType: z.string().default(''),
  mimeType: z.string().default(''),
  size: z.coerce.number().int().min(0).default(0),
  contentBase64: z.string().min(1, 'File content is required'),
});

export const dealIdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const dealComponentParamsSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  componentId: z.string().min(1, 'Component ID is required'),
});

export const dealFileParamsSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  fileId: z.string().min(1, 'File ID is required'),
});

export type DealCreateInput = z.infer<typeof dealCreateSchema>;
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>;
export type DealStageChangeInput = z.infer<typeof dealStageChangeSchema>;
export type DealStatusChangeInput = z.infer<typeof dealStatusChangeSchema>;
export type DealTimelineNoteInput = z.infer<typeof dealTimelineNoteSchema>;
export type DealComponentCreateInput = z.infer<typeof dealComponentCreateSchema>;
export type DealComponentUpdateInput = z.infer<typeof dealComponentUpdateSchema>;
export type DealDocumentCreateInput = z.infer<typeof dealDocumentCreateSchema>;
