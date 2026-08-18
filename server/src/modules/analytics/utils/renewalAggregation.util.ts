import { customerRepository } from '../../customers';
import type { CustomerEntity } from '../../customers/types/customer.entities';
import type { DealComponentEntity, DealEntity } from '../../deals/types/deal.entities';
import {
  getComponentCurrentDueDate,
  hasRenewalFrequency,
} from '../../deals/utils/renewalHelpers.util';
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

const resolveCustomerName = (
  deal: DealEntity | undefined,
  customers: CustomerEntity[],
): string => {
  const fromDeal = deal?.customerName?.trim();
  if (fromDeal) return fromDeal;
  const customer = customers.find((item) => item.id === deal?.customerId);
  return (customer?.contactPerson || customer?.companyName || '').trim();
};

const componentLineTotal = (component: DealComponentEntity): number => {
  const quantity = component.quantity > 0 ? component.quantity : 1;
  const discount = Number(component.discount || 0);
  const gstPercent = Number(component.gstPercent || 0);
  const taxable = Math.max(0, Number(component.amount || 0) * quantity - discount);
  return Math.round((taxable + (taxable * gstPercent) / 100) * 100) / 100;
};

/** Build renewal rows from Deal Components (not Deals). */
export const getCompanyRenewals = (
  deals: DealEntity[],
  components: DealComponentEntity[],
  customers: CustomerEntity[] = [],
): RenewalRow[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dealById = new Map(deals.map((deal) => [deal.id, deal]));

  return components
    .filter((component) => hasRenewalFrequency(component.renewalFrequency))
    .map((component) => {
      const deal = dealById.get(component.dealId);
      const dueIso = getComponentCurrentDueDate(component);
      if (!dueIso) return null;

      const renewalDate = new Date(dueIso);
      renewalDate.setHours(0, 0, 0, 0);
      if (Number.isNaN(renewalDate.getTime())) return null;

      const lastRenewedDate = component.lastRenewedDate?.trim() || '';
      const status: RenewalStatus = renewalDate < now ? 'overdue' : 'upcoming';

      return {
        id: `renewal-${component.id}`,
        dealId: component.dealId,
        componentId: component.id,
        componentName: component.name,
        customerId: deal?.customerId ?? '',
        customerName: resolveCustomerName(deal, customers) || '—',
        renewalLabel: component.name,
        dealTitle: deal?.title ?? '',
        renewalStartDate: lastRenewedDate
          ? component.renewalStartDate || dueIso
          : dueIso,
        renewalDate: dueIso,
        lastRenewedDate,
        amount: componentLineTotal(component),
        status,
        renewalType: mapComponentRenewalType(component.renewalFrequency),
        renewalFrequency: component.renewalFrequency,
      };
    })
    .filter((row): row is RenewalRow => row !== null)
    .sort(
      (a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime(),
    );
};

/** Ensure migration ran, then aggregate from components. */
export const loadCompanyRenewals = async (deals: DealEntity[]): Promise<RenewalRow[]> => {
  await migrateDealRenewalsToComponents().catch(() => undefined);
  const [components, customers] = await Promise.all([
    dealComponentRepository.findAll(),
    customerRepository.findAll().catch(() => [] as CustomerEntity[]),
  ]);
  return getCompanyRenewals(deals, components, customers);
};
