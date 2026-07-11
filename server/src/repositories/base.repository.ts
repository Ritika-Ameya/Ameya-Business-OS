import type { IRepository } from '../interfaces';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../constants';
import type { PaginatedResult, QueryOptions } from '../types';
import { NotFoundError } from '../utils/AppError';
import { applyFilters } from '../utils/filtering.util';
import { createLogger, type Logger } from '../utils/logger.util';
import { paginateArray } from '../utils/pagination.util';
import { applySort } from '../utils/sorting.util';

export abstract class BaseRepository<
  TEntity extends Record<string, unknown> & { id: TId },
  TId = string,
> implements IRepository<TEntity, TId>
{
  protected readonly logger: Logger;

  constructor(protected readonly repositoryName: string) {
    this.logger = createLogger(repositoryName);
  }

  abstract findAll(options?: QueryOptions): Promise<TEntity[]>;
  abstract findById(id: TId): Promise<TEntity | null>;
  abstract create(data: Omit<TEntity, 'id'>): Promise<TEntity>;
  abstract update(id: TId, data: Partial<TEntity>): Promise<TEntity | null>;
  abstract delete(id: TId): Promise<boolean>;

  /**
   * Default implementation loads all records. Override in concrete repositories
   * for efficient counting against the persistence layer.
   */
  async count(options?: QueryOptions): Promise<number> {
    const items = await this.findAll(options);
    return items.length;
  }

  async findPaginated(options?: QueryOptions): Promise<PaginatedResult<TEntity>> {
    let items = await this.findAll(options);

    if (options?.filters) {
      items = applyFilters(items, options.filters);
    }

    if (options?.sort) {
      items = applySort(items, options.sort);
    }

    const pagination = options?.pagination ?? {
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      offset: 0,
    };

    return paginateArray(items, pagination);
  }

  async findByIdOrThrow(id: TId, resourceName?: string): Promise<TEntity> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundError(`${resourceName ?? this.repositoryName} not found`);
    }
    return entity;
  }

  async updateOrThrow(id: TId, data: Partial<TEntity>, resourceName?: string): Promise<TEntity> {
    const entity = await this.update(id, data);
    if (!entity) {
      throw new NotFoundError(`${resourceName ?? this.repositoryName} not found`);
    }
    return entity;
  }

  async deleteOrThrow(id: TId, resourceName?: string): Promise<void> {
    const deleted = await this.delete(id);
    if (!deleted) {
      throw new NotFoundError(`${resourceName ?? this.repositoryName} not found`);
    }
  }
}
