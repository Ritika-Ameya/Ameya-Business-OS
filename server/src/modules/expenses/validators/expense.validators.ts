import { z } from 'zod';

export const expenseStatusSchema = z.enum(['paid', 'pending', 'partial', 'cancelled']);
export const expensePayeeTypeSchema = z.enum(['vendor', 'employee']);
export const expenseMasterStatusSchema = z.enum(['active', 'inactive']);
export const expenseFrequencySchema = z.enum([
  'monthly',
  'quarterly',
  'half-yearly',
  'yearly',
  'one-time',
]);

export const expenseCreateSchema = z.object({
  expenseDate: z.string().min(1, 'Expense date is required'),
  name: z.string().min(1, 'Expense name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  payeeType: expensePayeeTypeSchema.default('vendor'),
  vendorOrEmployee: z.string().min(1, 'Vendor or employee is required'),
  vendorId: z.string().optional().default(''),
  employeeId: z.string().optional().default(''),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  status: expenseStatusSchema.default('pending'),
  paymentMethod: z.string().default(''),
  referenceNumber: z.string().default(''),
  notes: z.string().default(''),
  recurring: z.boolean().default(false),
  masterTemplateId: z.string().default(''),
  generatedPeriod: z.string().default(''),
  currency: z.string().default('INR'),
});

export const expenseUpdateSchema = z.object({
  expenseDate: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  payeeType: expensePayeeTypeSchema.optional(),
  vendorOrEmployee: z.string().min(1).optional(),
  vendorId: z.string().optional(),
  employeeId: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be greater than 0').optional(),
  status: expenseStatusSchema.optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  recurring: z.boolean().optional(),
  masterTemplateId: z.string().optional(),
  generatedPeriod: z.string().optional(),
  currency: z.string().optional(),
});

export const expenseStatusChangeSchema = z.object({
  status: expenseStatusSchema,
});

export const expenseMasterCreateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  payeeType: expensePayeeTypeSchema.default('vendor'),
  vendorOrEmployee: z.string().min(1, 'Vendor or employee is required'),
  vendorId: z.string().optional().default(''),
  employeeId: z.string().optional().default(''),
  defaultAmount: z.coerce.number().positive('Default amount must be greater than 0'),
  frequency: expenseFrequencySchema,
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().default(''),
  autoGenerate: z.boolean().default(true),
  status: expenseMasterStatusSchema.default('active'),
});

export const expenseMasterUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  payeeType: expensePayeeTypeSchema.optional(),
  vendorOrEmployee: z.string().min(1).optional(),
  vendorId: z.string().optional(),
  employeeId: z.string().optional(),
  defaultAmount: z.coerce
    .number()
    .positive('Default amount must be greater than 0')
    .optional(),
  frequency: expenseFrequencySchema.optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().optional(),
  autoGenerate: z.boolean().optional(),
  status: expenseMasterStatusSchema.optional(),
});

export const expenseDocumentCreateSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  fileType: z.string().default(''),
  mimeType: z.string().default(''),
  size: z.coerce.number().int().min(0).default(0),
});

export const expenseIdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const expenseFileParamsSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  fileId: z.string().min(1, 'File ID is required'),
});

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
export type ExpenseMasterCreateInput = z.infer<typeof expenseMasterCreateSchema>;
export type ExpenseMasterUpdateInput = z.infer<typeof expenseMasterUpdateSchema>;
export type ExpenseDocumentCreateInput = z.infer<typeof expenseDocumentCreateSchema>;
