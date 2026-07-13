import { z } from 'zod';

import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../constants';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

/** Field names must stay aligned with SORT_QUERY_KEYS in constants/query.constants.ts */
export const sortQuerySchema = z.object({
  sort: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  orderBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SortQuery = z.infer<typeof sortQuerySchema>;
export type IdParam = z.infer<typeof idParamSchema>;
