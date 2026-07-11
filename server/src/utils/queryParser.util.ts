import type { ParsedQuery, PaginatedResult, QueryOptions } from '../types';
import { applyFilters } from './filtering.util';
import { paginateArray, parsePagination } from './pagination.util';
import { applySort } from './sorting.util';
import { parseFilters } from './filtering.util';
import { parseSort } from './sorting.util';

export const parseQueryParams = (
  query: Record<string, unknown>,
  defaults?: { page?: number; limit?: number },
): ParsedQuery => {
  return {
    pagination: parsePagination(query, defaults),
    filters: parseFilters(query),
    sort: parseSort(query),
  };
};

export const toQueryOptions = (parsed: ParsedQuery): QueryOptions => {
  return {
    pagination: parsed.pagination,
    filters: parsed.filters,
    sort: parsed.sort,
  };
};

export const applyQueryToItems = <T extends Record<string, unknown>>(
  items: T[],
  query: Record<string, unknown>,
): { items: T[]; parsedQuery: ParsedQuery } => {
  const parsedQuery = parseQueryParams(query);

  let result = applyFilters(items, parsedQuery.filters);
  result = applySort(result, parsedQuery.sort);

  return { items: result, parsedQuery };
};

export const applyQueryWithPagination = <T extends Record<string, unknown>>(
  items: T[],
  query: Record<string, unknown>,
): PaginatedResult<T> & { parsedQuery: ParsedQuery } => {
  const { items: filtered, parsedQuery } = applyQueryToItems(items, query);
  const paginated = paginateArray(filtered, parsedQuery.pagination);

  return { ...paginated, parsedQuery };
};
