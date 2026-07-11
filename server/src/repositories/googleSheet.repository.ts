import type { EntityRowMapper, BaseEntity } from '../types';
import type { PersistenceContract } from '../types/persistence.contracts';
import { SHEET_DATA_START_ROW } from '../constants/sheets.constants';
import { BaseRepository } from './base.repository';
import type { GoogleSheetsService } from '../services/googleSheets.service';
import type { QueryOptions } from '../types';
import { ConflictError } from '../utils/AppError';
import { toISOString } from '../utils/date.util';
import { generateId } from '../utils/id.util';
import {
  buildFullRange,
  buildRowRange,
  parseBoolean,
  parseNumberField,
  parseSheetRows,
  recordToRow,
  rowToRecord,
} from '../utils/sheetMapper.util';

export abstract class GoogleSheetRepository<
  TEntity extends BaseEntity & Record<string, unknown>,
> extends BaseRepository<TEntity> {
  protected readonly headers: string[];

  constructor(
    repositoryName: string,
    protected readonly sheetsService: GoogleSheetsService,
    protected readonly contract: PersistenceContract,
    protected readonly mapper: EntityRowMapper<TEntity>,
  ) {
    super(repositoryName);
    this.headers = [...contract.columns];
  }

  getContractTabName(): string {
    return this.contract.tabName;
  }

  protected get fullRange(): string {
    return buildFullRange(this.contract.tabName, this.headers.length - 1);
  }

  protected async loadSheetData(): Promise<{
    headers: string[];
    dataRows: string[][];
  }> {
    const rows = await this.sheetsService.readByRange(this.fullRange);
    return parseSheetRows(rows);
  }

  protected parseEntities(rows: string[][]): TEntity[] {
    return rows
      .map((row) => this.mapper.toEntity(rowToRecord(this.headers, row)))
      .filter((entity) => !entity.isDeleted);
  }

  protected findRowIndex(dataRows: string[][], id: string): number {
    const idColumnIndex = this.headers.indexOf('id');
    if (idColumnIndex === -1) {
      return -1;
    }

    return dataRows.findIndex((row) => row[idColumnIndex] === id);
  }

  protected entityToRowValues(entity: Partial<TEntity>): string[] {
    return recordToRow(this.headers, this.mapper.toRow(entity));
  }

  protected createBaseEntity(data: Omit<TEntity, 'id'>): TEntity {
    const now = toISOString();
    const base = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isDeleted: false,
      version: 1,
      ...data,
    } as TEntity;

    return base;
  }

  async findAll(_options?: QueryOptions): Promise<TEntity[]> {
    const { dataRows } = await this.loadSheetData();
    return this.parseEntities(dataRows);
  }

  async findById(id: string): Promise<TEntity | null> {
    const { dataRows } = await this.loadSheetData();
    const rowIndex = this.findRowIndex(dataRows, id);

    if (rowIndex === -1) {
      return null;
    }

    const entity = this.mapper.toEntity(rowToRecord(this.headers, dataRows[rowIndex]));
    return entity.isDeleted ? null : entity;
  }

  async create(data: Omit<TEntity, 'id'>): Promise<TEntity> {
    const entity = this.createBaseEntity(data);
    const rowValues = this.entityToRowValues(entity);

    await this.sheetsService.appendRows(`'${this.contract.tabName}'!A:A`, [rowValues]);
    this.logger.debug(`Created entity ${entity.id} in ${this.contract.tabName}`);

    return entity;
  }

  async update(id: string, data: Partial<TEntity>): Promise<TEntity | null> {
    const { dataRows } = await this.loadSheetData();
    const rowIndex = this.findRowIndex(dataRows, id);

    if (rowIndex === -1) {
      return null;
    }

    const existing = this.mapper.toEntity(rowToRecord(this.headers, dataRows[rowIndex]));

    if (existing.isDeleted) {
      return null;
    }

    if (data.version !== undefined && data.version !== existing.version) {
      throw new ConflictError('Entity version conflict — record was modified by another process');
    }

    const updated = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: toISOString(),
      version: existing.version + 1,
    } as TEntity;

    const sheetRowNumber = rowIndex + SHEET_DATA_START_ROW;
    const range = buildRowRange(this.contract.tabName, sheetRowNumber, 0, this.headers.length - 1);

    await this.sheetsService.updateRows(range, [this.entityToRowValues(updated)]);
    this.logger.debug(`Updated entity ${id} in ${this.contract.tabName}`);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const { dataRows } = await this.loadSheetData();
    const rowIndex = this.findRowIndex(dataRows, id);

    if (rowIndex === -1) {
      return false;
    }

    const existing = this.mapper.toEntity(rowToRecord(this.headers, dataRows[rowIndex]));

    if (existing.isDeleted) {
      return false;
    }

    const softDeleted = {
      ...existing,
      isDeleted: true,
      deletedAt: toISOString(),
      updatedAt: toISOString(),
      version: existing.version + 1,
    } as TEntity;

    const sheetRowNumber = rowIndex + SHEET_DATA_START_ROW;
    const range = buildRowRange(this.contract.tabName, sheetRowNumber, 0, this.headers.length - 1);

    await this.sheetsService.updateRows(range, [this.entityToRowValues(softDeleted)]);
    this.logger.debug(`Soft-deleted entity ${id} in ${this.contract.tabName}`);

    return true;
  }

  /** Parse standard base entity fields from a raw row record */
  protected parseBaseFields(record: Record<string, string>): BaseEntity {
    return {
      id: record.id ?? '',
      createdAt: record.createdAt ?? '',
      updatedAt: record.updatedAt ?? '',
      createdBy: record.createdBy || undefined,
      updatedBy: record.updatedBy || undefined,
      deletedAt: record.deletedAt || null,
      isDeleted: parseBoolean(record.isDeleted),
      version: parseNumberField(record.version, 1),
    };
  }
}
