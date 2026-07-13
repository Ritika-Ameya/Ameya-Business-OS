import type { CustomerEntity, CustomerSearchField, SearchMode } from '../types/customer.entities';
import { CUSTOMER_SEARCH_FIELDS } from '../types/customer.entities';

const normalize = (value: unknown): string => String(value ?? '').trim().toLowerCase();

const matchesMode = (fieldValue: string, query: string, mode: SearchMode): boolean => {
  switch (mode) {
    case 'exact':
      return fieldValue === query;
    case 'startsWith':
      return fieldValue.startsWith(query);
    case 'contains':
    default:
      return fieldValue.includes(query);
  }
};

export const applyCustomerSearch = (
  items: CustomerEntity[],
  query: string | undefined,
  mode: SearchMode = 'contains',
  fields: readonly CustomerSearchField[] = CUSTOMER_SEARCH_FIELDS,
): CustomerEntity[] => {
  const q = normalize(query);
  if (!q) {
    return items;
  }

  return items.filter((item) =>
    fields.some((field) => matchesMode(normalize(item[field]), q, mode)),
  );
};

export const parseSearchMode = (value: unknown): SearchMode => {
  const mode = String(value ?? 'contains').trim();
  if (mode === 'startsWith' || mode === 'exact' || mode === 'contains') {
    return mode;
  }
  return 'contains';
};

export const parseSearchFields = (value: unknown): CustomerSearchField[] => {
  if (value === undefined || value === null || value === '') {
    return [...CUSTOMER_SEARCH_FIELDS];
  }

  const requested = String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const allowed = new Set<string>(CUSTOMER_SEARCH_FIELDS);
  const fields = requested.filter((field): field is CustomerSearchField => allowed.has(field));
  return fields.length > 0 ? fields : [...CUSTOMER_SEARCH_FIELDS];
};
