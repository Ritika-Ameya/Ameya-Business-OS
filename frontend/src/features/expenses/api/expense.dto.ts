import type { BaseEntityDto } from "@/shared/api/types";
import type {
  ExpenseFrequency,
  ExpenseMasterStatus,
  ExpenseTransactionStatus,
  PayeeType,
} from "@/features/expenses/types/expense";

export interface ExpenseDto extends BaseEntityDto {
  expenseDate: string;
  name: string;
  categoryId: string;
  categoryName: string;
  payeeType: PayeeType;
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

export interface ExpenseMasterDto extends BaseEntityDto {
  name: string;
  categoryId: string;
  categoryName: string;
  payeeType: PayeeType;
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

export interface ExpenseDocumentDto extends BaseEntityDto {
  name: string;
  fileType: string;
  mimeType: string;
  size: number;
  driveFileId: string;
  entityType: string;
  entityId: string;
  uploadedBy: string;
}

export interface ExpenseCreateBody {
  expenseDate: string;
  name: string;
  categoryId: string;
  payeeType: PayeeType;
  vendorOrEmployee: string;
  vendorId?: string;
  employeeId?: string;
  amount: number;
  status?: ExpenseTransactionStatus;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  recurring?: boolean;
  masterTemplateId?: string;
  generatedPeriod?: string;
  currency?: string;
}

export interface ExpenseMasterCreateBody {
  name: string;
  categoryId: string;
  payeeType: PayeeType;
  vendorOrEmployee: string;
  vendorId?: string;
  employeeId?: string;
  defaultAmount: number;
  frequency: ExpenseFrequency;
  startDate: string;
  endDate?: string;
  autoGenerate?: boolean;
  status?: ExpenseMasterStatus;
}
