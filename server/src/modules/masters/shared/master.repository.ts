import type { IRepository } from '../../../interfaces';
import type { BaseEntity, EntityRowMapper, PaginatedResult, QueryOptions } from '../../../types';
import type { PersistenceContract } from '../../../types/persistence.contracts';
import { GoogleSheetRepository } from '../../../repositories/googleSheet.repository';
import type { GoogleSheetsService } from '../../../services/googleSheets.service';

export class MasterRepository<TEntity extends BaseEntity & Record<string, unknown>>
  extends GoogleSheetRepository<TEntity>
  implements IRepository<TEntity>
{
  constructor(
    repositoryName: string,
    sheetsService: GoogleSheetsService,
    contract: PersistenceContract,
    mapper: EntityRowMapper<TEntity>,
  ) {
    super(repositoryName, sheetsService, contract, mapper);
  }
}

export const createMasterRepository = <TEntity extends BaseEntity & Record<string, unknown>>(
  repositoryName: string,
  sheetsService: GoogleSheetsService,
  contract: PersistenceContract,
  mapper: EntityRowMapper<TEntity>,
): MasterRepository<TEntity> =>
  new MasterRepository(repositoryName, sheetsService, contract, mapper);

export type { PaginatedResult, QueryOptions };
