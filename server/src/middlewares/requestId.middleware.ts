import type { NextFunction, Request, Response } from 'express';

import { createRequestContext } from '../context';
import { generateId } from '../utils/id.util';

const REQUEST_ID_HEADER = 'x-request-id';

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const incomingId = req.headers[REQUEST_ID_HEADER];
  const requestId =
    typeof incomingId === 'string' && incomingId.trim().length > 0
      ? incomingId.trim()
      : generateId();

  req.context = createRequestContext({}, undefined, requestId);
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
};

export { REQUEST_ID_HEADER };
