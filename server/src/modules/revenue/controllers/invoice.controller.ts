import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { validate } from '../../../middlewares';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { parseQueryParams, toQueryOptions } from '../../../utils/queryParser.util';
import { getRouteParam } from '../../../utils/routeParams.util';
import { invoiceService } from '../services/invoice.service';
import {
  invoiceCreateSchema,
  invoiceDocumentCreateSchema,
  invoiceFileParamsSchema,
  invoiceIdParamSchema,
  invoicePaymentParamsSchema,
  invoiceStatusChangeSchema,
  invoiceUpdateSchema,
  paymentCreateSchema,
  paymentUpdateSchema,
} from '../validators/revenue.validators';

const getSearchParams = (query: Record<string, unknown>) => ({
  q: (query.q ?? query.search) as string | undefined,
  mode: query.searchMode as string | undefined,
  fields: query.searchFields as string | undefined,
});

export class InvoiceController {
  readonly list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, unknown>;
    const parsed = parseQueryParams(query);
    const result = await invoiceService.list(toQueryOptions(parsed), getSearchParams(query));
    ApiResponse.paginated(res, result, MESSAGES.SUCCESS, getResponseMeta(req));
  });

  readonly getById = [
    validate({ params: invoiceIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await invoiceService.getById(getRouteParam(req.params.id));
      ApiResponse.success(res, entity, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];

  readonly create = [
    validate({ body: invoiceCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await invoiceService.create(req.body);
      ApiResponse.created(res, entity, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly update = [
    validate({ params: invoiceIdParamSchema, body: invoiceUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await invoiceService.update(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly patch = [
    validate({ params: invoiceIdParamSchema, body: invoiceUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await invoiceService.update(getRouteParam(req.params.id), req.body);
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly remove = [
    validate({ params: invoiceIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await invoiceService.remove(getRouteParam(req.params.id));
      ApiResponse.deleted(res, MESSAGES.DELETED, getResponseMeta(req));
    }),
  ];

  readonly restore = [
    validate({ params: invoiceIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await invoiceService.restore(getRouteParam(req.params.id));
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly changeStatus = [
    validate({ params: invoiceIdParamSchema, body: invoiceStatusChangeSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity = await invoiceService.changeStatus(
        getRouteParam(req.params.id),
        req.body.status,
      );
      ApiResponse.updated(res, entity, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly listPayments = [
    validate({ params: invoiceIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const payments = await invoiceService.listPayments(getRouteParam(req.params.id));
      ApiResponse.success(res, payments, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];

  readonly addPayment = [
    validate({ params: invoiceIdParamSchema, body: paymentCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const result = await invoiceService.addPayment(getRouteParam(req.params.id), req.body);
      ApiResponse.created(res, result, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly updatePayment = [
    validate({ params: invoicePaymentParamsSchema, body: paymentUpdateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const result = await invoiceService.updatePayment(
        getRouteParam(req.params.id),
        getRouteParam(req.params.paymentId),
        req.body,
      );
      ApiResponse.updated(res, result, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly removePayment = [
    validate({ params: invoicePaymentParamsSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const invoice = await invoiceService.removePayment(
        getRouteParam(req.params.id),
        getRouteParam(req.params.paymentId),
      );
      ApiResponse.updated(res, invoice, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly listFiles = [
    validate({ params: invoiceIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const files = await invoiceService.listFiles(getRouteParam(req.params.id));
      ApiResponse.success(res, files, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
    }),
  ];

  readonly addFile = [
    validate({ params: invoiceIdParamSchema, body: invoiceDocumentCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const result = await invoiceService.addFile(getRouteParam(req.params.id), req.body);
      ApiResponse.created(res, result, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly removeFile = [
    validate({ params: invoiceFileParamsSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await invoiceService.removeFile(
        getRouteParam(req.params.id),
        getRouteParam(req.params.fileId),
      );
      ApiResponse.deleted(res, MESSAGES.DELETED, getResponseMeta(req));
    }),
  ];
}

export const invoiceController = new InvoiceController();
