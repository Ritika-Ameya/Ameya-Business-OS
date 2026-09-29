import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { validate } from '../../../middlewares';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { getRouteParam } from '../../../utils/routeParams.util';
import { canvasService } from '../services/canvas.service';
import {
  createReceiptSchema,
  customerIdParamSchema,
  dismissReceiptSchema,
  markReceiptPaidSchema,
  scheduleReceiptSchema,
  setTemperatureSchema,
  splitReceiptSchema,
  updateReceiptSchema,
} from '../validators/canvas.validators';

export class CanvasController {
  readonly getBoard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const board = await canvasService.getBoard();
    ApiResponse.success(res, board, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
  });

  readonly getLeadTemperature = [
    validate({ params: customerIdParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const customerId = getRouteParam(req.params.customerId);
      const temperature = await canvasService.getTemperature(customerId);
      ApiResponse.success(
        res,
        { customerId, temperature },
        MESSAGES.SUCCESS,
        HTTP_STATUS.OK,
        getResponseMeta(req),
      );
    }),
  ];

  /** Same rule as setTemperature, without rebuilding the whole board. */
  readonly setLeadTemperature = [
    validate({ params: customerIdParamSchema, body: setTemperatureSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const customerId = getRouteParam(req.params.customerId);
      await canvasService.setTemperature(customerId, req.body.temperature);
      const temperature = await canvasService.getTemperature(customerId);
      ApiResponse.updated(res, { customerId, temperature }, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly markPaid = [
    validate({ body: markReceiptPaidSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await canvasService.markPaid(req.body);
      const board = await canvasService.getBoard();
      ApiResponse.updated(res, board, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly setTemperature = [
    validate({ params: customerIdParamSchema, body: setTemperatureSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await canvasService.setTemperature(getRouteParam(req.params.customerId), req.body.temperature);
      const board = await canvasService.getBoard();
      ApiResponse.updated(res, board, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly schedule = [
    validate({ body: scheduleReceiptSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await canvasService.schedule(req.body.cardId, req.body.monthKey);
      const board = await canvasService.getBoard();
      ApiResponse.updated(res, board, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly createReceipt = [
    validate({ body: createReceiptSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await canvasService.createReceipt(req.body);
      const board = await canvasService.getBoard();
      ApiResponse.created(res, board, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly updateReceipt = [
    validate({ body: updateReceiptSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await canvasService.updateReceipt(req.body);
      const board = await canvasService.getBoard();
      ApiResponse.updated(res, board, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly dismiss = [
    validate({ body: dismissReceiptSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await canvasService.dismiss(req.body.cardId);
      const board = await canvasService.getBoard();
      ApiResponse.updated(res, board, MESSAGES.UPDATED, getResponseMeta(req));
    }),
  ];

  readonly split = [
    validate({ body: splitReceiptSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      await canvasService.splitInvoice(req.body);
      const board = await canvasService.getBoard();
      ApiResponse.created(res, board, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];
}

export const canvasController = new CanvasController();
