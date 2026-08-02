import { createBaseEntityMapper } from '../../../utils/entityMapper.util';
import { parseBoolean } from '../../../utils/sheetMapper.util';
import type { SettingEntity } from '../../../types';

const str = (r: Record<string, string>, k: string, fb = ''): string => r[k] ?? fb;

export const settingMapper = createBaseEntityMapper<SettingEntity>(
  (record, base) => ({
    ...base,
    key: str(record, 'key'),
    value: str(record, 'value'),
    category: str(record, 'category'),
    description: str(record, 'description') || undefined,
    isSystem: parseBoolean(record.isSystem),
  }),
  (entity) => ({
    key: String(entity.key ?? ''),
    value: String(entity.value ?? ''),
    category: String(entity.category ?? ''),
    description: String(entity.description ?? ''),
    isSystem: String(entity.isSystem ?? false),
  }),
);
