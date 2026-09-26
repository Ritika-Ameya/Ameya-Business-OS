import { bootstrapService, googleSheetsService } from '../../../integrations';
import { MasterRepository } from '../../masters/shared/master.repository';
import {
  EXPECTED_RECEIPTS_CONTRACT,
  LEAD_TEMPERATURES_CONTRACT,
} from '../contracts/canvas.contracts';
import { expectedReceiptMapper, leadTemperatureMapper } from '../mappers/canvas.mappers';
import type { ExpectedReceiptEntity, LeadTemperatureEntity } from '../types/canvas.entities';

const sheets = googleSheetsService;
const headers = bootstrapService.getHeaderManager();

export class ExpectedReceiptRepository extends MasterRepository<ExpectedReceiptEntity> {}

export class LeadTemperatureRepository extends MasterRepository<LeadTemperatureEntity> {}

export const expectedReceiptRepository = new ExpectedReceiptRepository(
  'ExpectedReceiptRepository',
  sheets,
  EXPECTED_RECEIPTS_CONTRACT,
  expectedReceiptMapper,
  headers,
);

export const leadTemperatureRepository = new LeadTemperatureRepository(
  'LeadTemperatureRepository',
  sheets,
  LEAD_TEMPERATURES_CONTRACT,
  leadTemperatureMapper,
  headers,
);
