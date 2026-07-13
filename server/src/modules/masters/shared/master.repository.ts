import type { IRepository } from '../../../interfaces';
import type { BaseEntity, EntityRowMapper, PaginatedResult, QueryOptions } from '../../../types';
import type { PersistenceContract } from '../../../types/persistence.contracts';
import { GoogleSheetRepository } from '../../../repositories/googleSheet.repository';
import type { GoogleSheetsService } from '../../../services/googleSheets.service';
import type { HeaderManager } from '../../../services/sheets/headerManager.service';

export class MasterRepository<TEntity extends BaseEntity & Record<string, unknown>>
  extends GoogleSheetRepository<TEntity>
  implements IRepository<TEntity>
{
  constructor(
    repositoryName: string,
    sheetsService: GoogleSheetsService,
    contract: PersistenceContract,
    mapper: EntityRowMapper<TEntity>,
    headerManager?: HeaderManager,
  ) {
    super(repositoryName, sheetsService, contract, mapper, headerManager);
  }
}

export const createMasterRepository = <TEntity extends BaseEntity & Record<string, unknown>>(
  repositoryName: string,
  sheetsService: GoogleSheetsService,
  contract: PersistenceContract,
  mapper: EntityRowMapper<TEntity>,
  headerManager?: HeaderManager,
): MasterRepository<TEntity> =>
  new MasterRepository(repositoryName, sheetsService, contract, mapper, headerManager);

export type { PaginatedResult, QueryOptions };
