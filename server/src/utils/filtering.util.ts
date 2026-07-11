import type { FilterCondition, FilterOperator } from '../types';

const FILTER_OPERATOR_SUFFIXES: Record<string, FilterOperator> = {
  eq: 'eq',
  ne: 'ne',
  gt: 'gt',
  gte: 'gte',
  lt: 'lt',
  lte: 'lte',
  in: 'in',
  nin: 'nin',
  like: 'like',
  ilike: 'ilike',
};

const RESERVED_QUERY_KEYS = new Set([
  'page',
  'limit',
  'sort',
  'sortBy',
  'sortOrder',
  'order',
  'orderBy',
]);

const parseFilterValue = (value: unknown): string | number | boolean | string[] => {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  const strValue = String(value);

  if (strValue === 'true') return true;
  if (strValue === 'false') return false;

  const numValue = Number(strValue);
  if (!Number.isNaN(numValue) && strValue.trim() !== '') {
    return numValue;
  }

  if (strValue.includes(',')) {
    return strValue.split(',').map((v) => v.trim());
  }

  return strValue;
};

const parseFilterKey = (key: string): { field: string; operator: FilterOperator } => {
  const parts = key.split('__');

  if (parts.length === 2) {
    const suffix = parts[1];
    const operator = FILTER_OPERATOR_SUFFIXES[suffix];
    if (operator) {
      return { field: parts[0], operator };
    }
  }

  return { field: key, operator: 'eq' };
};

export const parseFilters = (query: Record<string, unknown>): FilterCondition[] => {
  const filters: FilterCondition[] = [];

  for (const [key, value] of Object.entries(query)) {
    if (RESERVED_QUERY_KEYS.has(key)) continue;
    if (value === undefined || value === null || value === '') continue;

    const { field, operator } = parseFilterKey(key);
    filters.push({
      field,
      operator,
      value: parseFilterValue(value),
    });
  }

  return filters;
};

export const applyFilters = <T extends Record<string, unknown>>(
  items: T[],
  filters: FilterCondition[],
): T[] => {
  if (filters.length === 0) return items;

  return items.filter((item) =>
    filters.every((filter) => matchesFilter(item[filter.field], filter)),
  );
};

const matchesFilter = (fieldValue: unknown, filter: FilterCondition): boolean => {
  const { operator, value } = filter;

  switch (operator) {
    case 'eq':
      return fieldValue === value;
    case 'ne':
      return fieldValue !== value;
    case 'gt':
      return compareValues(fieldValue, value) > 0;
    case 'gte':
      return compareValues(fieldValue, value) >= 0;
    case 'lt':
      return compareValues(fieldValue, value) < 0;
    case 'lte':
      return compareValues(fieldValue, value) <= 0;
    case 'in':
      return Array.isArray(value) && value.includes(String(fieldValue));
    case 'nin':
      return Array.isArray(value) && !value.includes(String(fieldValue));
    case 'like':
      return (
        typeof fieldValue === 'string' &&
        typeof value === 'string' &&
        fieldValue.includes(value.replace(/%/g, ''))
      );
    case 'ilike':
      return (
        typeof fieldValue === 'string' &&
        typeof value === 'string' &&
        fieldValue.toLowerCase().includes(value.replace(/%/g, '').toLowerCase())
      );
    default:
      return true;
  }
};

const compareValues = (a: unknown, b: unknown): number => {
  const numA = Number(a);
  const numB = Number(b);

  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }

  return String(a).localeCompare(String(b));
};

export { RESERVED_QUERY_KEYS };
