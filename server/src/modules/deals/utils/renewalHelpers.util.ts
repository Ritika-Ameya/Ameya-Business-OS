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

const pad2 = (value: number): string => String(value).padStart(2, '0');

const parseLocalIsoDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toLocalIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const todayLocalIso = (): string => toLocalIsoDate(new Date());

/** Add one cadence interval to a local ISO date. Custom returns the same date. */
export const addRenewalInterval = (
  isoDate: string,
  frequency: ComponentRenewalFrequency,
): string => {
  if (!hasRenewalFrequency(frequency) || frequency === 'custom') {
    return isoDate.trim();
  }

  const date = parseLocalIsoDate(isoDate);
  if (!date) return '';

  if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
  else if (frequency === 'quarterly') date.setMonth(date.getMonth() + 3);
  else if (frequency === 'half-yearly') date.setMonth(date.getMonth() + 6);
  else if (frequency === 'yearly') date.setFullYear(date.getFullYear() + 1);
  else if (frequency === 'biennial') date.setFullYear(date.getFullYear() + 2);

  return toLocalIsoDate(date);
};

/** @deprecated Use addRenewalInterval for rolling a cycle; first due date is the start date. */
export const computeComponentNextRenewal = (
  startDate: string,
  frequency: ComponentRenewalFrequency,
  customNextDate = '',
): string => {
  if (!hasRenewalFrequency(frequency)) return '';
  if (frequency === 'custom') {
    return customNextDate.trim() || startDate.trim() || '';
  }
  return addRenewalInterval(startDate, frequency);
};

export const getComponentCurrentDueDate = (component: {
  renewalStartDate?: string;
  renewalDate?: string;
  lastRenewedDate?: string;
}): string => {
  const start = (component.renewalStartDate || '').trim();
  const next = (component.renewalDate || '').trim();
  if (component.lastRenewedDate?.trim()) {
    return next || start;
  }
  if (!start) return next;
  if (!next) return start;
  if (start >= todayLocalIso()) return start;
  return next;
};

export type RenewalAdvanceResult = {
  lastRenewedDate: string;
  renewalDate: string;
  status: 'pending';
};

/**
 * Record payment for the unpaid cycle and roll next due forward.
 * Does not wait for the due date — early payment (e.g. paying 1 Jan 2027 in Aug 2026)
 * still marks that cycle paid and sets next due to the following period.
 */
export const tryAdvanceComponentRenewal = (component: {
  renewalFrequency?: string | null;
  renewalStartDate?: string;
  renewalDate?: string;
  lastRenewedDate?: string;
}): RenewalAdvanceResult | null => {
  const frequency = (component.renewalFrequency || 'none') as ComponentRenewalFrequency;
  if (!hasRenewalFrequency(frequency)) return null;

  const currentDue = getComponentCurrentDueDate(component);
  if (!currentDue) return null;
  if ((component.lastRenewedDate || '').trim() === currentDue) return null;

  const nextDue =
    frequency === 'custom'
      ? (component.renewalDate || currentDue).trim()
      : addRenewalInterval(currentDue, frequency);
  if (!nextDue || nextDue === currentDue) return null;

  return {
    lastRenewedDate: currentDue,
    renewalDate: nextDue,
    status: 'pending',
  };
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

  return explicit || input.renewalStartDate.trim();
};
