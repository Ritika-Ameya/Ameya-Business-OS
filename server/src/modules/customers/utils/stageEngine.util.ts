import type { StageMasterEntity } from '../../masters/types/master.entities';
import type { CustomerRecordType, CustomerStatus } from '../types/customer.entities';
import { ValidationError } from '../../../utils/AppError';

export const getActiveStagesSorted = (stages: StageMasterEntity[]): StageMasterEntity[] =>
  stages
    .filter((stage) => stage.isActive)
    .sort((a, b) => a.sequence - b.sequence);

export const isStageApplicableForRecordType = (
  stage: StageMasterEntity,
  recordType: CustomerRecordType,
): boolean => stage.applicableFor === 'both' || stage.applicableFor === recordType;

export const getStagesForRecordType = (
  stages: StageMasterEntity[],
  recordType: CustomerRecordType,
): StageMasterEntity[] =>
  getActiveStagesSorted(stages).filter((stage) =>
    isStageApplicableForRecordType(stage, recordType),
  );

export const getDefaultStageForRecordType = (
  stages: StageMasterEntity[],
  recordType: CustomerRecordType,
): StageMasterEntity | undefined => getStagesForRecordType(stages, recordType)[0];

export const resolveRecordTypeFromStage = (
  currentRecordType: CustomerRecordType,
  stage: StageMasterEntity,
): CustomerRecordType => {
  if (stage.applicableFor === 'customer' || stage.canConvertToCustomer) {
    return 'customer';
  }
  return currentRecordType;
};

export const resolveStatusAfterRecordTypeChange = (
  status: CustomerStatus,
  recordType: CustomerRecordType,
): CustomerStatus => {
  if (recordType === 'customer' && status === 'prospect') {
    return 'active';
  }
  return status;
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

export const getReminderOffsetDays = (
  offset: StageMasterEntity['reminderOffset'],
): number => {
  switch (offset) {
    case 'same-day':
      return 0;
    case '1-day-before':
      return 1;
    case '3-days-before':
      return 3;
    case '7-days-before':
      return 7;
    default:
      return 1;
  }
};

export const computeReminderDate = (
  nextActionDate: string,
  offset: StageMasterEntity['reminderOffset'],
): string => {
  const date = new Date(nextActionDate);
  date.setDate(date.getDate() - getReminderOffsetDays(offset));
  return date.toISOString().split('T')[0];
};
