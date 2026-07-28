import { parsePhoneNumberFromString } from "libphonenumber-js";

const UNSAFE_PREFIX = /^[=\-@]/;

export const normalizePhoneToE164 = (
  value: string,
  options?: { required?: boolean; defaultCountry?: "IN" }
): string => {
  const required = options?.required ?? false;
  const defaultCountry = options?.defaultCountry ?? "IN";
  const trimmed = value.trim();

  if (!trimmed) {
    return required ? "__INVALID__" : "";
  }

  if (UNSAFE_PREFIX.test(trimmed)) {
    return "__INVALID__";
  }

  const parsed = trimmed.startsWith("+")
    ? parsePhoneNumberFromString(trimmed)
    : parsePhoneNumberFromString(trimmed, defaultCountry);

  if (!parsed?.isValid()) {
    return "__INVALID__";
  }

  return parsed.number;
};

export const isValidPhoneNumberInput = (
  value: string,
  options?: { required?: boolean }
): boolean => normalizePhoneToE164(value, options) !== "__INVALID__";

export const formatPhoneForDisplay = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parsed = trimmed.startsWith("+")
    ? parsePhoneNumberFromString(trimmed)
    : parsePhoneNumberFromString(trimmed, "IN");
  return parsed?.isValid() ? parsed.formatInternational() : trimmed;
};
