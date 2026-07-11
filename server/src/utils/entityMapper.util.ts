import type { BaseEntity, EntityRowMapper } from '../types';
import { parseBoolean, parseNumberField } from './sheetMapper.util';

/** Creates a base entity row mapper for standard audit/soft-delete/version fields */
export const createBaseEntityMapper = <TEntity extends BaseEntity>(
  toEntityFields: (record: Record<string, string>, base: BaseEntity) => TEntity,
  toRowFields: (entity: Partial<TEntity>) => Record<string, string>,
): EntityRowMapper<TEntity> => ({
  toEntity: (record) => {
    const base: BaseEntity = {
      id: record.id ?? '',
      createdAt: record.createdAt ?? '',
      updatedAt: record.updatedAt ?? '',
      createdBy: record.createdBy || undefined,
      updatedBy: record.updatedBy || undefined,
      deletedAt: record.deletedAt || null,
      isDeleted: parseBoolean(record.isDeleted),
      version: parseNumberField(record.version, 1),
    };
    return toEntityFields(record, base);
  },
  toRow: (entity) => ({
    id: entity.id ?? '',
    createdAt: entity.createdAt ?? '',
    updatedAt: entity.updatedAt ?? '',
    createdBy: entity.createdBy ?? '',
    updatedBy: entity.updatedBy ?? '',
    deletedAt: entity.deletedAt ?? '',
    isDeleted: String(entity.isDeleted ?? false),
    version: String(entity.version ?? 1),
    ...toRowFields(entity),
  }),
});

export {
  columnIndexToLetter,
  buildRowRange,
  buildFullRange,
  parseSheetRows,
  rowToRecord,
  recordToRow,
  parseBoolean,
  parseNumberField,
} from './sheetMapper.util';
