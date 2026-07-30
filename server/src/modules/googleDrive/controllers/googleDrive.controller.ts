import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { ValidationError } from '../../../utils/AppError';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import { googleDriveConnectionService } from '../services/googleDriveConnection.service';

const CALLBACK_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Google Drive Connected</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #1f2937; }
      .box { max-width: 520px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
      h1 { margin: 0 0 12px 0; font-size: 20px; }
      p { margin: 0; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>Google Drive connected successfully</h1>
      <p>You can now return to Ameya Business OS. Future uploads will use this account automatically.</p>
    </div>
  </body>
</html>`;

export class GoogleDriveController {
  /**
   * Starts single-admin OAuth. Requires Super Admin JWT.
   * Returns JSON with Google authorizationUrl (browser cannot send Bearer on raw redirects).
   */
  readonly connect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await googleDriveConnectionService.startConnect();
    ApiResponse.success(
      res,
      result,
      result.alreadyConnected
        ? 'Google Drive already connected'
        : 'Google Drive authorization URL ready',
      HTTP_STATUS.OK,
      getResponseMeta(req),
    );
  });

  readonly callback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const oauthError = String(req.query.error ?? '');
    if (oauthError) {
      throw new ValidationError(`Google authorization failed: ${oauthError}`);
    }
    const code = String(req.query.code ?? '');
    const state = String(req.query.state ?? '');
    await googleDriveConnectionService.completeOAuthCallback(code, state);

    const returnUrl = googleDriveConnectionService.getPostConnectRedirectUrl();
    if (returnUrl) {
      res.redirect(returnUrl);
      return;
    }

    res.status(HTTP_STATUS.OK).type('html').send(CALLBACK_HTML);
  });

  readonly status = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const status = await googleDriveConnectionService.getStatus();
    ApiResponse.success(res, status, MESSAGES.SUCCESS, HTTP_STATUS.OK, getResponseMeta(req));
  });
}

export const googleDriveController = new GoogleDriveController();
