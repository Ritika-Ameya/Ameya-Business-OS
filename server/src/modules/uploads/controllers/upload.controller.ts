import type { Request, Response } from 'express';
import { z } from 'zod';

import { MESSAGES } from '../../../constants';
import { validate } from '../../../middlewares';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { getRouteParam } from '../../../utils/routeParams.util';
import { uploadService } from '../services/upload.service';
import { uploadCreateSchema } from '../validators/upload.validators';

const driveFileParamSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
});

export class UploadController {
  readonly create = [
    validate({ body: uploadCreateSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const result = await uploadService.upload(req.body);
      ApiResponse.created(res, result, MESSAGES.CREATED, getResponseMeta(req));
    }),
  ];

  readonly downloadDriveFile = [
    validate({ params: driveFileParamSchema }),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const fileId = getRouteParam(req.params.fileId);
      const file = await uploadService.downloadDriveFile(fileId);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(file.name)}"`,
      );
      res.status(200).send(file.content);
    }),
  ];
}

export const uploadController = new UploadController();
