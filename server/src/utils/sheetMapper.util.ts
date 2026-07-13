import { SHEET_DATA_START_ROW, SHEET_HEADER_ROW } from '../constants/sheets.constants';

export const columnIndexToLetter = (index: number): string => {
  let result = '';
  let n = index;

  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }

  return result;
};

export const buildRowRange = (
  tabName: string,
  rowNumber: number,
  startCol = 0,
  endCol: number,
): string => {
  const start = columnIndexToLetter(startCol);
  const end = columnIndexToLetter(endCol);
  return `'${tabName}'!${start}${rowNumber}:${end}${rowNumber}`;
};

export const buildFullRange = (tabName: string, endCol: number): string => {
  const end = columnIndexToLetter(endCol);
  return `'${tabName}'!A:${end}`;
};

export const parseSheetRows = (
  rows: string[][],
): { headers: string[]; dataRows: string[][] } => {
  if (rows.length === 0) {
    return { headers: [], dataRows: [] };
  }

  const headers = rows[SHEET_HEADER_ROW - 1] ?? [];
  const dataRows = rows.slice(SHEET_DATA_START_ROW - 1);

  return { headers, dataRows };
};

export const rowToRecord = (headers: string[], row: unknown[]): Record<string, string> => {
  const record: Record<string, string> = {};

  headers.forEach((header, index) => {
    if (header) {
      const cell = row[index];
      record[header] = cell === undefined || cell === null ? '' : String(cell);
    }
  });

  return record;
};

export const recordToRow = (headers: string[], record: Record<string, string>): string[] => {
  return headers.map((header) => record[header] ?? '');
};

export const parseBoolean = (value: string | boolean | number | undefined | null): boolean => {
  if (value === undefined || value === null || value === '') return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

export const parseNumberField = (
  value: string | number | undefined | null,
  fallback = 0,
): number => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'number') return Number.isNaN(value) ? fallback : value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};
