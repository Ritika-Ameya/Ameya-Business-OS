import type { EntityRowMapper, BaseEntity } from '../types';
import type { PersistenceContract } from '../types/persistence.contracts';
import { SHEET_DATA_START_ROW } from '../constants/sheets.constants';
import { BaseRepository } from './base.repository';
import type { GoogleSheetsService } from '../services/googleSheets.service';
import type { HeaderManager } from '../services/sheets/headerManager.service';
import type { QueryOptions } from '../types';
import { ConflictError, ValidationError } from '../utils/AppError';
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

interface MappedSheetData {
  sheetHeaders: string[];
  headerIndexByName: Map<string, number>;
  dataRows: string[][];
}

/**
 * Google Sheets repository with dynamic header-name mapping.
 * Worksheet/header creation belongs to BootstrapService / HeaderManager — never here.
 */
export abstract class GoogleSheetRepository<
  TEntity extends BaseEntity & Record<string, unknown>,
> extends BaseRepository<TEntity> {
  protected readonly contractColumns: string[];

  constructor(
    repositoryName: string,
    protected readonly sheetsService: GoogleSheetsService,
    protected readonly contract: PersistenceContract,
    protected readonly mapper: EntityRowMapper<TEntity>,
    protected readonly headerManager?: HeaderManager,
  ) {
    super(repositoryName);
    this.contractColumns = [...contract.columns];
  }

  getContractTabName(): string {
    return this.contract.tabName;
  }

  protected get fullRange(): string {
    // Wide read; actual used width comes from live sheet headers
    return buildFullRange(this.contract.tabName, Math.max(this.contractColumns.length - 1, 25));
  }

  protected async loadSheetData(): Promise<{
    headers: string[];
    dataRows: string[][];
  }> {
    const rows = await this.sheetsService.readByRange(this.fullRange);
    return parseSheetRows(rows);
  }

  /**
   * Reads live headers, builds name→index map, validates mandatory contract columns.
   */
  protected async loadMappedSheetData(): Promise<MappedSheetData> {
    const { headers: sheetHeaders, dataRows } = await this.loadSheetData();

    if (!sheetHeaders.some((header) => String(header ?? '').trim())) {
      throw new ValidationError(
        `Worksheet "${this.contract.tabName}" has no headers. ` +
          'Ensure BootstrapService has completed successfully.',
      );
    }

    if (this.headerManager) {
      this.headerManager.assertMandatoryHeaders(
        this.contract.tabName,
        sheetHeaders,
        this.contractColumns,
      );
    } else {
      const present = new Set(sheetHeaders.map((header) => String(header ?? '').trim()));
      const missing = this.contractColumns.filter((column) => !present.has(column));
      if (missing.length > 0) {
        throw new ValidationError(
          `Mandatory header(s) missing from worksheet "${this.contract.tabName}": ${missing.join(', ')}`,
          missing.map((column) => `Missing header: ${column}`),
        );
      }
    }

    const headerIndexByName = this.headerManager
      ? this.headerManager.buildHeaderIndexMap(sheetHeaders)
      : new Map(
          sheetHeaders
            .map((header, index) => [String(header ?? '').trim(), index] as const)
            .filter(([header]) => Boolean(header)),
        );

    return { sheetHeaders, headerIndexByName, dataRows };
  }

  protected parseEntities(sheetHeaders: string[], rows: string[][]): TEntity[] {
    return rows
      .map((row) => this.mapper.toEntity(rowToRecord(sheetHeaders, row)))
      .filter((entity) => !entity.isDeleted);
  }

  protected findRowIndex(
    dataRows: string[][],
    headerIndexByName: Map<string, number>,
    id: string,
  ): number {
    const idColumnIndex = headerIndexByName.get('id');
    if (idColumnIndex === undefined) {
      return -1;
    }

    return dataRows.findIndex((row) => row[idColumnIndex] === id);
  }

  protected entityToRowValues(sheetHeaders: string[], entity: Partial<TEntity>): string[] {
    return recordToRow(sheetHeaders, this.mapper.toRow(entity));
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
    const { sheetHeaders, dataRows } = await this.loadMappedSheetData();
    return this.parseEntities(sheetHeaders, dataRows);
  }

  async findById(id: string): Promise<TEntity | null> {
    const { sheetHeaders, headerIndexByName, dataRows } = await this.loadMappedSheetData();
    const rowIndex = this.findRowIndex(dataRows, headerIndexByName, id);

    if (rowIndex === -1) {
      return null;
    }

    const entity = this.mapper.toEntity(rowToRecord(sheetHeaders, dataRows[rowIndex]));
    return entity.isDeleted ? null : entity;
  }

  async create(data: Omit<TEntity, 'id'>): Promise<TEntity> {
    const { sheetHeaders } = await this.loadMappedSheetData();
    const entity = this.createBaseEntity(data);
    const rowValues = this.entityToRowValues(sheetHeaders, entity);

    await this.sheetsService.appendRows(`'${this.contract.tabName}'!A:A`, [rowValues]);
    this.logger.debug(`Created entity ${entity.id} in ${this.contract.tabName}`);

    return entity;
  }

  async update(id: string, data: Partial<TEntity>): Promise<TEntity | null> {
    const { sheetHeaders, headerIndexByName, dataRows } = await this.loadMappedSheetData();
    const rowIndex = this.findRowIndex(dataRows, headerIndexByName, id);

    if (rowIndex === -1) {
      return null;
    }

    const existing = this.mapper.toEntity(rowToRecord(sheetHeaders, dataRows[rowIndex]));

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
    const range = buildRowRange(this.contract.tabName, sheetRowNumber, 0, sheetHeaders.length - 1);

    await this.sheetsService.updateRows(range, [this.entityToRowValues(sheetHeaders, updated)]);
    this.logger.debug(`Updated entity ${id} in ${this.contract.tabName}`);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const { sheetHeaders, headerIndexByName, dataRows } = await this.loadMappedSheetData();
    const rowIndex = this.findRowIndex(dataRows, headerIndexByName, id);

    if (rowIndex === -1) {
      return false;
    }

    const existing = this.mapper.toEntity(rowToRecord(sheetHeaders, dataRows[rowIndex]));

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
    const range = buildRowRange(this.contract.tabName, sheetRowNumber, 0, sheetHeaders.length - 1);

    await this.sheetsService.updateRows(range, [
      this.entityToRowValues(sheetHeaders, softDeleted),
    ]);
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
