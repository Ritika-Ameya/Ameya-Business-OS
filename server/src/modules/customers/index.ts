export { customersRouter } from './routes/customers.routes';
export { customerService } from './services/customer.service';
export { customerRepository, documentRepository } from './services/customer.repository';
export type {
  CustomerEntity,
  CustomerRecordType,
  CustomerStatus,
  CustomerTimelineEntry,
  DocumentEntity,
  TimelineAction,
  SearchMode,
} from './types/customer.entities';
export { CUSTOMERS_CONTRACT, DOCUMENTS_CONTRACT } from './contracts/customer.contracts';
