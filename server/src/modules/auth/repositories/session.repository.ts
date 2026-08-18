import { GoogleSheetRepository } from '../../../repositories/googleSheet.repository';
import { bootstrapService, googleSheetsService } from '../../../integrations';
import { SESSIONS_CONTRACT } from '../../../types';
import type { SessionEntity, EntityRowMapper } from '../../../types';
import { sessionMapper } from '../mappers/auth.mappers';

type SessionRow = SessionEntity & Record<string, unknown>;

class SessionRepository extends GoogleSheetRepository<SessionRow> {
  /** Sessions created this process that may not have landed in Sheets yet. */
  private readonly pendingById = new Map<string, SessionRow>();

  constructor() {
    super(
      'SessionRepository',
      googleSheetsService,
      SESSIONS_CONTRACT,
      sessionMapper as unknown as EntityRowMapper<SessionRow>,
      bootstrapService.getHeaderManager(),
    );
  }

  override async create(data: Omit<SessionRow, 'id'>): Promise<SessionRow> {
    const created = await super.create(data);
    this.pendingById.set(created.id, created);
    return created;
  }

  rememberPending(session: SessionRow): void {
    this.pendingById.set(session.id, {
      ...session,
      createdAt: session.createdAt || new Date().toISOString(),
      updatedAt: session.updatedAt || new Date().toISOString(),
      deletedAt: session.deletedAt ?? null,
      isDeleted: Boolean(session.isDeleted),
      version: session.version || 1,
    } as SessionRow);
  }

  override async findById(id: string): Promise<SessionRow | null> {
    const pending = this.pendingById.get(id);
    if (pending && !pending.isDeleted && !pending.isRevoked) {
      return pending;
    }
    const found = await super.findById(id);
    if (found) this.pendingById.delete(id);
    return found;
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
