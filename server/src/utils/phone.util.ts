import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { ValidationError } from './AppError';

const FORMULA_PREFIX_REGEX = /^[=\-@]/;
const MULTI_PLUS_REGEX = /\+/g;

const hasUnsafeFormulaPrefix = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed.startsWith('+')) {
    const plusCount = (trimmed.match(MULTI_PLUS_REGEX) ?? []).length;
    if (plusCount > 1) return true;
    // Valid phone values can start with a single plus.
    return false;
  }
  return FORMULA_PREFIX_REGEX.test(trimmed);
};

export const normalizePhoneToE164 = (
  value: string,
  options?: { required?: boolean; defaultCountry?: 'IN' },
): string => {
  const required = options?.required ?? false;
  const defaultCountry = options?.defaultCountry ?? 'IN';
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    if (required) {
      throw new ValidationError('Please enter a valid mobile number.');
    }
    return '';
  }

  if (hasUnsafeFormulaPrefix(trimmed)) {
    throw new ValidationError('Invalid phone number format.');
  }

  const parsed = trimmed.startsWith('+')
    ? parsePhoneNumberFromString(trimmed)
    : parsePhoneNumberFromString(trimmed, defaultCountry);

  if (!parsed?.isValid()) {
    throw new ValidationError('Please enter a valid mobile number.');
  }

  return parsed.number;
};
