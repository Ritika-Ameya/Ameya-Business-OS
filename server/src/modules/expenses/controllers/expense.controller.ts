import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { validate } from '../../../middlewares';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { parseQueryParams, toQueryOptions } from '../../../utils/queryParser.util';
import { getRouteParam } from '../../../utils/routeParams.util';
import { expenseService } from '../services/expense.service';
import {
  expenseCreateSchema,
  expenseDocumentCreateSchema,
  expenseFileParamsSchema,
  expenseIdParamSchema,
  expenseStatusChangeSchema,
  expenseUpdateSchema,
} from '../validators/expense.validators';

const getSearchParams = (query: Record<string, unknown>) => ({
  q: (query.q ?? query.search) as string | undefined,
  mode: query.searchMode as string | undefined,
  fields: query.searchFields as string | undefined,
});

export class ExpenseController {
  readonly list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, unknown>;
    const parsed = parseQueryParams(query);
    const result = await expenseService.list(toQueryOptions(parsed), getSearchParams(query));
    ApiResponse.paginated(res, result, MESSAGES.SUCCESS, getResponseMeta(req));
  });

  readonly getById = [
    validate({ params: expenseIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await expenseService.getById(getRouteParam(req.params.id));
      ApiResponse.success(res, entity, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];

  readonly create = [
    validate({ body: expenseCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await expenseService.create(req.body);
      ApiResponse.created(res, entity, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly update = [
    validate({ params: expenseIdParamSchema, body: expenseUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await expenseService.update(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly patch = [
    validate({ params: expenseIdParamSchema, body: expenseUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await expenseService.patch(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly remove = [
    validate({ params: expenseIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await expenseService.remove(getRouteParam(req.params.id));
      ApiResponse.deleted(res, MESSAGES.DELETED, getResponseMeta(req));
    }),
  ];

  readonly restore = [
    validate({ params: expenseIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await expenseService.restore(getRouteParam(req.params.id));
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly changeStatus = [
    validate({ params: expenseIdParamSchema, body: expenseStatusChangeSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await expenseService.changeStatus(
        getRouteParam(req.params.id),
        req.body.status,
      );
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly listFiles = [
    validate({ params: expenseIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const files = await expenseService.listFiles(getRouteParam(req.params.id));
      ApiResponse.success(res, files, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];

  readonly addFile = [
    validate({ params: expenseIdParamSchema, body: expenseDocumentCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const result = await expenseService.addFile(getRouteParam(req.params.id), req.body);
      ApiResponse.created(res, result, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly removeFile = [
    validate({ params: expenseFileParamsSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const expense = await expenseService.removeFile(
        getRouteParam(req.params.id),
        getRouteParam(req.params.fileId),
      );
      ApiResponse.updated(res, expense, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];
}

export const expenseController = new ExpenseController();
