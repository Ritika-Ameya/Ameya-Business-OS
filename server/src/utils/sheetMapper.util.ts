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

export const rowToRecord = (headers: string[], row: string[]): Record<string, string> => {
  const record: Record<string, string> = {};

  headers.forEach((header, index) => {
    if (header) {
      record[header] = row[index] ?? '';
    }
  });

  return record;
};

export const recordToRow = (headers: string[], record: Record<string, string>): string[] => {
  return headers.map((header) => record[header] ?? '');
};

export const parseBoolean = (value: string | undefined): boolean => {
  if (!value) return false;
  return value === 'true' || value === '1' || value.toLowerCase() === 'yes';
};

export const parseNumberField = (value: string | undefined, fallback = 0): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};
