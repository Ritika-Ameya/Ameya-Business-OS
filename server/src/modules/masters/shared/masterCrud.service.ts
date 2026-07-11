import type { BaseEntity, PaginatedResult, QueryOptions } from '../../../types';
import { MESSAGES } from '../../../constants';
import { NotFoundError } from '../../../utils/AppError';
import { BaseService } from '../../../services/base.service';
import type { MasterRepository } from './master.repository';

export class MasterCrudService<TEntity extends BaseEntity & Record<string, unknown>>
  extends BaseService
{
  constructor(
    serviceName: string,
    private readonly repository: MasterRepository<TEntity>,
    private readonly resourceLabel: string,
  ) {
    super(serviceName);
  }

  async list(options?: QueryOptions): Promise<PaginatedResult<TEntity>> {
    this.logDebug(`Listing ${this.resourceLabel} records`);
    return this.repository.findPaginated(options);
  }

  async getAll(options?: QueryOptions): Promise<TEntity[]> {
    return this.repository.findAll(options);
  }

  async getById(id: string): Promise<TEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundError(`${this.resourceLabel} not found`);
    }
    return entity;
  }

  async create(data: Omit<TEntity, keyof BaseEntity | 'id'> & Partial<BaseEntity>): Promise<TEntity> {
    this.logInfo(`Creating ${this.resourceLabel}`);
    return this.repository.create(data as Omit<TEntity, 'id'>);
  }

  async update(id: string, data: Partial<TEntity>): Promise<TEntity> {
    this.logInfo(`Updating ${this.resourceLabel} ${id}`);
    return this.repository.updateOrThrow(id, data, this.resourceLabel);
  }

  async remove(id: string): Promise<void> {
    this.logInfo(`Deleting ${this.resourceLabel} ${id}`);
    await this.repository.deleteOrThrow(id, this.resourceLabel);
  }
}

export class MasterSingletonService<TEntity extends BaseEntity & Record<string, unknown>>
  extends BaseService
{
  constructor(
    serviceName: string,
    private readonly repository: MasterRepository<TEntity>,
    private readonly resourceLabel: string,
  ) {
    super(serviceName);
  }

  async getCurrent(): Promise<TEntity | null> {
    const records = await this.repository.findAll();
    return records[0] ?? null;
  }

  async getCurrentOrThrow(): Promise<TEntity> {
    const current = await this.getCurrent();
    if (!current) {
      throw new NotFoundError(`${this.resourceLabel} not configured`);
    }
    return current;
  }

  async upsert(data: Omit<TEntity, keyof BaseEntity | 'id'> & Partial<BaseEntity>): Promise<TEntity> {
    const current = await this.getCurrent();
    if (current) {
      return this.repository.updateOrThrow(current.id, data as Partial<TEntity>, this.resourceLabel);
    }
    this.logInfo(`Creating initial ${this.resourceLabel}`);
    return this.repository.create(data as Omit<TEntity, 'id'>);
  }

  async update(id: string, data: Partial<TEntity>): Promise<TEntity> {
    return this.repository.updateOrThrow(id, data, this.resourceLabel);
  }

  async remove(id: string): Promise<void> {
    await this.repository.deleteOrThrow(id, this.resourceLabel);
  }

  async list(): Promise<TEntity[]> {
    return this.repository.findAll();
  }
}

export { MESSAGES };
