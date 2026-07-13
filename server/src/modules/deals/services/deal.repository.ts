import { SHEET_DATA_START_ROW } from '../../../constants/sheets.constants';
import { createMasterRepository, MasterRepository } from '../../masters/shared/master.repository';
import { bootstrapService, googleSheetsService } from '../../../integrations';
import { ConflictError, NotFoundError } from '../../../utils/AppError';
import { toISOString } from '../../../utils/date.util';
import { buildRowRange, rowToRecord } from '../../../utils/sheetMapper.util';
import { DEAL_COMPONENTS_CONTRACT, DEALS_CONTRACT } from '../contracts/deal.contracts';
import { dealComponentMapper, dealMapper } from '../mappers/deal.mappers';
import type { DealComponentEntity, DealEntity } from '../types/deal.entities';

const sheets = googleSheetsService;
const headers = bootstrapService.getHeaderManager();

export class DealRepository extends MasterRepository<DealEntity> {
  async restore(id: string): Promise<DealEntity> {
    const { sheetHeaders, headerIndexByName, dataRows } = await this.loadMappedSheetData();
    const rowIndex = this.findRowIndex(dataRows, headerIndexByName, id);

    if (rowIndex === -1) {
      throw new NotFoundError('Deal not found');
    }

    const existing = this.mapper.toEntity(rowToRecord(sheetHeaders, dataRows[rowIndex]));

    if (!existing.isDeleted) {
      throw new ConflictError('Deal is not deleted');
    }

    const restored = {
      ...existing,
      isDeleted: false,
      deletedAt: null,
      updatedAt: toISOString(),
      version: existing.version + 1,
    } as DealEntity;

    const sheetRowNumber = rowIndex + SHEET_DATA_START_ROW;
    const range = buildRowRange(this.contract.tabName, sheetRowNumber, 0, sheetHeaders.length - 1);
    await this.sheetsService.updateRows(range, [this.entityToRowValues(sheetHeaders, restored)]);

    this.logger.debug(`Restored entity ${id} in ${this.contract.tabName}`);
    return restored;
  }
}

export const dealRepository = new DealRepository(
  'DealRepository',
  sheets,
  DEALS_CONTRACT,
  dealMapper,
  headers,
);

export const dealComponentRepository = createMasterRepository<DealComponentEntity>(
  'DealComponentRepository',
  sheets,
  DEAL_COMPONENTS_CONTRACT,
  dealComponentMapper,
  headers,
);
