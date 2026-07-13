import type { PaginatedResult, QueryOptions } from '../types';

export interface IRepository<TEntity extends Record<string, unknown> & { id: TId }, TId = string> {
  findAll(options?: QueryOptions): Promise<TEntity[]>;
  findById(id: TId): Promise<TEntity | null>;
  create(data: Omit<TEntity, 'id'>): Promise<TEntity>;
  update(id: TId, data: Partial<TEntity>): Promise<TEntity | null>;
  delete(id: TId): Promise<boolean>;
  count(options?: QueryOptions): Promise<number>;
  findPaginated(options?: QueryOptions): Promise<PaginatedResult<TEntity>>;
}
