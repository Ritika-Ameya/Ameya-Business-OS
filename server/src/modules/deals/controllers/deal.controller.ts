import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { validate } from '../../../middlewares';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { parseQueryParams, toQueryOptions } from '../../../utils/queryParser.util';
import { getRouteParam } from '../../../utils/routeParams.util';
import { dealService } from '../services/deal.service';
import {
  dealComponentCreateSchema,
  dealComponentParamsSchema,
  dealComponentUpdateSchema,
  dealCreateSchema,
  dealDocumentCreateSchema,
  dealFileParamsSchema,
  dealIdParamSchema,
  dealStageChangeSchema,
  dealStatusChangeSchema,
  dealTimelineNoteSchema,
  dealUpdateSchema,
} from '../validators/deal.validators';

const getSearchParams = (query: Record<string, unknown>) => ({
  q: (query.q ?? query.search) as string | undefined,
  mode: query.searchMode as string | undefined,
  fields: query.searchFields as string | undefined,
});

export class DealController {
  readonly list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, unknown>;
    const parsed = parseQueryParams(query);
    const result = await dealService.list(toQueryOptions(parsed), getSearchParams(query));
    ApiResponse.paginated(res, result, MESSAGES.SUCCESS, getResponseMeta(req));
  });

  readonly getById = [
    validate({ params: dealIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await dealService.getById(getRouteParam(req.params.id));
      ApiResponse.success(res, entity, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];

  readonly create = [
    validate({ body: dealCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await dealService.create(req.body);
      ApiResponse.created(res, entity, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly update = [
    validate({ params: dealIdParamSchema, body: dealUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await dealService.update(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly patch = [
    validate({ params: dealIdParamSchema, body: dealUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await dealService.update(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly remove = [
    validate({ params: dealIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await dealService.remove(getRouteParam(req.params.id));
      ApiResponse.deleted(res, MESSAGES.DELETED, getResponseMeta(req));
    }),
  ];

  readonly restore = [
    validate({ params: dealIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await dealService.restore(getRouteParam(req.params.id));
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly changeStage = [
    validate({ params: dealIdParamSchema, body: dealStageChangeSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await dealService.changeStage(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly changeStatus = [
    validate({ params: dealIdParamSchema, body: dealStatusChangeSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await dealService.changeStatus(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly getTimeline = [
    validate({ params: dealIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await dealService.getById(getRouteParam(req.params.id));
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
    validate({ params: dealIdParamSchema, body: dealTimelineNoteSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await dealService.addTimelineNote(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly listComponents = [
    validate({ params: dealIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const components = await dealService.listComponents(getRouteParam(req.params.id));
      ApiResponse.success(res, components, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];

  readonly addComponent = [
    validate({ params: dealIdParamSchema, body: dealComponentCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const result = await dealService.addComponent(getRouteParam(req.params.id), req.body);
      ApiResponse.created(res, result, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly updateComponent = [
    validate({ params: dealComponentParamsSchema, body: dealComponentUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await dealService.updateComponent(
        getRouteParam(req.params.id),
        getRouteParam(req.params.componentId),
        req.body,
      );
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly removeComponent = [
    validate({ params: dealComponentParamsSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const deal = await dealService.removeComponent(
        getRouteParam(req.params.id),
        getRouteParam(req.params.componentId),
      );
      ApiResponse.updated(res, deal, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly listFiles = [
    validate({ params: dealIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const files = await dealService.listFiles(getRouteParam(req.params.id));
      ApiResponse.success(res, files, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];

  readonly addFile = [
    validate({ params: dealIdParamSchema, body: dealDocumentCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const result = await dealService.addFile(getRouteParam(req.params.id), req.body);
      ApiResponse.created(res, result, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly removeFile = [
    validate({ params: dealFileParamsSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await dealService.removeFile(
        getRouteParam(req.params.id),
        getRouteParam(req.params.fileId),
      );
      ApiResponse.deleted(res, MESSAGES.DELETED, getResponseMeta(req));
    }),
  ];
}

export const dealController = new DealController();
