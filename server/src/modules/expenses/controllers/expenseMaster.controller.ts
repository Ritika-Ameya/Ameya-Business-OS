import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { validate } from '../../../middlewares';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { parseQueryParams, toQueryOptions } from '../../../utils/queryParser.util';
import { getRouteParam } from '../../../utils/routeParams.util';
import { expenseMasterService } from '../services/expense.service';
import {
  expenseIdParamSchema,
  expenseMasterCreateSchema,
  expenseMasterUpdateSchema,
} from '../validators/expense.validators';

const getSearchParams = (query: Record<string, unknown>) => ({
  q: (query.q ?? query.search) as string | undefined,
  mode: query.searchMode as string | undefined,
  fields: query.searchFields as string | undefined,
});

export class ExpenseMasterController {
  readonly list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, unknown>;
    const parsed = parseQueryParams(query);
    const result = await expenseMasterService.list(
      toQueryOptions(parsed),
      getSearchParams(query),
    );
    ApiResponse.paginated(res, result, MESSAGES.SUCCESS, getResponseMeta(req));
  });

  readonly getById = [
    validate({ params: expenseIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await expenseMasterService.getById(getRouteParam(req.params.id));
      ApiResponse.success(res, entity, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];

  readonly create = [
    validate({ body: expenseMasterCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await expenseMasterService.create(req.body);
      ApiResponse.created(res, entity, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly update = [
    validate({ params: expenseIdParamSchema, body: expenseMasterUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await expenseMasterService.update(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly patch = [
    validate({ params: expenseIdParamSchema, body: expenseMasterUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await expenseMasterService.patch(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly remove = [
    validate({ params: expenseIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await expenseMasterService.remove(getRouteParam(req.params.id));
      ApiResponse.deleted(res, MESSAGES.DELETED, getResponseMeta(req));
    }),
  ];

  readonly restore = [
    validate({ params: expenseIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await expenseMasterService.restore(getRouteParam(req.params.id));
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];
}

export const expenseMasterController = new ExpenseMasterController();
