import type { Request, Response, RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { validate } from '../../../middlewares';
import { idParamSchema } from '../../../validators/common.validators';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { parseQueryParams, toQueryOptions } from '../../../utils/queryParser.util';
import type { BaseEntity } from '../../../types';
import { getRouteParam } from '../../../utils/routeParams.util';
import type { MasterCrudService, MasterSingletonService } from './masterCrud.service';

type CreateHandler = RequestHandler[];
type UpdateHandler = RequestHandler[];

export class MasterCrudController<TEntity extends BaseEntity & Record<string, unknown>> {
  readonly list: RequestHandler;
  readonly getById: RequestHandler;
  readonly create: CreateHandler;
  readonly update: UpdateHandler;
  readonly remove: RequestHandler;

  constructor(
    private readonly service: MasterCrudService<TEntity>,
    createSchema: ZodType,
    updateSchema: ZodType,
  ) {
    this.list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const parsed = parseQueryParams(req.query as Record<string, unknown>);
      const result = await this.service.list(toQueryOptions(parsed));
      ApiResponse.paginated(res, result, MESSAGES.SUCCESS, getResponseMeta(req));
    });

    this.getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await this.service.getById(getRouteParam(req.params.id));
      ApiResponse.success(res, entity, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    });

    this.create = [
      validate({ body: createSchema }),
      asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const entity = await this.service.create(req.body);
        ApiResponse.created(res, entity, MESSAGES.CREATED, getResponseMeta(req));
      }),
    ];

    this.update = [
      validate({ params: idParamSchema, body: updateSchema }),
      asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const entity = await this.service.update(getRouteParam(req.params.id), req.body);
        ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
      }),
    ];

    this.remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await this.service.remove(getRouteParam(req.params.id));
      ApiResponse.deleted(res, MESSAGES.DELETED, getResponseMeta(req));
    });
  }
}

export class MasterSingletonController<TEntity extends BaseEntity & Record<string, unknown>> {
  readonly getCurrent: RequestHandler;
  readonly list: RequestHandler;
  readonly upsert: CreateHandler;
  readonly update: UpdateHandler;
  readonly remove: RequestHandler;

  constructor(
    private readonly service: MasterSingletonService<TEntity>,
    upsertSchema: ZodType,
    updateSchema: ZodType,
  ) {
    this.getCurrent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await this.service.getCurrent();
      ApiResponse.success(res, entity, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    });

    this.list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entities = await this.service.list();
      ApiResponse.success(res, entities, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    });

    this.upsert = [
      validate({ body: upsertSchema }),
      asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const entity = await this.service.upsert(req.body);
        ApiResponse.success(res, entity, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
      }),
    ];

    this.update = [
      validate({ params: idParamSchema, body: updateSchema }),
      asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const entity = await this.service.update(getRouteParam(req.params.id), req.body);
        ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
      }),
    ];

    this.remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await this.service.remove(getRouteParam(req.params.id));
      ApiResponse.deleted(res, MESSAGES.DELETED, getResponseMeta(req));
    });
  }
}
