import { ValidationError } from './AppError';

export interface ForeignKeyRule {
  field: string;
  label: string;
  exists: (id: string) => Promise<boolean>;
}

/**
 * Validates that referenced IDs exist in related master collections.
 * Soft-deleted parents are treated as missing (repository findById returns null).
 */
export const assertForeignKeys = async (
  candidate: Record<string, unknown>,
  rules: ForeignKeyRule[],
): Promise<void> => {
  for (const rule of rules) {
    if (!(rule.field in candidate) || candidate[rule.field] === undefined) {
      continue;
    }

    const value = String(candidate[rule.field] ?? '').trim();
    if (!value) {
      throw new ValidationError(`${rule.label} is required`, [
        `${rule.field} must reference an existing ${rule.label}`,
      ]);
    }

    const exists = await rule.exists(value);
    if (!exists) {
      throw new ValidationError(`${rule.label} not found for ${rule.field}="${value}"`, [
        `Invalid foreign key: ${rule.field}`,
      ]);
    }
  }
};
