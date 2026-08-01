import type {
  ComponentRenewalFrequency,
  DealRenewalFrequency,
} from '../../../types/entity.contracts';

export const COMPONENT_RENEWAL_FREQUENCIES: readonly ComponentRenewalFrequency[] = [
  'none',
  'monthly',
  'quarterly',
  'half-yearly',
  'yearly',
  'biennial',
  'custom',
] as const;

export const hasRenewalFrequency = (
  frequency?: string | null,
): frequency is Exclude<ComponentRenewalFrequency, 'none'> =>
  Boolean(frequency) && frequency !== 'none';

/** Compute next renewal from start date + cadence. Custom returns the explicit next date. */
export const computeComponentNextRenewal = (
  startDate: string,
  frequency: ComponentRenewalFrequency,
  customNextDate = '',
): string => {
  if (!hasRenewalFrequency(frequency)) return '';

  if (frequency === 'custom') {
    return customNextDate.trim() || startDate.trim() || '';
  }

  if (!startDate.trim()) return '';

  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) return '';

  if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
  else if (frequency === 'quarterly') date.setMonth(date.getMonth() + 3);
  else if (frequency === 'half-yearly') date.setMonth(date.getMonth() + 6);
  else if (frequency === 'yearly') date.setFullYear(date.getFullYear() + 1);
  else if (frequency === 'biennial') date.setFullYear(date.getFullYear() + 2);

  return date.toISOString().split('T')[0];
};

export const mapLegacyDealFrequency = (
  frequency: DealRenewalFrequency | string | undefined,
): ComponentRenewalFrequency => {
  switch (frequency) {
    case 'monthly':
      return 'monthly';
    case 'quarterly':
      return 'quarterly';
    case 'annual':
      return 'yearly';
    default:
      return 'none';
  }
};

/** Resolve next date for persistence on create/update. */
export const resolveComponentRenewalDate = (input: {
  renewalFrequency: ComponentRenewalFrequency;
  renewalStartDate: string;
  renewalDate?: string;
}): string => {
  const frequency = input.renewalFrequency || 'none';
  if (!hasRenewalFrequency(frequency)) return '';

  const explicit = (input.renewalDate ?? '').trim();
  if (frequency === 'custom') {
    return explicit || input.renewalStartDate.trim();
  }

  return (
    explicit ||
    computeComponentNextRenewal(input.renewalStartDate, frequency)
  );
};
