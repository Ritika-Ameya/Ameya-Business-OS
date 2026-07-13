import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../constants';
import { ApiResponse } from '../utils/apiResponse.util';
import { getResponseMeta } from '../utils/responseMeta.util';

export const notFoundHandler = (req: Request, res: Response): void => {
  ApiResponse.error(res, MESSAGES.ROUTE_NOT_FOUND, [], HTTP_STATUS.NOT_FOUND, getResponseMeta(req));
};
