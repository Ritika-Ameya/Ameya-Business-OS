import type { PaginatedResult, QueryOptions } from '../../../types';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../../../constants';
import { BaseService } from '../../../services/base.service';
import { NotFoundError, ValidationError } from '../../../utils/AppError';
import { applyFilters } from '../../../utils/filtering.util';
import { applySort } from '../../../utils/sorting.util';
import { paginateArray } from '../../../utils/pagination.util';
import { expenseCategoryRepository } from '../../masters/services/master.services';
import { documentRepository } from '../../customers';
import type { DocumentEntity } from '../../customers';
import type { ExpenseEntity, ExpenseMasterEntity } from '../types/expense.entities';
import type {
  ExpenseCreateInput,
  ExpenseDocumentCreateInput,
  ExpenseMasterCreateInput,
  ExpenseMasterUpdateInput,
  ExpenseUpdateInput,
} from '../validators/expense.validators';
import { expenseMasterRepository, expenseRepository } from './expense.repository';
import {
  applyExpenseMasterSearch,
  applyExpenseSearch,
  parseExpenseMasterSearchFields,
  parseExpenseSearchFields,
  parseSearchMode,
} from '../utils/expenseSearch.util';
import { roundMoney } from '../utils/expenseCalculation.util';
import { generatePendingFromMasters } from '../utils/recurring.util';

const DOCUMENT_ENTITY_TYPE = 'expense';

type SearchParams = { q?: string; mode?: string; fields?: string };

export class ExpenseService extends BaseService {
  constructor() {
    super('ExpenseService');
  }

  async list(
    options?: QueryOptions,
    search?: SearchParams,
  ): Promise<PaginatedResult<ExpenseEntity>> {
    let items = await this.ensureRecurringGenerations();

    items = applyExpenseSearch(
      items,
      search?.q,
      parseSearchMode(search?.mode),
      parseExpenseSearchFields(search?.fields),
    );
    if (options?.filters?.length) {
      items = applyFilters(items as Record<string, unknown>[], options.filters) as ExpenseEntity[];
    }
    if (options?.sort) {
      items = applySort(items as Record<string, unknown>[], options.sort) as ExpenseEntity[];
    }
    const pagination = options?.pagination ?? {
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      offset: 0,
    };
    return paginateArray(items, pagination);
  }

  async getById(id: string): Promise<ExpenseEntity> {
    const entity = await expenseRepository.findById(id);
    if (!entity) throw new NotFoundError('Expense not found');
    return entity;
  }

  async create(input: ExpenseCreateInput): Promise<ExpenseEntity> {
    this.logInfo('Creating expense');
    const category = await this.resolveActiveCategory(input.categoryId);
    const amount = roundMoney(input.amount);
    if (amount <= 0) throw new ValidationError('Amount must be greater than 0');

    const vendorOrEmployee = input.vendorOrEmployee.trim();
    if (!vendorOrEmployee) {
      throw new ValidationError('Vendor or employee is required');
    }

    return expenseRepository.create({
      expenseDate: input.expenseDate,
      name: input.name.trim(),
      categoryId: category.id,
      categoryName: category.name,
      payeeType: input.payeeType,
      vendorOrEmployee,
      vendorId: (input.vendorId ?? '').trim(),
      employeeId: (input.employeeId ?? '').trim(),
      amount,
      currency: input.currency.trim() || 'INR',
      status: input.status,
      paymentMethod: input.paymentMethod.trim(),
      referenceNumber: input.referenceNumber.trim(),
      notes: input.notes.trim(),
      hasAttachment: false,
      recurring: input.recurring,
      masterTemplateId: input.masterTemplateId.trim(),
      generatedPeriod: input.generatedPeriod.trim(),
    } as Omit<ExpenseEntity, 'id'>);
  }

  async update(id: string, input: ExpenseUpdateInput): Promise<ExpenseEntity> {
    const existing = await this.getById(id);

    let categoryId = existing.categoryId;
    let categoryName = existing.categoryName;
    if (input.categoryId !== undefined) {
      const category = await this.resolveActiveCategory(input.categoryId);
      categoryId = category.id;
      categoryName = category.name;
    }

    const amount =
      input.amount !== undefined ? roundMoney(input.amount) : existing.amount;
    if (amount <= 0) throw new ValidationError('Amount must be greater than 0');

    const vendorOrEmployee =
      input.vendorOrEmployee !== undefined
        ? input.vendorOrEmployee.trim()
        : existing.vendorOrEmployee;
    if (!vendorOrEmployee) {
      throw new ValidationError('Vendor or employee is required');
    }

    return expenseRepository.updateOrThrow(
      id,
      {
        ...(input.expenseDate !== undefined ? { expenseDate: input.expenseDate } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        categoryId,
        categoryName,
        ...(input.payeeType !== undefined ? { payeeType: input.payeeType } : {}),
        vendorOrEmployee,
        ...(input.vendorId !== undefined ? { vendorId: input.vendorId.trim() } : {}),
        ...(input.employeeId !== undefined ? { employeeId: input.employeeId.trim() } : {}),
        amount,
        ...(input.currency !== undefined ? { currency: input.currency.trim() } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.paymentMethod !== undefined
          ? { paymentMethod: input.paymentMethod.trim() }
          : {}),
        ...(input.referenceNumber !== undefined
          ? { referenceNumber: input.referenceNumber.trim() }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() } : {}),
        ...(input.recurring !== undefined ? { recurring: input.recurring } : {}),
        ...(input.masterTemplateId !== undefined
          ? { masterTemplateId: input.masterTemplateId.trim() }
          : {}),
        ...(input.generatedPeriod !== undefined
          ? { generatedPeriod: input.generatedPeriod.trim() }
          : {}),
      } as Partial<ExpenseEntity>,
      'Expense',
    );
  }

