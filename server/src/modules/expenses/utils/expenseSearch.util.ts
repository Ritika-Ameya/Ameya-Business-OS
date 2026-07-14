import type {
  ExpenseEntity,
  ExpenseMasterEntity,
  ExpenseMasterSearchField,
  ExpenseSearchField,
  SearchMode,
} from '../types/expense.entities';
import {
  EXPENSE_MASTER_SEARCH_FIELDS,
  EXPENSE_SEARCH_FIELDS,
} from '../types/expense.entities';

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

export const applyExpenseSearch = (
  items: ExpenseEntity[],
  query: string | undefined,
  mode: SearchMode = 'contains',
  fields: readonly ExpenseSearchField[] = EXPENSE_SEARCH_FIELDS,
): ExpenseEntity[] => {
  const q = normalize(query);
  if (!q) return items;
  return items.filter((item) =>
    fields.some((field) => matchesMode(normalize(item[field]), q, mode)),
  );
};

export const applyExpenseMasterSearch = (
  items: ExpenseMasterEntity[],
  query: string | undefined,
  mode: SearchMode = 'contains',
  fields: readonly ExpenseMasterSearchField[] = EXPENSE_MASTER_SEARCH_FIELDS,
): ExpenseMasterEntity[] => {
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

export const parseExpenseSearchFields = (value: unknown): ExpenseSearchField[] => {
  if (!value) return [...EXPENSE_SEARCH_FIELDS];
  const requested = String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const allowed = new Set<string>(EXPENSE_SEARCH_FIELDS);
  const fields = requested.filter((field): field is ExpenseSearchField => allowed.has(field));
  return fields.length > 0 ? fields : [...EXPENSE_SEARCH_FIELDS];
};

export const parseExpenseMasterSearchFields = (
  value: unknown,
): ExpenseMasterSearchField[] => {
  if (!value) return [...EXPENSE_MASTER_SEARCH_FIELDS];
  const requested = String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const allowed = new Set<string>(EXPENSE_MASTER_SEARCH_FIELDS);
  const fields = requested.filter((field): field is ExpenseMasterSearchField =>
    allowed.has(field),
  );
  return fields.length > 0 ? fields : [...EXPENSE_MASTER_SEARCH_FIELDS];
};
