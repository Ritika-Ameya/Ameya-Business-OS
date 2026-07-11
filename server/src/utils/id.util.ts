import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const generateShortId = (length = 8): string => {
  return uuidv4().replace(/-/g, '').slice(0, length);
};

export const isValidUuid = (value: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};
