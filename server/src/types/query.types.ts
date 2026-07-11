import type { PaginationParams } from './pagination.types';

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  field: string;
  order: SortOrder;
}

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'like'
  | 'ilike';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

export interface ParsedQuery {
  pagination: PaginationParams;
  filters: FilterCondition[];
  sort: SortParams | null;
}

export interface QueryOptions {
  pagination?: PaginationParams;
  filters?: FilterCondition[];
  sort?: SortParams | null;
}
