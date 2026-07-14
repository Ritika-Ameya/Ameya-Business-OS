import { z } from 'zod';

export const datePresetSchema = z.enum([
  'today',
  'this-week',
  'this-month',
  'last-month',
  'this-quarter',
  'this-year',
  'custom',
  'all',
]);

export const reportFiltersQuerySchema = z.object({
  datePreset: datePresetSchema.optional().default('this-month'),
  dateFrom: z.string().optional().default(''),
  dateTo: z.string().optional().default(''),
  customer: z.string().optional().default('all'),
  deal: z.string().optional().default('all'),
  status: z.string().optional().default('all'),
  category: z.string().optional().default('all'),
  employee: z.string().optional().default('all'),
  vendor: z.string().optional().default('all'),
  search: z.string().optional().default(''),
});

export type ReportFiltersQuery = z.infer<typeof reportFiltersQuerySchema>;
