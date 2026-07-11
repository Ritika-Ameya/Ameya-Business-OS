import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../constants';
import { ApiResponse } from '../utils/apiResponse.util';

export const notFoundHandler = (req: Request, res: Response): void => {
  const meta = req.context
    ? { requestId: req.context.requestId, timestamp: req.context.timestamp }
    : undefined;

  ApiResponse.error(res, MESSAGES.ROUTE_NOT_FOUND, [], HTTP_STATUS.NOT_FOUND, meta);
};
