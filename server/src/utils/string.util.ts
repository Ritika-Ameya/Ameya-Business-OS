export const capitalize = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const toCamelCase = (value: string): string => {
  return value
    .replace(/[-_\s]+(.)?/g, (_, char: string | undefined) =>
      char ? char.toUpperCase() : '',
    )
    .replace(/^(.)/, (char) => char.toLowerCase());
};

export const toSnakeCase = (value: string): string => {
  return value
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
};

export const truncate = (value: string, maxLength: number, suffix = '...'): string => {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength - suffix.length) + suffix;
};

export const isBlank = (value: string | null | undefined): boolean => {
  return value === null || value === undefined || value.trim().length === 0;
};

export const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
