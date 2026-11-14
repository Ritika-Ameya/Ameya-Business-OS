import type { StageMasterEntity } from '../../masters/types/master.entities';
import type { CustomerRecordType, CustomerStatus } from '../types/customer.entities';
import { ValidationError } from '../../../utils/AppError';

export const getActiveStagesSorted = (stages: StageMasterEntity[]): StageMasterEntity[] =>
  stages
    .filter((stage) => stage.isActive)
    .sort((a, b) => a.sequence - b.sequence);

/** Uncategorized uses the opportunity stages. It is not a lead and not a customer. */
const stageRecordType = (recordType: CustomerRecordType): 'opportunity' | 'customer' =>
  recordType === 'customer' ? 'customer' : 'opportunity';

export const isStageApplicableForRecordType = (
  stage: StageMasterEntity,
  recordType: CustomerRecordType,
): boolean =>
  stage.applicableFor === 'both' || stage.applicableFor === stageRecordType(recordType);

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

/**
 * Stage Builder saves canConvertToCustomer=true for every "both" stage, so on a
 * shared stage the flag only means "usable by customers" and must not convert.
 */
export const resolveRecordTypeFromStage = (
  currentRecordType: CustomerRecordType,
  stage: StageMasterEntity,
): CustomerRecordType => {
  if (currentRecordType === 'uncategorized') {
    return stage.applicableFor === 'customer' ? 'customer' : 'uncategorized';
  }
  if (stage.applicableFor === 'customer') {
    return 'customer';
  }
  if (stage.applicableFor === 'opportunity' && stage.canConvertToCustomer) {
    return 'customer';
  }
  return currentRecordType;
};

export const isInactiveStage = (stage: { name: string }): boolean =>
  stage.name.trim().toLowerCase() === 'inactive';

export const isLostStage = (stage: { name: string }): boolean =>
  stage.name.trim().toLowerCase() === 'lost';

/** Stages that close the opportunity and drop the next-action date. */
export const isClosedStage = (stage: { name: string }): boolean =>
  isInactiveStage(stage) || isLostStage(stage);

export const resolveStatusAfterRecordTypeChange = (
  status: CustomerStatus,
  recordType: CustomerRecordType,
): CustomerStatus => {
  if (recordType === 'customer' && (status === 'prospect' || status === 'lost')) {
    return 'active';
  }
  return status;
};

export const resolveStatusFromStage = (
  stage: StageMasterEntity,
  recordType: CustomerRecordType,
  currentStatus: CustomerStatus,
): CustomerStatus => {
  if (isLostStage(stage)) return 'lost';
  if (isInactiveStage(stage)) return 'inactive';
  if (recordType !== 'customer') {
    return resolveStatusAfterRecordTypeChange(currentStatus, recordType);
  }
  return 'active';
};

export const assertStageChangeRequirements = (
  stage: StageMasterEntity,
  payload: { nextActionDate?: string; notes?: string },
): void => {
  const errors: string[] = [];

  if (
    stage.dateRequired &&
    !isClosedStage(stage) &&
    !String(payload.nextActionDate ?? '').trim()
  ) {
    errors.push('Next action date is required for this stage');
  }

  if (
    (stage.notesRequired || isLostStage(stage)) &&
    !String(payload.notes ?? '').trim()
  ) {
    errors.push(
      isLostStage(stage)
        ? 'Remarks are required when marking as lost'
        : 'Notes are required for this stage',
    );
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