  async patch(id: string, input: ExpenseUpdateInput): Promise<ExpenseEntity> {
    return this.update(id, input);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await expenseRepository.deleteOrThrow(id, 'Expense');
  }

  async restore(id: string): Promise<ExpenseEntity> {
    return expenseRepository.restore(id);
  }

  async changeStatus(
    id: string,
    status: ExpenseEntity['status'],
  ): Promise<ExpenseEntity> {
    await this.getById(id);
    return expenseRepository.updateOrThrow(id, { status }, 'Expense');
  }

  async listFiles(expenseId: string): Promise<DocumentEntity[]> {
    await this.getById(expenseId);
    const documents = await documentRepository.findAll();
    return documents.filter(
      (doc) => doc.entityType === DOCUMENT_ENTITY_TYPE && doc.entityId === expenseId,
    );
  }

  async addFile(
    expenseId: string,
    input: ExpenseDocumentCreateInput,
  ): Promise<{ document: DocumentEntity; expense: ExpenseEntity }> {
    await this.getById(expenseId);
    const fileType =
      input.fileType.trim() ||
      (input.name.includes('.') ? (input.name.split('.').pop()?.toLowerCase() ?? '') : '');

    const document = await documentRepository.create({
      name: input.name.trim(),
      fileType,
      mimeType: input.mimeType.trim(),
      size: input.size,
      driveFileId: '',
      entityType: DOCUMENT_ENTITY_TYPE,
      entityId: expenseId,
      uploadedBy: '',
    } as Omit<DocumentEntity, 'id'>);

    const expense = await this.syncHasAttachment(expenseId);
    return { document, expense };
  }

  async removeFile(expenseId: string, fileId: string): Promise<ExpenseEntity> {
    await this.getById(expenseId);
    const document = await documentRepository.findById(fileId);
    if (
      !document ||
      document.entityType !== DOCUMENT_ENTITY_TYPE ||
      document.entityId !== expenseId
    ) {
      throw new NotFoundError('Document not found');
    }
    await documentRepository.deleteOrThrow(fileId, 'Document');
    return this.syncHasAttachment(expenseId);
  }

  /**
   * Generates pending recurring expenses, then returns the current expense list
   * for the caller to reuse (avoids a second full worksheet read).
   */
  async ensureRecurringGenerations(): Promise<ExpenseEntity[]> {
    const [masters, transactions] = await Promise.all([
      expenseMasterRepository.findAll(),
      expenseRepository.findAll(),
    ]);

    const pending = generatePendingFromMasters(masters, transactions);
    if (pending.length === 0) {
      return transactions;
    }

    const created: ExpenseEntity[] = [];
    for (const item of pending) {
      const entity = await expenseRepository.create(item as Omit<ExpenseEntity, 'id'>);
      created.push(entity);
    }
    this.logInfo(`Generated ${created.length} recurring expense(s)`);

    // create() invalidates the sheet cache — reload once for a consistent list.
    return expenseRepository.findAll();
  }

  private async syncHasAttachment(expenseId: string): Promise<ExpenseEntity> {
    const files = await this.listFiles(expenseId);
    return expenseRepository.updateOrThrow(
      expenseId,
      { hasAttachment: files.length > 0 },
      'Expense',
    );
  }

  private async resolveActiveCategory(
    categoryId: string,
  ): Promise<{ id: string; name: string }> {
    const category = await expenseCategoryRepository.findById(categoryId);
    if (!category) {
      throw new ValidationError('Expense category not found');
    }
    if (!category.isActive) {
      throw new ValidationError('Expense category is inactive');
    }
    return { id: category.id, name: category.name };
  }
}

export class ExpenseMasterService extends BaseService {
  constructor() {
    super('ExpenseMasterService');
  }

