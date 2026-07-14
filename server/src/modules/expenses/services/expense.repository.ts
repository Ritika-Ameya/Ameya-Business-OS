import { SHEET_DATA_START_ROW } from '../../../constants/sheets.constants';
import { MasterRepository } from '../../masters/shared/master.repository';
import { bootstrapService, googleSheetsService } from '../../../integrations';
import { ConflictError, NotFoundError } from '../../../utils/AppError';
import { toISOString } from '../../../utils/date.util';
import { buildRowRange, rowToRecord } from '../../../utils/sheetMapper.util';
import { EXPENSES_CONTRACT, EXPENSE_MASTERS_CONTRACT } from '../contracts/expense.contracts';
import { expenseMapper, expenseMasterMapper } from '../mappers/expense.mappers';
import type { ExpenseEntity, ExpenseMasterEntity } from '../types/expense.entities';

const sheets = googleSheetsService;
const headers = bootstrapService.getHeaderManager();

export class ExpenseRepository extends MasterRepository<ExpenseEntity> {
  async restore(id: string): Promise<ExpenseEntity> {
    const { sheetHeaders, headerIndexByName, dataRows } = await this.loadMappedSheetData();
    const rowIndex = this.findRowIndex(dataRows, headerIndexByName, id);
    if (rowIndex === -1) throw new NotFoundError('Expense not found');

    const existing = this.mapper.toEntity(rowToRecord(sheetHeaders, dataRows[rowIndex]));
    if (!existing.isDeleted) throw new ConflictError('Expense is not deleted');

    const restored = {
      ...existing,
      isDeleted: false,
      deletedAt: null,
      updatedAt: toISOString(),
      version: existing.version + 1,
    } as ExpenseEntity;

    const sheetRowNumber = rowIndex + SHEET_DATA_START_ROW;
    const range = buildRowRange(this.contract.tabName, sheetRowNumber, 0, sheetHeaders.length - 1);
    await this.sheetsService.updateRows(range, [this.entityToRowValues(sheetHeaders, restored)]);
    return restored;
  }
}

export class ExpenseMasterRepository extends MasterRepository<ExpenseMasterEntity> {
  async restore(id: string): Promise<ExpenseMasterEntity> {
    const { sheetHeaders, headerIndexByName, dataRows } = await this.loadMappedSheetData();
    const rowIndex = this.findRowIndex(dataRows, headerIndexByName, id);
    if (rowIndex === -1) throw new NotFoundError('Expense master not found');

    const existing = this.mapper.toEntity(rowToRecord(sheetHeaders, dataRows[rowIndex]));
    if (!existing.isDeleted) throw new ConflictError('Expense master is not deleted');

    const restored = {
      ...existing,
      isDeleted: false,
      deletedAt: null,
      updatedAt: toISOString(),
      version: existing.version + 1,
    } as ExpenseMasterEntity;

    const sheetRowNumber = rowIndex + SHEET_DATA_START_ROW;
    const range = buildRowRange(this.contract.tabName, sheetRowNumber, 0, sheetHeaders.length - 1);
    await this.sheetsService.updateRows(range, [this.entityToRowValues(sheetHeaders, restored)]);
    return restored;
  }
}

export const expenseRepository = new ExpenseRepository(
  'ExpenseRepository',
  sheets,
  EXPENSES_CONTRACT,
  expenseMapper,
  headers,
);

export const expenseMasterRepository = new ExpenseMasterRepository(
  'ExpenseMasterRepository',
  sheets,
  EXPENSE_MASTERS_CONTRACT,
  expenseMasterMapper,
  headers,
);
