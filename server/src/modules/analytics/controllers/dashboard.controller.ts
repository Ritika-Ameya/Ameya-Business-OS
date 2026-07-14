import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { dashboardService } from '../services/dashboard.service';

export class DashboardController {
  readonly getSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const summary = await dashboardService.getSummary();
    ApiResponse.success(res, summary, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
  });
}

export const dashboardController = new DashboardController();
