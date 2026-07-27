import { GoogleSheetRepository } from '../../../repositories/googleSheet.repository';
import { bootstrapService, googleSheetsService } from '../../../integrations';
import { SESSIONS_CONTRACT } from '../../../types';
import type { SessionEntity, EntityRowMapper } from '../../../types';
import { sessionMapper } from '../mappers/auth.mappers';

type SessionRow = SessionEntity & Record<string, unknown>;

class SessionRepository extends GoogleSheetRepository<SessionRow> {
  constructor() {
    super(
      'SessionRepository',
      googleSheetsService,
      SESSIONS_CONTRACT,
      sessionMapper as unknown as EntityRowMapper<SessionRow>,
      bootstrapService.getHeaderManager(),
    );
  }

  async findByUserId(userId: string): Promise<SessionEntity[]> {
    const all = await this.findAll();
    return (all as SessionEntity[]).filter((s) => s.userId === userId && !s.isRevoked);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const sessions = await this.findByUserId(userId);
    for (const session of sessions) {
      await this.update(session.id, { isRevoked: true } as Partial<SessionRow>);
    }
  }
}

export const sessionRepository = new SessionRepository();
