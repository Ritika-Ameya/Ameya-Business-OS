import type { DealComponentEntity, DealEntity } from '../types/deal.entities';
import {
  hasRenewalFrequency,
  mapLegacyDealFrequency,
} from './renewalHelpers.util';
import { dealComponentRepository, dealRepository } from '../services/deal.repository';

let migrationPromise: Promise<number> | null = null;

const recurringBillingTypes = new Set([
  'monthly',
  'quarterly',
  'half-yearly',
  'yearly',
]);

const pickMigrationTarget = (
  components: DealComponentEntity[],
): DealComponentEntity => {
  const withDate = components.find((component) => Boolean(component.renewalDate?.trim()));
  if (withDate) return withDate;

  const recurring = components.find((component) =>
    recurringBillingTypes.has(component.billingType),
  );
  if (recurring) return recurring;

  return [...components].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];
};

const clearDealRenewalFields = async (deal: DealEntity): Promise<void> => {
  if (!deal.nextRenewal && (!deal.renewalFrequency || deal.renewalFrequency === 'none')) {
    return;
  }
  await dealRepository.updateOrThrow(
    deal.id,
    { nextRenewal: '', renewalFrequency: 'none' },
    'Deal',
  );
};

/**
 * One-time lazy migration: copy Deal nextRenewal/renewalFrequency onto components,
 * then clear deal-level fields. Safe to call repeatedly.
 */
export const migrateDealRenewalsToComponents = async (): Promise<number> => {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const [deals, components] = await Promise.all([
        dealRepository.findAll(),
        dealComponentRepository.findAll(),
      ]);

      const byDeal = new Map<string, DealComponentEntity[]>();
      for (const component of components) {
        const list = byDeal.get(component.dealId) ?? [];
        list.push(component);
        byDeal.set(component.dealId, list);
      }

      let migrated = 0;

      // Backfill: components with a date but no frequency → custom
      for (const component of components) {
        if (
          component.renewalDate?.trim() &&
          !hasRenewalFrequency(component.renewalFrequency)
        ) {
          await dealComponentRepository.updateOrThrow(
            component.id,
            {
              renewalFrequency: 'custom',
              renewalStartDate:
                component.renewalStartDate?.trim() || component.renewalDate.trim(),
              renewalDate: component.renewalDate.trim(),
            },
            'Component',
          );
          migrated += 1;
        }
      }

      for (const deal of deals) {
        const legacyFrequency = deal.renewalFrequency;
        const legacyNext = (deal.nextRenewal ?? '').trim();
        if (!legacyNext || !legacyFrequency || legacyFrequency === 'none') {
          continue;
        }

        const dealComponents = byDeal.get(deal.id) ?? [];
        const alreadyMigrated = dealComponents.some(
          (component) =>
            hasRenewalFrequency(component.renewalFrequency) &&
            Boolean(component.renewalDate?.trim()),
        );

        if (alreadyMigrated) {
          await clearDealRenewalFields(deal);
          continue;
        }

        const frequency = mapLegacyDealFrequency(legacyFrequency);
        const renewalStartDate = (deal.startDate || legacyNext).trim();

        if (dealComponents.length === 0) {
          const created = await dealComponentRepository.create({
            dealId: deal.id,
            name: `${deal.title} Renewal`.trim(),
            category: 'Renewal',
            description: 'Migrated from deal-level renewal schedule',
            amount: Number(deal.contractValue || 0),
            billingType: frequency === 'yearly' ? 'yearly' : frequency === 'monthly' ? 'monthly' : frequency === 'quarterly' ? 'quarterly' : 'one-time',
            status: 'pending',
            renewalFrequency: frequency,
            renewalStartDate,
            renewalDate: legacyNext,
          } as Omit<DealComponentEntity, 'id'>);

          const list = byDeal.get(deal.id) ?? [];
          list.push(created);
          byDeal.set(deal.id, list);

          await dealRepository.updateOrThrow(
            deal.id,
            {
              componentsCount: (deal.componentsCount || 0) + 1,
              nextRenewal: '',
              renewalFrequency: 'none',
            },
            'Deal',
          );
        } else {
          const target = pickMigrationTarget(dealComponents);
          await dealComponentRepository.updateOrThrow(
            target.id,
            {
              renewalFrequency: frequency,
              renewalStartDate:
                target.renewalStartDate?.trim() || renewalStartDate,
              renewalDate: legacyNext,
            },
            'Component',
          );
          await clearDealRenewalFields(deal);
        }

        migrated += 1;
      }

      return migrated;
    })().catch((error) => {
      migrationPromise = null;
      throw error;
    });
  }

  return migrationPromise;
};
