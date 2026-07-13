import { z } from 'zod';

export const invoiceStatusSchema = z.enum(['draft', 'sent', 'partial', 'paid', 'overdue']);
export const paymentStatusSchema = z.enum(['received', 'pending', 'failed']);

export const invoiceCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().default(''),
  dealId: z.string().min(1, 'Deal is required'),
  dealTitle: z.string().default(''),
  status: invoiceStatusSchema.default('draft'),
  issueDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  subtotal: z.coerce.number().min(0).default(0),
  taxPercent: z.coerce.number().min(0).max(100).default(18),
  tax: z.coerce.number().min(0).optional(),
  total: z.coerce.number().min(0).optional(),
  currency: z.string().default('INR'),
  componentIds: z.array(z.string()).default([]),
  notes: z.string().max(5000).default(''),
  invoiceNumber: z.string().default(''),
});

export const invoiceUpdateSchema = invoiceCreateSchema.partial().extend({
  customerId: z.string().min(1).optional(),
  dealId: z.string().min(1).optional(),
  issueDate: z.string().min(1).optional(),
  dueDate: z.string().min(1).optional(),
});

export const invoiceStatusChangeSchema = z.object({
  status: invoiceStatusSchema,
});

export const paymentCreateSchema = z.object({
  paymentDate: z.string().min(1, 'Payment date is required'),
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  mode: z.string().min(1, 'Payment mode is required'),
  referenceNumber: z.string().default(''),
  receivedBy: z.string().default(''),
  transactionId: z.string().default(''),
  notes: z.string().default(''),
  status: paymentStatusSchema.default('received'),
  currency: z.string().default('INR'),
});

export const paymentUpdateSchema = paymentCreateSchema.partial();

export const invoiceDocumentCreateSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  fileType: z.string().default(''),
  mimeType: z.string().default(''),
  size: z.coerce.number().int().min(0).default(0),
});

export const invoiceIdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const invoicePaymentParamsSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
});

export const invoiceFileParamsSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  fileId: z.string().min(1, 'File ID is required'),
});

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
export type InvoiceDocumentCreateInput = z.infer<typeof invoiceDocumentCreateSchema>;
