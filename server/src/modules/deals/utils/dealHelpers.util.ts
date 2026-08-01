import type { StageMasterEntity } from '../../masters/types/master.entities';
import { ValidationError } from '../../../utils/AppError';

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
