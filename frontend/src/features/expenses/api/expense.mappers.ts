import type {
  ExpenseMasterTemplate,
  ExpenseTransaction,
  ExpenseMasterFormData,
  ExpenseTransactionFormData,
} from "@/features/expenses/types/expense";
import type {
  ExpenseCreateBody,
  ExpenseDto,
  ExpenseMasterCreateBody,
  ExpenseMasterDto,
} from "@/features/expenses/api/expense.dto";
import { parseAmount } from "@/features/expenses/utils/expense-utils";

export function mapExpenseFromDto(dto: ExpenseDto): ExpenseTransaction {
  return {
    id: dto.id,
    date: dto.expenseDate,
    categoryId: dto.categoryId,
    name: dto.name,
    vendorOrEmployee: dto.vendorOrEmployee,
    payeeType: dto.payeeType,
    vendorId: dto.vendorId || undefined,
    employeeId: dto.employeeId || undefined,
    amount: dto.amount,
    status: dto.status,
    paymentMethod: dto.paymentMethod || undefined,
    referenceNumber: dto.referenceNumber || undefined,
    notes: dto.notes || undefined,
    hasAttachment: Boolean(dto.hasAttachment),
    recurring: Boolean(dto.recurring),
    masterTemplateId: dto.masterTemplateId || undefined,
    generatedPeriod: dto.generatedPeriod || undefined,
  };
}

export function mapExpenseMasterFromDto(dto: ExpenseMasterDto): ExpenseMasterTemplate {
  return {
    id: dto.id,
    name: dto.name,
    categoryId: dto.categoryId,
    vendorOrEmployee: dto.vendorOrEmployee,
    payeeType: dto.payeeType,
    vendorId: dto.vendorId || undefined,
    employeeId: dto.employeeId || undefined,
    defaultAmount: dto.defaultAmount,
    frequency: dto.frequency,
    startDate: dto.startDate,
    endDate: dto.endDate || undefined,
    autoGenerate: Boolean(dto.autoGenerate),
    status: dto.status,
  };
}

export function mapTransactionFormToBody(
  data: ExpenseTransactionFormData,
  existing?: ExpenseTransaction
): ExpenseCreateBody {
  return {
    expenseDate: data.date,
    name: data.name.trim(),
    categoryId: data.categoryId,
    payeeType: data.payeeType,
    vendorOrEmployee: data.vendorOrEmployee.trim(),
    vendorId: data.vendorId,
    employeeId: data.employeeId,
    amount: parseAmount(data.amount),
    status: data.status,
    paymentMethod: data.paymentMethod || "",
    referenceNumber: data.referenceNumber.trim(),
    notes: data.notes.trim(),
    recurring: data.recurring,
    masterTemplateId: existing?.masterTemplateId,
    generatedPeriod: existing?.generatedPeriod,
  };
}

export function mapMasterFormToBody(data: ExpenseMasterFormData): ExpenseMasterCreateBody {
  return {
    name: data.name.trim(),
    categoryId: data.categoryId,
    payeeType: data.payeeType,
    vendorOrEmployee: data.vendorOrEmployee.trim(),
    vendorId: data.vendorId,
    employeeId: data.employeeId,
    defaultAmount: parseAmount(data.defaultAmount),
    frequency: data.frequency as ExpenseMasterCreateBody["frequency"],
    startDate: data.startDate,
    endDate: data.endDate.trim() || "",
    autoGenerate: data.autoGenerate,
    status: data.status,
  };
}
