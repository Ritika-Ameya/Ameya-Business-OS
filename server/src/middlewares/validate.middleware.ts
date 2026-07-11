import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';

import type { ValidationSchema } from '../types';
import { ValidationError } from '../utils/AppError';
import { formatZodErrors } from '../utils/errorMapper.util';

export const validate =
  (schema: ValidationSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = (schema.body as ZodType).parse(req.body);
      }

      if (schema.query) {
        req.query = (schema.query as ZodType).parse(req.query) as Request['query'];
      }

      if (schema.params) {
        req.params = (schema.params as ZodType).parse(req.params) as Request['params'];
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
