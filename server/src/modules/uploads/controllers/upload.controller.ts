import type { Request, Response } from 'express';

import { MESSAGES } from '../../../constants';
import { validate } from '../../../middlewares';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { uploadService } from '../services/upload.service';
import { uploadCreateSchema } from '../validators/upload.validators';

export class UploadController {
  readonly create = [
    validate({ body: uploadCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const result = await uploadService.upload(req.body);
      ApiResponse.created(res, result, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];
}

export const uploadController = new UploadController();
