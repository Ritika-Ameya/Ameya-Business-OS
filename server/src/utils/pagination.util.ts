import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../constants';
import type { PaginatedResult, PaginationMeta, PaginationParams } from '../types';

export { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT };

export const parsePagination = (
  query: Record<string, unknown>,
  defaults: { page?: number; limit?: number } = {},
): PaginationParams => {
  const page = Math.max(
    1,
    parseInt(String(query.page ?? defaults.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE,
  );

  const rawLimit =
    parseInt(String(query.limit ?? defaults.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

export const paginateArray = <T>(
  items: T[],
  pagination: PaginationParams,
): PaginatedResult<T> => {
  const total = items.length;
  const paginatedItems = items.slice(pagination.offset, pagination.offset + pagination.limit);

  return {
    items: paginatedItems,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, total),
  };
};

export const applyPagination = <T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResult<T> => {
  return paginateArray(items, { page, limit, offset: (page - 1) * limit });
};
