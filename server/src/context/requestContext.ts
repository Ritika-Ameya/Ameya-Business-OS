import type { Request } from 'express';

import type { RequestContext, RequestContextMetadata, RequestUser } from '../types';
import { toISOString } from '../utils/date.util';
import { generateId } from '../utils/id.util';

export const createRequestContext = (
  metadata: RequestContextMetadata = {},
  user?: RequestUser,
  requestId?: string,
): RequestContext => ({
  requestId: requestId ?? generateId(),
  timestamp: toISOString(),
  user,
  metadata,
});

export const getRequestContext = (req: Request): RequestContext => {
  return req.context;
};

export const setContextMetadata = (
  context: RequestContext,
  key: string,
  value: unknown,
): RequestContext => {
  context.metadata[key] = value;
  return context;
};

export const setContextUser = (context: RequestContext, user: RequestUser): RequestContext => {
  context.user = user;
  return context;
};
