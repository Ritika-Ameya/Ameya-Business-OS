import { GoogleSheetRepository } from '../../../repositories/googleSheet.repository';
import { bootstrapService, googleSheetsService } from '../../../integrations';
import { ACTIVITY_LOGS_CONTRACT } from '../../../types';
import type { ActivityLogEntity, EntityRowMapper } from '../../../types';
import { createBaseEntityMapper } from '../../../utils/entityMapper.util';

const activityLogMapper = createBaseEntityMapper<ActivityLogEntity>(
  (record, base) => ({
    ...base,
    entityType: record.entityType ?? '',
    entityId: record.entityId ?? '',
    action: record.action ?? '',
    actorId: record.actorId ?? '',
    details: record.details || undefined,
    occurredAt: record.occurredAt ?? '',
  }),
  (entity) => ({
    entityType: String(entity.entityType ?? ''),
    entityId: String(entity.entityId ?? ''),
    action: String(entity.action ?? ''),
    actorId: String(entity.actorId ?? ''),
    details: String(entity.details ?? ''),
    occurredAt: String(entity.occurredAt ?? ''),
  }),
);

type ActivityLogRow = ActivityLogEntity & Record<string, unknown>;

class ActivityLogRepository extends GoogleSheetRepository<ActivityLogRow> {
  constructor() {
    super(
      'ActivityLogRepository',
      googleSheetsService,
      ACTIVITY_LOGS_CONTRACT,
      activityLogMapper as unknown as EntityRowMapper<ActivityLogRow>,
      bootstrapService.getHeaderManager(),
    );
  }

  async findByEntity(entityType: string, entityId: string): Promise<ActivityLogEntity[]> {
    const all = await this.findAll();
    return (all as ActivityLogEntity[]).filter(
      (l) => l.entityType === entityType && l.entityId === entityId,
    );
  }
}

export const activityLogRepository = new ActivityLogRepository();
