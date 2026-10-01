import { BASE_ENTITY_COLUMNS, SHEET_TABS } from '../../../constants';
import type { PersistenceContract } from '../../../types';

const withBase = <T extends readonly string[]>(
  fields: T,
): readonly [...typeof BASE_ENTITY_COLUMNS, ...T] => [...BASE_ENTITY_COLUMNS, ...fields];

/** Forecast lines only. Invoice, component, and deal dates are never written here. */
export const EXPECTED_RECEIPTS_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.EXPECTED_RECEIPTS,
  entityName: 'ExpectedReceipt',
  columns: withBase([
    'origin',
    'sourceType',
    'sourceRefType',
    'sourceRefId',
    'customerId',
    'dealId',
    'invoiceId',
    'componentId',
    'installmentIndex',
    'expectedAmount',
    'gstPercent',
    'currency',
    'expectedDate',
    'reason',
    'status',
  ]),
};

/** Opportunity Hot / Warm / Cold only. Not a stage and not a payment month. */
export const LEAD_TEMPERATURES_CONTRACT: PersistenceContract = {
  tabName: SHEET_TABS.LEAD_TEMPERATURES,
  entityName: 'LeadTemperature',
  columns: withBase(['customerId', 'temperature']),
};
