import type { BaseEntity } from '../../../types';
import { createBaseEntityMapper } from '../../../utils/entityMapper.util';
import { parseBoolean, parseNumberField } from '../../../utils/sheetMapper.util';
import type { ExpenseEntity, ExpenseMasterEntity } from '../types/expense.entities';

const str = (record: Record<string, string>, key: string, fallback = ''): string =>
  record[key] ?? fallback;

const bool = (record: Record<string, string>, key: string, fallback = false): boolean => {
  const raw = record[key];
  if (raw === undefined || raw === '') return fallback;
  return parseBoolean(raw);
};

const num = (record: Record<string, string>, key: string, fallback = 0): number =>
  parseNumberField(record[key], fallback);

const rowStr = (entity: Partial<Record<string, unknown>>, key: string): string =>
  String(entity[key] ?? '');

const rowBool = (entity: Partial<Record<string, unknown>>, key: string): string =>
  String(entity[key] ?? false);

export const expenseMapper = createBaseEntityMapper<ExpenseEntity>(
  (record, base: BaseEntity) => ({
    ...base,
    expenseDate: str(record, 'expenseDate'),
    name: str(record, 'name'),
    categoryId: str(record, 'categoryId'),
    categoryName: str(record, 'categoryName'),
    payeeType: (str(record, 'payeeType', 'vendor') as ExpenseEntity['payeeType']),
    vendorOrEmployee: str(record, 'vendorOrEmployee'),
    vendorId: str(record, 'vendorId'),
    employeeId: str(record, 'employeeId'),
    amount: num(record, 'amount'),
    currency: str(record, 'currency', 'INR'),
    status: (str(record, 'status', 'pending') as ExpenseEntity['status']),
    paymentMethod: str(record, 'paymentMethod'),
    referenceNumber: str(record, 'referenceNumber'),
    notes: str(record, 'notes'),
    hasAttachment: bool(record, 'hasAttachment'),
    recurring: bool(record, 'recurring'),
    masterTemplateId: str(record, 'masterTemplateId'),
    generatedPeriod: str(record, 'generatedPeriod'),
  }),
  (entity) => ({
    expenseDate: rowStr(entity, 'expenseDate'),
    name: rowStr(entity, 'name'),
    categoryId: rowStr(entity, 'categoryId'),
    categoryName: rowStr(entity, 'categoryName'),
    payeeType: rowStr(entity, 'payeeType'),
    vendorOrEmployee: rowStr(entity, 'vendorOrEmployee'),
    vendorId: rowStr(entity, 'vendorId'),
    employeeId: rowStr(entity, 'employeeId'),
    amount: String(entity.amount ?? 0),
    currency: rowStr(entity, 'currency'),
    status: rowStr(entity, 'status'),
    paymentMethod: rowStr(entity, 'paymentMethod'),
    referenceNumber: rowStr(entity, 'referenceNumber'),
    notes: rowStr(entity, 'notes'),
    hasAttachment: rowBool(entity, 'hasAttachment'),
    recurring: rowBool(entity, 'recurring'),
    masterTemplateId: rowStr(entity, 'masterTemplateId'),
    generatedPeriod: rowStr(entity, 'generatedPeriod'),
  }),
);

export const expenseMasterMapper = createBaseEntityMapper<ExpenseMasterEntity>(
  (record, base: BaseEntity) => ({
    ...base,
    name: str(record, 'name'),
    categoryId: str(record, 'categoryId'),
    categoryName: str(record, 'categoryName'),
    payeeType: (str(record, 'payeeType', 'vendor') as ExpenseMasterEntity['payeeType']),
    vendorOrEmployee: str(record, 'vendorOrEmployee'),
    vendorId: str(record, 'vendorId'),
    employeeId: str(record, 'employeeId'),
    defaultAmount: num(record, 'defaultAmount'),
    frequency: (str(record, 'frequency', 'monthly') as ExpenseMasterEntity['frequency']),
    startDate: str(record, 'startDate'),
    endDate: str(record, 'endDate'),
    autoGenerate: bool(record, 'autoGenerate', true),
    status: (str(record, 'status', 'active') as ExpenseMasterEntity['status']),
  }),
  (entity) => ({
    name: rowStr(entity, 'name'),
    categoryId: rowStr(entity, 'categoryId'),
    categoryName: rowStr(entity, 'categoryName'),
    payeeType: rowStr(entity, 'payeeType'),
    vendorOrEmployee: rowStr(entity, 'vendorOrEmployee'),
    vendorId: rowStr(entity, 'vendorId'),
    employeeId: rowStr(entity, 'employeeId'),
    defaultAmount: String(entity.defaultAmount ?? 0),
    frequency: rowStr(entity, 'frequency'),
    startDate: rowStr(entity, 'startDate'),
    endDate: rowStr(entity, 'endDate'),
    autoGenerate: rowBool(entity, 'autoGenerate'),
    status: rowStr(entity, 'status'),
  }),
);
