import type { IRepository } from '../interfaces';
import type { PaginatedResult, QueryOptions } from '../types';
import { applyFilters } from '../utils/filtering.util';
import { paginateArray } from '../utils/pagination.util';
import { applySort } from '../utils/sorting.util';
import { NotFoundError } from '../utils/AppError';
import { createLogger, type Logger } from '../utils/logger.util';

export abstract class BaseRepository<TEntity extends { id: TId }, TId = string>
  implements IRepository<TEntity, TId>
{
  protected readonly logger: Logger;

  constructor(protected readonly repositoryName: string) {
    this.logger = createLogger(repositoryName);
  }

  protected getRepositoryName(): string {
    return this.repositoryName;
  }

  abstract findAll(options?: QueryOptions): Promise<TEntity[]>;
  abstract findById(id: TId): Promise<TEntity | null>;
  abstract create(data: Omit<TEntity, 'id'>): Promise<TEntity>;
  abstract update(id: TId, data: Partial<TEntity>): Promise<TEntity | null>;
  abstract delete(id: TId): Promise<boolean>;

  async count(options?: QueryOptions): Promise<number> {
    const items = await this.findAll(options);
    return items.length;
  }

  async findPaginated(options?: QueryOptions): Promise<PaginatedResult<TEntity>> {
    let items = await this.findAll(options);

    if (options?.filters) {
      items = applyFilters(items as Record<string, unknown>[], options.filters) as TEntity[];
    }

    if (options?.sort) {
      items = applySort(items as Record<string, unknown>[], options.sort) as TEntity[];
    }

    const pagination = options?.pagination ?? { page: 1, limit: 20, offset: 0 };
    return paginateArray(items, pagination);
  }

  async findByIdOrThrow(id: TId, resourceName?: string): Promise<TEntity> {
    const entity = await this.findById(id);
    if (!entity) {
      const name = resourceName ?? this.repositoryName;
      throw new NotFoundError(`${name} not found`);
    }
    return entity;
  }

  async updateOrThrow(id: TId, data: Partial<TEntity>, resourceName?: string): Promise<TEntity> {
    const entity = await this.update(id, data);
    if (!entity) {
      const name = resourceName ?? this.repositoryName;
      throw new NotFoundError(`${name} not found`);
    }
    return entity;
  }

  async deleteOrThrow(id: TId, resourceName?: string): Promise<void> {
    const deleted = await this.delete(id);
    if (!deleted) {
      const name = resourceName ?? this.repositoryName;
      throw new NotFoundError(`${name} not found`);
    }
  }
}