  async list(
    options?: QueryOptions,
    search?: SearchParams,
  ): Promise<PaginatedResult<ExpenseMasterEntity>> {
    let items = await expenseMasterRepository.findAll(options);
    items = applyExpenseMasterSearch(
      items,
      search?.q,
      parseSearchMode(search?.mode),
      parseExpenseMasterSearchFields(search?.fields),
    );
    if (options?.filters?.length) {
      items = applyFilters(
        items as Record<string, unknown>[],
        options.filters,
      ) as ExpenseMasterEntity[];
    }
    if (options?.sort) {
      items = applySort(
        items as Record<string, unknown>[],
        options.sort,
      ) as ExpenseMasterEntity[];
    }
    const pagination = options?.pagination ?? {
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      offset: 0,
    };
    return paginateArray(items, pagination);
  }

  async getById(id: string): Promise<ExpenseMasterEntity> {
    const entity = await expenseMasterRepository.findById(id);
    if (!entity) throw new NotFoundError('Expense master not found');
    return entity;
  }

  async create(input: ExpenseMasterCreateInput): Promise<ExpenseMasterEntity> {
    this.logInfo('Creating expense master');
    const category = await this.resolveActiveCategory(input.categoryId);
    const defaultAmount = roundMoney(input.defaultAmount);
    if (defaultAmount <= 0) {
      throw new ValidationError('Default amount must be greater than 0');
    }

    const vendorOrEmployee = input.vendorOrEmployee.trim();
    if (!vendorOrEmployee) {
      throw new ValidationError('Vendor or employee is required');
    }

    const master = await expenseMasterRepository.create({
      name: input.name.trim(),
      categoryId: category.id,
      categoryName: category.name,
      payeeType: input.payeeType,
      vendorOrEmployee,
      vendorId: (input.vendorId ?? '').trim(),
      employeeId: (input.employeeId ?? '').trim(),
      defaultAmount,
      frequency: input.frequency,
      startDate: input.startDate,
      endDate: (input.endDate ?? '').trim(),
      autoGenerate: input.autoGenerate,
      status: input.status,
    } as Omit<ExpenseMasterEntity, 'id'>);

    await expenseService.ensureRecurringGenerations();
    return master;
  }

  async update(id: string, input: ExpenseMasterUpdateInput): Promise<ExpenseMasterEntity> {
    const existing = await this.getById(id);

    let categoryId = existing.categoryId;
    let categoryName = existing.categoryName;
    if (input.categoryId !== undefined) {
      const category = await this.resolveActiveCategory(input.categoryId);
      categoryId = category.id;
      categoryName = category.name;
    }

    const defaultAmount =
      input.defaultAmount !== undefined
        ? roundMoney(input.defaultAmount)
        : existing.defaultAmount;
    if (defaultAmount <= 0) {
      throw new ValidationError('Default amount must be greater than 0');
    }

    const vendorOrEmployee =
      input.vendorOrEmployee !== undefined
        ? input.vendorOrEmployee.trim()
        : existing.vendorOrEmployee;
    if (!vendorOrEmployee) {
      throw new ValidationError('Vendor or employee is required');
    }

    const master = await expenseMasterRepository.updateOrThrow(
      id,
      {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        categoryId,
        categoryName,
        ...(input.payeeType !== undefined ? { payeeType: input.payeeType } : {}),
        vendorOrEmployee,
        ...(input.vendorId !== undefined ? { vendorId: input.vendorId.trim() } : {}),
        ...(input.employeeId !== undefined ? { employeeId: input.employeeId.trim() } : {}),
        defaultAmount,
        ...(input.frequency !== undefined ? { frequency: input.frequency } : {}),
        ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
        ...(input.endDate !== undefined ? { endDate: input.endDate.trim() } : {}),
        ...(input.autoGenerate !== undefined ? { autoGenerate: input.autoGenerate } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      } as Partial<ExpenseMasterEntity>,
      'ExpenseMaster',
    );

    await expenseService.ensureRecurringGenerations();
    return master;
  }

  async patch(id: string, input: ExpenseMasterUpdateInput): Promise<ExpenseMasterEntity> {
    return this.update(id, input);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await expenseMasterRepository.deleteOrThrow(id, 'ExpenseMaster');
  }

  async restore(id: string): Promise<ExpenseMasterEntity> {
    return expenseMasterRepository.restore(id);
  }

  private async resolveActiveCategory(
    categoryId: string,
  ): Promise<{ id: string; name: string }> {
    const category = await expenseCategoryRepository.findById(categoryId);
    if (!category) {
      throw new ValidationError('Expense category not found');
    }
    if (!category.isActive) {
      throw new ValidationError('Expense category is inactive');
    }
    return { id: category.id, name: category.name };
  }
}

export const expenseService = new ExpenseService();
export const expenseMasterService = new ExpenseMasterService();
