import type { BaseEntity } from '../../../types';
import type {
  ExpenseFrequency,
  ExpenseMasterStatus,
  ExpensePayeeType,
  ExpenseTransactionStatus,
} from '../../../types/entity.contracts';

export type {
  ExpenseFrequency,
  ExpenseMasterStatus,
  ExpensePayeeType,
  ExpenseTransactionStatus,
} from '../../../types/entity.contracts';

export type ExpenseEntityBase = BaseEntity & Record<string, unknown>;

/** Sheet-backed expense transaction (index signature for repository generics). */
export interface ExpenseEntity extends ExpenseEntityBase {
  expenseDate: string;
  name: string;
  categoryId: string;
  categoryName: string;
  payeeType: ExpensePayeeType;
  vendorOrEmployee: string;
  vendorId: string;
  employeeId: string;
  amount: number;
  currency: string;
  status: ExpenseTransactionStatus;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
  hasAttachment: boolean;
  recurring: boolean;
  masterTemplateId: string;
  generatedPeriod: string;
}

/** Sheet-backed recurring expense template. */
export interface ExpenseMasterEntity extends ExpenseEntityBase {
  name: string;
  categoryId: string;
  categoryName: string;
  payeeType: ExpensePayeeType;
  vendorOrEmployee: string;
  vendorId: string;
  employeeId: string;
  defaultAmount: number;
  frequency: ExpenseFrequency;
  startDate: string;
  endDate: string;
  autoGenerate: boolean;
  status: ExpenseMasterStatus;
}

export const EXPENSE_SEARCH_FIELDS = [
  'name',
  'vendorOrEmployee',
  'referenceNumber',
  'categoryName',
  'notes',
  'paymentMethod',
  'generatedPeriod',
] as const;

export const EXPENSE_MASTER_SEARCH_FIELDS = [
  'name',
  'vendorOrEmployee',
  'categoryName',
] as const;

export type ExpenseSearchField = (typeof EXPENSE_SEARCH_FIELDS)[number];
export type ExpenseMasterSearchField = (typeof EXPENSE_MASTER_SEARCH_FIELDS)[number];
export type SearchMode = 'contains' | 'startsWith' | 'exact';
