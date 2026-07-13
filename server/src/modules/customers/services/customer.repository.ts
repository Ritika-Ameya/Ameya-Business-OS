import { SHEET_DATA_START_ROW } from '../../../constants/sheets.constants';
import { createMasterRepository, MasterRepository } from '../../masters/shared/master.repository';
import type { CustomerEntity, DocumentEntity } from '../types/customer.entities';
import { CUSTOMERS_CONTRACT, DOCUMENTS_CONTRACT } from '../contracts/customer.contracts';
import { customerMapper, documentMapper } from '../mappers/customer.mappers';
import { bootstrapService, googleSheetsService } from '../../../integrations';
import { ConflictError, NotFoundError } from '../../../utils/AppError';
import { toISOString } from '../../../utils/date.util';
import { buildRowRange, rowToRecord } from '../../../utils/sheetMapper.util';

const sheets = googleSheetsService;
const headers = bootstrapService.getHeaderManager();

export class CustomerRepository extends MasterRepository<CustomerEntity> {
  /**
   * Soft-restore without redesigning GoogleSheetRepository.
   * Locates the row including soft-deleted records and clears delete flags.
   */
  async restore(id: string): Promise<CustomerEntity> {
    const { sheetHeaders, headerIndexByName, dataRows } = await this.loadMappedSheetData();
    const rowIndex = this.findRowIndex(dataRows, headerIndexByName, id);

    if (rowIndex === -1) {
      throw new NotFoundError('Customer not found');
    }

    const existing = this.mapper.toEntity(rowToRecord(sheetHeaders, dataRows[rowIndex]));

    if (!existing.isDeleted) {
      throw new ConflictError('Customer is not deleted');
    }

    const restored = {
      ...existing,
      isDeleted: false,
      deletedAt: null,
      updatedAt: toISOString(),
      version: existing.version + 1,
    } as CustomerEntity;

    const sheetRowNumber = rowIndex + SHEET_DATA_START_ROW;
    const range = buildRowRange(this.contract.tabName, sheetRowNumber, 0, sheetHeaders.length - 1);
    await this.sheetsService.updateRows(range, [this.entityToRowValues(sheetHeaders, restored)]);

    this.logger.debug(`Restored entity ${id} in ${this.contract.tabName}`);
    return restored;
  }
}

export const customerRepository = new CustomerRepository(
  'CustomerRepository',
  sheets,
  CUSTOMERS_CONTRACT,
  customerMapper,
  headers,
);

export const documentRepository = createMasterRepository<DocumentEntity>(
  'DocumentRepository',
  sheets,
  DOCUMENTS_CONTRACT,
  documentMapper,
  headers,
);
