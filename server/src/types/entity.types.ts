export interface AuditFields {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SoftDeleteFields {
  deletedAt?: string | null;
  isDeleted: boolean;
}

export interface VersionedEntity {
  version: number;
}

/** Base entity contract compatible with Data Model v1.0 and future PostgreSQL migration */
export interface BaseEntity extends AuditFields, SoftDeleteFields, VersionedEntity {
  id: string;
}

export type EntityId = string;

export interface EntityRowMapper<TEntity extends BaseEntity> {
  toEntity(row: Record<string, string>): TEntity;
  toRow(entity: Partial<TEntity>): Record<string, string>;
}
