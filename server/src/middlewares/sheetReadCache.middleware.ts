import type { NextFunction, Request, Response } from 'express';

import { enterSheetReadCache } from '../services/sheets/sheetReadCache';

/**
 * Binds a request-scoped Google Sheets read cache for the lifetime of the request.
 */
export const sheetReadCacheMiddleware = (
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  enterSheetReadCache();
  next();
};
