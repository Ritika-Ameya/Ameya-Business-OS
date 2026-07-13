import { SHEET_DATA_START_ROW } from '../../../constants/sheets.constants';
import { createMasterRepository, MasterRepository } from '../../masters/shared/master.repository';
import { bootstrapService, googleSheetsService } from '../../../integrations';
import { ConflictError, NotFoundError } from '../../../utils/AppError';
import { toISOString } from '../../../utils/date.util';
import { buildRowRange, rowToRecord } from '../../../utils/sheetMapper.util';
import { INVOICES_CONTRACT, PAYMENTS_CONTRACT } from '../contracts/revenue.contracts';
import { invoiceMapper, paymentMapper } from '../mappers/revenue.mappers';
import type { InvoiceEntity, PaymentEntity } from '../types/revenue.entities';

const sheets = googleSheetsService;
const headers = bootstrapService.getHeaderManager();

export class InvoiceRepository extends MasterRepository<InvoiceEntity> {
  async restore(id: string): Promise<InvoiceEntity> {
    const { sheetHeaders, headerIndexByName, dataRows } = await this.loadMappedSheetData();
    const rowIndex = this.findRowIndex(dataRows, headerIndexByName, id);
    if (rowIndex === -1) throw new NotFoundError('Invoice not found');

    const existing = this.mapper.toEntity(rowToRecord(sheetHeaders, dataRows[rowIndex]));
    if (!existing.isDeleted) throw new ConflictError('Invoice is not deleted');

    const restored = {
      ...existing,
      isDeleted: false,
      deletedAt: null,
      updatedAt: toISOString(),
      version: existing.version + 1,
    } as InvoiceEntity;

    const sheetRowNumber = rowIndex + SHEET_DATA_START_ROW;
    const range = buildRowRange(this.contract.tabName, sheetRowNumber, 0, sheetHeaders.length - 1);
    await this.sheetsService.updateRows(range, [this.entityToRowValues(sheetHeaders, restored)]);
    return restored;
  }
}

export const invoiceRepository = new InvoiceRepository(
  'InvoiceRepository',
  sheets,
  INVOICES_CONTRACT,
  invoiceMapper,
  headers,
);

export const paymentRepository = createMasterRepository<PaymentEntity>(
  'PaymentRepository',
  sheets,
  PAYMENTS_CONTRACT,
  paymentMapper,
  headers,
);
