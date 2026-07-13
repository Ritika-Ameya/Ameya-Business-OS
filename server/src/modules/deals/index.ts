export { dealsRouter } from './routes/deals.routes';
export { dealService } from './services/deal.service';
export { dealRepository, dealComponentRepository } from './services/deal.repository';
export type {
  DealEntity,
  DealComponentEntity,
  DealStatus,
  DealTimelineEntry,
} from './types/deal.entities';
export { DEALS_CONTRACT, DEAL_COMPONENTS_CONTRACT } from './contracts/deal.contracts';
