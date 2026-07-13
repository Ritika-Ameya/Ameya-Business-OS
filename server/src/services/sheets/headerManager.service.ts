import { columnIndexToLetter } from '../../utils/sheetMapper.util';
import { ValidationError } from '../../utils/AppError';
import { BaseService } from '../base.service';
import type { GoogleSheetsService } from '../googleSheets.service';

export interface HeaderEnsureResult {
  tabName: string;
  headers: string[];
  createdHeaderRow: boolean;
  addedHeaders: string[];
  alreadyPresent: string[];
}

export class HeaderManager extends BaseService {
  constructor(private readonly sheetsService: GoogleSheetsService) {
    super('HeaderManager');
  }

  buildHeaderIndexMap(headers: string[]): Map<string, number> {
    const map = new Map<string, number>();

    headers.forEach((header, index) => {
      const name = String(header ?? '').trim();
      if (name && !map.has(name)) {
        map.set(name, index);
      }
    });

    return map;
  }

  assertMandatoryHeaders(tabName: string, headers: string[], required: readonly string[]): void {
    const map = this.buildHeaderIndexMap(headers);
    const missing = required.filter((column) => !map.has(column));

    if (missing.length > 0) {
      throw new ValidationError(
        `Mandatory header(s) missing from worksheet "${tabName}": ${missing.join(', ')}`,
        missing.map((column) => `Missing header: ${column}`),
      );
    }
  }

  async readHeaderRow(tabName: string): Promise<string[]> {
    const rows = await this.sheetsService.readByRange(`'${tabName}'!1:1`);
    return (rows[0] ?? []).map((cell) => String(cell ?? '').trim());
  }

  /**
   * Ensures required headers exist.
   * - Creates header row when empty
   * - Appends missing headers at the end only
   * - Never reorders existing headers
   * - Never overwrites data values
   */
  async ensureHeaders(
    tabName: string,
    requiredColumns: readonly string[],
  ): Promise<HeaderEnsureResult> {
    const existing = await this.readHeaderRow(tabName);
    const hasAnyHeader = existing.some((header) => header.length > 0);

    if (!hasAnyHeader) {
      const headers = [...requiredColumns];
      const endLetter = columnIndexToLetter(Math.max(headers.length - 1, 0));
      await this.sheetsService.updateRows(`'${tabName}'!A1:${endLetter}1`, [headers]);
      this.logInfo(`Created header row on "${tabName}" (${headers.length} columns)`);

      return {
        tabName,
        headers,
        createdHeaderRow: true,
        addedHeaders: headers,
        alreadyPresent: [],
      };
    }

    const existingSet = new Set(existing.filter(Boolean));
    const alreadyPresent = requiredColumns.filter((column) => existingSet.has(column));
    const missing = requiredColumns.filter((column) => !existingSet.has(column));

    if (missing.length === 0) {
      return {
        tabName,
        headers: existing,
        createdHeaderRow: false,
        addedHeaders: [],
        alreadyPresent,
      };
    }

    let lastFilledIndex = -1;
    for (let i = 0; i < existing.length; i += 1) {
      if (existing[i]) {
        lastFilledIndex = i;
      }
    }

    const preserved = existing.slice(0, lastFilledIndex + 1);
    const nextHeaders = [...preserved, ...missing];
    const endLetter = columnIndexToLetter(Math.max(nextHeaders.length - 1, 0));

    await this.sheetsService.updateRows(`'${tabName}'!A1:${endLetter}1`, [nextHeaders]);
    this.logInfo(
      `Appended ${missing.length} missing header(s) on "${tabName}": ${missing.join(', ')}`,
    );

    return {
      tabName,
      headers: nextHeaders,
      createdHeaderRow: false,
      addedHeaders: missing,
      alreadyPresent,
    };
  }
}
