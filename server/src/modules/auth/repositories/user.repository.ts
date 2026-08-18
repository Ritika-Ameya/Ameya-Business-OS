import { GoogleSheetRepository } from '../../../repositories/googleSheet.repository';
import { bootstrapService, googleSheetsService } from '../../../integrations';
import { USERS_CONTRACT } from '../../../types';
import type { QueryOptions, UserEntity, EntityRowMapper } from '../../../types';
import { userMapper } from '../mappers/auth.mappers';

type UserRow = UserEntity & Record<string, unknown>;

const USERS_CACHE_TTL_MS = 15 * 60_000;

class UserRepository extends GoogleSheetRepository<UserRow> {
  private cache:
    | {
        expiresAt: number;
        users: UserEntity[];
        byEmail: Map<string, UserEntity>;
      }
    | null = null;

  constructor() {
    super(
      'UserRepository',
      googleSheetsService,
      USERS_CONTRACT,
      userMapper as unknown as EntityRowMapper<UserRow>,
      bootstrapService.getHeaderManager(),
    );
  }

  private invalidateCache(): void {
    this.cache = null;
  }

  private buildCache(users: UserEntity[]) {
    const byEmail = new Map<string, UserEntity>();
    for (const user of users) {
      const key = user.email.trim().toLowerCase();
      if (key) byEmail.set(key, user);
    }
    this.cache = {
      expiresAt: Date.now() + USERS_CACHE_TTL_MS,
      users,
      byEmail,
    };
  }

  /** Warm the in-memory user index so the first login avoids a cold Sheets scan. */
  async warmCache(): Promise<void> {
    await this.findAll();
  }

  override async findAll(options?: QueryOptions): Promise<UserRow[]> {
    const includeDeleted = options?.includeDeleted === true;
    if (!includeDeleted && this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.users as UserRow[];
    }

    const users = await super.findAll(options);
    if (!includeDeleted) {
      this.buildCache(users as UserEntity[]);
    }
    return users;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const key = email.trim().toLowerCase();
    if (!key) return null;

    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.byEmail.get(key) ?? null;
    }

    const all = await this.findAll();
    return (all as UserEntity[]).find((u) => u.email.toLowerCase() === key) ?? null;
  }

  override async create(data: Omit<UserRow, 'id'>): Promise<UserRow> {
    const created = await super.create(data);
    this.invalidateCache();
    return created;
  }

  override async update(id: string, data: Partial<UserRow>): Promise<UserRow | null> {
    const updated = await super.update(id, data);
    this.invalidateCache();
    return updated;
  }

  override async delete(id: string): Promise<boolean> {
    const deleted = await super.delete(id);
    this.invalidateCache();
    return deleted;
  }
}

export const userRepository = new UserRepository();
