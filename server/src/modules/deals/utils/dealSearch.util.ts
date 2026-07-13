import type { DealEntity, DealSearchField, DealSearchMode } from '../types/deal.entities';
import { DEAL_SEARCH_FIELDS } from '../types/deal.entities';

const normalize = (value: unknown): string => String(value ?? '').trim().toLowerCase();

const matchesMode = (fieldValue: string, query: string, mode: DealSearchMode): boolean => {
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

export const applyDealSearch = (
  items: DealEntity[],
  query: string | undefined,
  mode: DealSearchMode = 'contains',
  fields: readonly DealSearchField[] = DEAL_SEARCH_FIELDS,
): DealEntity[] => {
  const q = normalize(query);
  if (!q) return items;

  return items.filter((item) =>
    fields.some((field) => matchesMode(normalize(item[field]), q, mode)),
  );
};

export const parseDealSearchMode = (value: unknown): DealSearchMode => {
  const mode = String(value ?? 'contains').trim();
  if (mode === 'startsWith' || mode === 'exact' || mode === 'contains') return mode;
  return 'contains';
};

export const parseDealSearchFields = (value: unknown): DealSearchField[] => {
  if (value === undefined || value === null || value === '') {
    return [...DEAL_SEARCH_FIELDS];
  }

  const requested = String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const allowed = new Set<string>(DEAL_SEARCH_FIELDS);
  const fields = requested.filter((field): field is DealSearchField => allowed.has(field));
  return fields.length > 0 ? fields : [...DEAL_SEARCH_FIELDS];
};
