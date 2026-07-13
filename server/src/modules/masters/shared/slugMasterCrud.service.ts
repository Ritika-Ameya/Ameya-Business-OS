import type { BaseEntity } from '../../../types';
import { slugifyMasterName } from '../validators/master.validators';
import {
  MasterCrudService,
  type MasterCrudOptions,
} from './masterCrud.service';
import type { MasterRepository } from './master.repository';

export class SlugMasterCrudService<
  TEntity extends BaseEntity & { name: string; slug: string } & Record<string, unknown>,
> extends MasterCrudService<TEntity> {
  constructor(
    serviceName: string,
    repository: MasterRepository<TEntity>,
    resourceLabel: string,
    options: MasterCrudOptions = { uniqueFields: ['name', 'slug'] },
  ) {
    super(serviceName, repository, resourceLabel, options);
  }

  override async create(
    data: Omit<TEntity, keyof BaseEntity | 'id'> & Partial<BaseEntity>,
  ): Promise<TEntity> {
    const payload = { ...data } as Record<string, unknown>;
    if (!payload.slug && typeof payload.name === 'string') {
      payload.slug = slugifyMasterName(payload.name);
    }
    return super.create(payload as Omit<TEntity, keyof BaseEntity | 'id'> & Partial<BaseEntity>);
  }
}
