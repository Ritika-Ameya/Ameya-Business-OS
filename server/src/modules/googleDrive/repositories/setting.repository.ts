import { GoogleSheetRepository } from '../../../repositories/googleSheet.repository';
import { bootstrapService, googleSheetsService } from '../../../integrations';
import { SETTINGS_CONTRACT } from '../../../types';
import type { SettingEntity, EntityRowMapper } from '../../../types';
import { settingMapper } from './setting.mapper';

type SettingRow = SettingEntity & Record<string, unknown>;

class SettingRepository extends GoogleSheetRepository<SettingRow> {
  constructor() {
    super(
      'SettingRepository',
      googleSheetsService,
      SETTINGS_CONTRACT,
      settingMapper as unknown as EntityRowMapper<SettingRow>,
      bootstrapService.getHeaderManager(),
    );
  }

  async findByKey(key: string): Promise<SettingEntity | null> {
    const normalized = key.trim().toLowerCase();
    const all = await this.findAll();
    return (
      (all as SettingEntity[]).find(
        (item) => item.key.trim().toLowerCase() === normalized && !item.isDeleted,
      ) ?? null
    );
  }

  async upsertByKey(input: {
    key: string;
    value: string;
    category: string;
    description?: string;
    isSystem?: boolean;
  }): Promise<SettingEntity> {
    const existing = await this.findByKey(input.key);
    if (existing) {
      const updated = await this.update(existing.id, {
        value: input.value,
        category: input.category,
        description: input.description ?? existing.description,
        isSystem: input.isSystem ?? existing.isSystem,
      } as Partial<SettingRow>);
      return updated as SettingEntity;
    }

    return (await this.create({
      key: input.key,
      value: input.value,
      category: input.category,
      description: input.description ?? '',
      isSystem: input.isSystem ?? true,
    } as unknown as Omit<SettingRow, 'id'>)) as SettingEntity;
  }

  async softDeleteByKey(key: string): Promise<boolean> {
    const existing = await this.findByKey(key);
    if (!existing) return false;
    return this.delete(existing.id);
  }
}

export const settingRepository = new SettingRepository();
