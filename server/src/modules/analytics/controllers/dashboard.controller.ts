import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { validate } from '../../../middlewares/validate.middleware';
import { dashboardService } from '../services/dashboard.service';
import {
  dashboardQuerySchema,
  type DashboardQuery,
} from '../validators/analytics.validators';
import type { DashboardPeriod } from '../utils/dashboardPeriod.util';

export class DashboardController {
  readonly getSummary = [
    validate({ query: dashboardQuerySchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const query = (req.validatedQuery ?? {}) as DashboardQuery;
      const summary = await dashboardService.getSummary({
        period: query.period as DashboardPeriod,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        year: query.year,
        month: query.month,
      });
      ApiResponse.success(res, summary, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];
}

export const dashboardController = new DashboardController();
