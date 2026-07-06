import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants';
import { sendError } from '../utils/apiResponse.util';

export const notFoundHandler = (_req: Request, res: Response): void => {
  sendError(res, 'Route not found', [], HTTP_STATUS.NOT_FOUND);
};
