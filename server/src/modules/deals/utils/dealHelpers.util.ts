import type { DealRenewalFrequency } from '../types/deal.entities';
import type { StageMasterEntity } from '../../masters/types/master.entities';
import { ValidationError } from '../../../utils/AppError';

export const computeNextRenewal = (
  startDate: string,
  frequency: DealRenewalFrequency,
): string => {
  if (!startDate || frequency === 'none') return '';

  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) return '';

  if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
  else if (frequency === 'quarterly') date.setMonth(date.getMonth() + 3);
  else if (frequency === 'annual') date.setFullYear(date.getFullYear() + 1);

  return date.toISOString().split('T')[0];
};

export const assertStageChangeRequirements = (
  stage: StageMasterEntity,
  payload: { nextActionDate?: string; notes?: string },
): void => {
  const errors: string[] = [];

  if (stage.dateRequired && !String(payload.nextActionDate ?? '').trim()) {
    errors.push('Next action date is required for this stage');
  }

  if (stage.notesRequired && !String(payload.notes ?? '').trim()) {
    errors.push('Notes are required for this stage');
  }

  if (errors.length > 0) {
    throw new ValidationError('Stage change validation failed', errors);
  }
};

export const getDefaultDealStage = (
  stages: StageMasterEntity[],
): StageMasterEntity | undefined =>
  stages
    .filter((stage) => stage.isActive)
    .sort((a, b) => a.sequence - b.sequence)[0];
