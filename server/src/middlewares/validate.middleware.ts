import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import type { ValidationSchema } from '../types';
import { ValidationError } from '../utils/AppError';
import { formatZodErrors } from '../utils/errorMapper.util';

/**
 * Express 5: `req.query` is a read-only getter. Store parsed query on
 * `req.validatedQuery` instead of assigning `req.query`.
 */
declare module 'express-serve-static-core' {
  interface Request {
    validatedQuery?: Record<string, unknown>;
  }
}

export const validate =
  (schema: ValidationSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      if (schema.query) {
        req.validatedQuery = schema.query.parse(req.query) as Record<string, unknown>;
      }

      if (schema.params) {
        req.params = schema.params.parse(req.params) as Request['params'];
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Validation failed', formatZodErrors(error.issues)));
        return;
      }

      next(error);
    }
  };
