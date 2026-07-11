import type { QueryOptions } from '../types';
import type { PaginatedResult } from '../types';

export interface IRepository<TEntity, TId = string> {
  findAll(options?: QueryOptions): Promise<TEntity[]>;
  findById(id: TId): Promise<TEntity | null>;
  create(data: Omit<TEntity, 'id'>): Promise<TEntity>;
  update(id: TId, data: Partial<TEntity>): Promise<TEntity | null>;
  delete(id: TId): Promise<boolean>;
  count(options?: QueryOptions): Promise<number>;
  findPaginated(options?: QueryOptions): Promise<PaginatedResult<TEntity>>;
}
