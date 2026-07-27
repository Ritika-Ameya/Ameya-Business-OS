import { GoogleSheetRepository } from '../../../repositories/googleSheet.repository';
import { bootstrapService, googleSheetsService } from '../../../integrations';
import { USERS_CONTRACT } from '../../../types';
import type { UserEntity, EntityRowMapper } from '../../../types';
import { userMapper } from '../mappers/auth.mappers';

type UserRow = UserEntity & Record<string, unknown>;

class UserRepository extends GoogleSheetRepository<UserRow> {
  constructor() {
    super(
      'UserRepository',
      googleSheetsService,
      USERS_CONTRACT,
      userMapper as unknown as EntityRowMapper<UserRow>,
      bootstrapService.getHeaderManager(),
    );
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const all = await this.findAll();
    return (all as UserEntity[]).find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    ) ?? null;
  }
}

export const userRepository = new UserRepository();
