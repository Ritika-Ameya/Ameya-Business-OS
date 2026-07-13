import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { validate } from '../../../middlewares';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { parseQueryParams, toQueryOptions } from '../../../utils/queryParser.util';
import { getRouteParam } from '../../../utils/routeParams.util';
import { customerService } from '../services/customer.service';
import {
  customerCreateSchema,
  customerDocumentCreateSchema,
  customerFileParamsSchema,
  customerIdParamSchema,
  customerRecordTypeChangeSchema,
  customerStageChangeSchema,
  customerTimelineNoteSchema,
  customerUpdateSchema,
} from '../validators/customer.validators';

const getSearchParams = (query: Record<string, unknown>) => ({
  q: (query.q ?? query.search) as string | undefined,
  mode: query.searchMode as string | undefined,
  fields: query.searchFields as string | undefined,
});

export class CustomerController {
  readonly list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, unknown>;
    const parsed = parseQueryParams(query);
    const result = await customerService.list(toQueryOptions(parsed), getSearchParams(query));
    ApiResponse.paginated(res, result, MESSAGES.SUCCESS, getResponseMeta(req));
  });

  readonly getById = [
    validate({ params: customerIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await customerService.getById(getRouteParam(req.params.id));
      ApiResponse.success(res, entity, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];

  readonly create = [
    validate({ body: customerCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await customerService.create(req.body);
      ApiResponse.created(res, entity, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly update = [
    validate({ params: customerIdParamSchema, body: customerUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await customerService.update(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly patch = [
    validate({ params: customerIdParamSchema, body: customerUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await customerService.update(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly remove = [
    validate({ params: customerIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await customerService.remove(getRouteParam(req.params.id));
      ApiResponse.deleted(res, MESSAGES.DELETED, getResponseMeta(req));
    }),
  ];

  readonly restore = [
    validate({ params: customerIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await customerService.restore(getRouteParam(req.params.id));
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly changeStage = [
    validate({ params: customerIdParamSchema, body: customerStageChangeSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await customerService.changeStage(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly changeRecordType = [
    validate({ params: customerIdParamSchema, body: customerRecordTypeChangeSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await customerService.changeRecordType(
        getRouteParam(req.params.id),
        req.body,
      );
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly getTimeline = [
    validate({ params: customerIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await customerService.getById(getRouteParam(req.params.id));
      ApiResponse.success(
        res,
        entity.timeline,
        MESSAGES.SUCCESS,
        HTTP_STATUS.OK,
        getResponseMeta(req),
      );
    }),
  ];

  readonly addTimelineNote = [
    validate({ params: customerIdParamSchema, body: customerTimelineNoteSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await customerService.addTimelineNote(
        getRouteParam(req.params.id),
        req.body,
      );
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly listFiles = [
    validate({ params: customerIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const files = await customerService.listFiles(getRouteParam(req.params.id));
      ApiResponse.success(res, files, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];

  readonly addFile = [
    validate({ params: customerIdParamSchema, body: customerDocumentCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const result = await customerService.addFile(getRouteParam(req.params.id), req.body);
      ApiResponse.created(res, result, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly removeFile = [
    validate({ params: customerFileParamsSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await customerService.removeFile(
        getRouteParam(req.params.id),
        getRouteParam(req.params.fileId),
      );
      ApiResponse.deleted(res, MESSAGES.DELETED, getResponseMeta(req));
    }),
  ];
}

export const customerController = new CustomerController();
