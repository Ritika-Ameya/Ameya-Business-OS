import type { SortOrder, SortParams } from '../types';

export const DEFAULT_SORT_ORDER: SortOrder = 'asc';

export const parseSort = (query: Record<string, unknown>): SortParams | null => {
  if (query.sort && typeof query.sort === 'string') {
    return parseSortString(query.sort);
  }

  const sortBy = query.sortBy ?? query.orderBy;
  if (sortBy && typeof sortBy === 'string') {
    const order = normalizeSortOrder(String(query.sortOrder ?? query.order ?? DEFAULT_SORT_ORDER));
    return { field: sortBy, order };
  }

  return null;
};

export const parseSortString = (sort: string): SortParams | null => {
  const trimmed = sort.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(':');
  const field = parts[0]?.trim();
  if (!field) return null;

  const order = normalizeSortOrder(parts[1]?.trim() ?? DEFAULT_SORT_ORDER);
  return { field, order };
};

export const normalizeSortOrder = (order: string): SortOrder => {
  const normalized = order.toLowerCase();
  return normalized === 'desc' ? 'desc' : 'asc';
};

export const applySort = <T extends Record<string, unknown>>(
  items: T[],
  sort: SortParams | null,
): T[] => {
  if (!sort) return items;

  const { field, order } = sort;
  const multiplier = order === 'desc' ? -1 : 1;

  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal === bVal) return 0;
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * multiplier;
    }

    return String(aVal).localeCompare(String(bVal)) * multiplier;
  });
};

export const applyMultiSort = <T extends Record<string, unknown>>(
  items: T[],
  sorts: SortParams[],
): T[] => {
  if (sorts.length === 0) return items;

  return [...items].sort((a, b) => {
    for (const sort of sorts) {
      const sorted = applySort([a, b], sort);
      if (sorted[0] !== a) return 1;
      if (sorted[0] !== b && sorted[1] === a) return -1;
    }
    return 0;
  });
};
