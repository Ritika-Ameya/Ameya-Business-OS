import type { InvoiceEntity, InvoiceSearchField, SearchMode } from '../types/revenue.entities';
import { INVOICE_SEARCH_FIELDS } from '../types/revenue.entities';

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

export const applyInvoiceSearch = (
  items: InvoiceEntity[],
  query: string | undefined,
  mode: SearchMode = 'contains',
  fields: readonly InvoiceSearchField[] = INVOICE_SEARCH_FIELDS,
): InvoiceEntity[] => {
  const q = normalize(query);
  if (!q) return items;
  return items.filter((item) =>
    fields.some((field) => matchesMode(normalize(item[field]), q, mode)),
  );
};

export const parseSearchMode = (value: unknown): SearchMode => {
  const mode = String(value ?? 'contains').trim();
  if (mode === 'startsWith' || mode === 'exact' || mode === 'contains') return mode;
  return 'contains';
};

export const parseSearchFields = (value: unknown): InvoiceSearchField[] => {
  if (!value) return [...INVOICE_SEARCH_FIELDS];
  const requested = String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const allowed = new Set<string>(INVOICE_SEARCH_FIELDS);
  const fields = requested.filter((field): field is InvoiceSearchField => allowed.has(field));
  return fields.length > 0 ? fields : [...INVOICE_SEARCH_FIELDS];
};
