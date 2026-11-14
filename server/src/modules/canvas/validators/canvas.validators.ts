import { z } from 'zod';

export const temperatureValueSchema = z.enum(['hot', 'warm', 'cold']);

export const sourceTypeSchema = z.enum([
  'invoice_balance',
  'invoice_installment',
  'renewal',
  'license',
  'subscription',
  'deal_advance',
  'deal_expected',
  'opportunity_conversion',
  'other',
]);

export const customerIdParamSchema = z.object({
  customerId: z.string().min(1),
});

export const dealIdParamSchema = z.object({
  dealId: z.string().min(1),
});

export const receiptIdParamSchema = z.object({
  id: z.string().min(1),
});

export const receiptPaymentParamsSchema = z.object({
  receiptId: z.string().min(1),
  index: z.coerce.number().int().min(0),
});

export const setTemperatureSchema = z.object({
  temperature: temperatureValueSchema.or(z.literal('')),
});

export const scheduleReceiptSchema = z.object({
  cardId: z.string().min(1),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM'),
});

const installmentPartSchema = z.object({
  /** GST-inclusive cash expected for this installment. */
  expectedAmount: z.coerce.number().min(0),
  expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  reason: z.string().trim().max(240).optional().default(''),
});

export const createReceiptSchema = z
  .object({
    customerId: z.string().min(1),
    /** 0 when the deal is not final and no amount is known yet. Total deal value when set. */
    expectedAmount: z.coerce.number().min(0).optional().default(0),
    /** Required when installments are omitted. Ignored when installments are sent. */
    expectedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
      .optional()
      .default(''),
    sourceType: sourceTypeSchema,
    reason: z.string().trim().max(240).optional().default(''),
    dealId: z.string().optional().default(''),
    invoiceId: z.string().optional().default(''),
    componentId: z.string().optional().default(''),
    /** 18 adds GST on the base amount. 0 keeps the base amount as the total. */
    gstPercent: z.union([z.literal(0), z.literal(18)]).optional(),
    /**
     * Optional payment schedule. One row = single expected receipt. Multiple rows
     * become separate board cards in each installment's month.
     */
    installments: z.array(installmentPartSchema).min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.installments && value.installments.length > 0) return;
    if (!value.expectedDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date must be YYYY-MM-DD',
        path: ['expectedDate'],
      });
    }
  });

export const updateReceiptSchema = z.object({
  cardId: z.string().min(1),
  expectedAmount: z.coerce.number().min(0).optional(),
  expectedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sourceType: sourceTypeSchema.optional(),
  reason: z.string().trim().max(240).optional(),
  status: z.enum(['expected', 'received', 'cancelled']).optional(),
  gstPercent: z.union([z.literal(0), z.literal(18)]).optional(),
});

export const updateReceiptPaymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  mode: z.string().trim().min(1, 'Payment mode is required'),
  receivedAccount: z.enum(['gst', 'other']).optional(),
  tdsAmount: z.coerce.number().min(0).optional().default(0),
  tdsSettles: z.boolean().optional().default(false),
});

export const dismissReceiptSchema = z.object({
  cardId: z.string().min(1),
});

export const splitReceiptSchema = z.object({
  invoiceId: z.string().min(1),
  parts: z
    .array(
      z.object({
        expectedAmount: z.coerce.number().positive(),
        expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        reason: z.string().trim().max(240).optional().default(''),
      }),
    )
    .min(2, 'An installment split needs at least two dates'),
});

export const markReceiptPaidSchema = z.object({
  cardId: z.string().min(1),
  /** Empty when the money is recorded on the forecast itself, with no invoice. */
  invoiceId: z.string().optional().default(''),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  mode: z.string().trim().min(1, 'Payment mode is required'),
  referenceNumber: z.string().trim().max(240).optional().default(''),
  notes: z.string().trim().max(2000).optional().default(''),
  removeGstReason: z.string().trim().max(2000).optional(),
  receivedAccount: z.enum(['gst', 'other']).optional(),
  tdsAmount: z.coerce.number().min(0).optional().default(0),
  tdsSettles: z.boolean().optional().default(false),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type MarkReceiptPaidInput = z.infer<typeof markReceiptPaidSchema>;
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;
export type SplitReceiptInput = z.infer<typeof splitReceiptSchema>;
