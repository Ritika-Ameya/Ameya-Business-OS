import type { DealComponentEntity, DealEntity } from '../../deals/types/deal.entities';
import { hasRenewalFrequency } from '../../deals/utils/renewalHelpers.util';
import { migrateDealRenewalsToComponents } from '../../deals/utils/renewalMigration.util';
import { dealComponentRepository } from '../../deals/services/deal.repository';
import type { RenewalRow, RenewalStatus, RenewalType } from '../types/analytics.types';

export const mapComponentRenewalType = (frequency?: string): RenewalType => {
  switch (frequency) {
    case 'monthly':
      return 'monthly';
    case 'quarterly':
      return 'quarterly';
    case 'half-yearly':
      return 'half-yearly';
    case 'biennial':
      return 'biennial';
    case 'custom':
      return 'custom';
    case 'yearly':
    case 'annual':
    default:
      return 'yearly';
  }
};

/** Build renewal rows from Deal Components (not Deals). */
export const getCompanyRenewals = (
  deals: DealEntity[],
  components: DealComponentEntity[],
): RenewalRow[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const dealById = new Map(deals.map((deal) => [deal.id, deal]));

  return components
    .filter(
      (component) =>
        hasRenewalFrequency(component.renewalFrequency) &&
        Boolean(component.renewalDate?.trim()),
    )
    .map((component) => {
      const deal = dealById.get(component.dealId);
      const renewalDate = new Date(component.renewalDate);
      renewalDate.setHours(0, 0, 0, 0);
      const status: RenewalStatus = renewalDate < now ? 'overdue' : 'upcoming';

      return {
        id: `renewal-${component.id}`,
        dealId: component.dealId,
        componentId: component.id,
        componentName: component.name,
        customerId: deal?.customerId ?? '',
        customerName: deal?.customerName ?? '',
        renewalLabel: component.name,
        dealTitle: deal?.title ?? '',
        renewalStartDate: component.renewalStartDate || '',
        renewalDate: component.renewalDate,
        amount: Number(component.amount || 0),
        status,
        renewalType: mapComponentRenewalType(component.renewalFrequency),
        renewalFrequency: component.renewalFrequency,
      };
    })
    .filter((row) => Boolean(row.customerId))
    .sort(
      (a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime(),
    );
};

/** Ensure migration ran, then aggregate from components. */
export const loadCompanyRenewals = async (deals: DealEntity[]): Promise<RenewalRow[]> => {
  await migrateDealRenewalsToComponents().catch(() => undefined);
  const components = await dealComponentRepository.findAll();
  return getCompanyRenewals(deals, components);
};
