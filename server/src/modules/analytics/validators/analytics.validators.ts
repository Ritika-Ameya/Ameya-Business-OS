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

export const dashboardPeriodSchema = z.enum([
  'last-6-months',
  'this-month',
  'last-month',
  'this-year',
  'year',
  'month',
  'custom',
  'all',
]);

export const dashboardQuerySchema = z.object({
  period: dashboardPeriodSchema.optional().default('last-6-months'),
  dateFrom: z.string().optional().default(''),
  dateTo: z.string().optional().default(''),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

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
