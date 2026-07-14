import type { Request, Response } from 'express';
import { ZodError } from 'zod';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { ValidationError } from '../../../utils/AppError';
import { formatZodErrors } from '../../../utils/errorMapper.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { reportService } from '../services/report.service';
import type { ReportFilters } from '../types/analytics.types';
import { reportFiltersQuerySchema } from '../validators/analytics.validators';

const toReportFilters = (query: unknown): ReportFilters => {
  try {
    const parsed = reportFiltersQuerySchema.parse(query);
    return {
      datePreset: parsed.datePreset,
      dateFrom: parsed.dateFrom,
      dateTo: parsed.dateTo,
      customer: parsed.customer,
      deal: parsed.deal,
      status: parsed.status,
      category: parsed.category,
      employee: parsed.employee,
      vendor: parsed.vendor,
      search: parsed.search,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Validation failed', formatZodErrors(error.issues));
    }
    throw error;
  }
};

export class ReportController {
  readonly getRevenue = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await reportService.getRevenueReport(toReportFilters(req.query));
    ApiResponse.success(res, result, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
  });

  readonly getExpenses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await reportService.getExpenseReport(toReportFilters(req.query));
    ApiResponse.success(res, result, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
  });

  readonly getOutstanding = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await reportService.getOutstandingReport(toReportFilters(req.query));
    ApiResponse.success(res, result, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
  });

  readonly getRenewals = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await reportService.getRenewalReport(toReportFilters(req.query));
    ApiResponse.success(res, result, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
  });
}

export const reportController = new ReportController();
