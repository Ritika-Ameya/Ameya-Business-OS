import type { Request } from 'express';

import type { ResponseMetadata } from '../types';

export const getResponseMeta = (req: Request): ResponseMetadata | undefined => {
  if (!req.context) {
    return undefined;
  }

  return {
    requestId: req.context.requestId,
    timestamp: req.context.timestamp,
  };
};
