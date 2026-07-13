import { ConflictError } from './AppError';

const normalizeComparable = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase();

export interface UniqueFieldCheckOptions {
  field: string;
  value: unknown;
  label: string;
  excludeId?: string;
}

/**
 * Case-insensitive, trimmed uniqueness check against non-deleted entities.
 * Soft-deleted rows must already be excluded by the caller (findAll).
 */
export const assertUniqueField = <T extends { id: string } & Record<string, unknown>>(
  entities: T[],
  options: UniqueFieldCheckOptions,
): void => {
  const expected = normalizeComparable(options.value);
  if (!expected) {
    return;
  }

  const duplicate = entities.find((entity) => {
    if (options.excludeId && entity.id === options.excludeId) {
      return false;
    }
    return normalizeComparable(entity[options.field]) === expected;
  });

  if (duplicate) {
    throw new ConflictError(
      `${options.label} with ${options.field} "${String(options.value).trim()}" already exists`,
    );
  }
};

export const assertUniqueFields = <T extends { id: string } & Record<string, unknown>>(
  entities: T[],
  fields: string[],
  candidate: Record<string, unknown>,
  resourceLabel: string,
  excludeId?: string,
): void => {
  for (const field of fields) {
    if (!(field in candidate) || candidate[field] === undefined) {
      continue;
    }

    assertUniqueField(entities, {
      field,
      value: candidate[field],
      label: resourceLabel,
      excludeId,
    });
  }
};
