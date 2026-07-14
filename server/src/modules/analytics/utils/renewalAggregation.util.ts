import type { DealEntity } from '../../deals/types/deal.entities';
import type { RenewalRow, RenewalStatus, RenewalType } from '../types/analytics.types';

const mapRenewalType = (frequency?: string): RenewalType => {
  switch (frequency) {
    case 'monthly':
      return 'monthly';
    case 'quarterly':
      return 'quarterly';
    default:
      return 'annual';
  }
};

/** Port of frontend `getCompanyRenewals` — amount as number. */
export const getCompanyRenewals = (deals: DealEntity[]): RenewalRow[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return deals
    .filter((deal) => Boolean(deal.nextRenewal) && deal.renewalFrequency !== 'none')
    .map((deal) => {
      const renewalDate = new Date(deal.nextRenewal);
      renewalDate.setHours(0, 0, 0, 0);
      const status: RenewalStatus = renewalDate < now ? 'overdue' : 'upcoming';

      return {
        id: `renewal-${deal.id}`,
        dealId: deal.id,
        customerId: deal.customerId,
        customerName: deal.customerName,
        renewalLabel: `${deal.title} Renewal`,
        dealTitle: deal.title,
        renewalDate: deal.nextRenewal,
        amount: Number(deal.contractValue || 0),
        status,
        renewalType: mapRenewalType(deal.renewalFrequency),
      };
    })
    .sort(
      (a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime(),
    );
};
