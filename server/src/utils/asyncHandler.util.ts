import type { NextFunction, Request, Response } from 'express';

type AsyncRequestHandler<TReq extends Request = Request> = (
  req: TReq,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export const asyncHandler =
  <TReq extends Request = Request>(handler: AsyncRequestHandler<TReq>) =>
  (req: TReq, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };
