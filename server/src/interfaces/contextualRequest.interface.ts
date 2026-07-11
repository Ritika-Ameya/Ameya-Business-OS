import type { Request } from 'express';

import type { RequestContext } from '../types';

/** @deprecated Use Express.Request with module augmentation instead */
export interface ContextualRequest extends Request {
  context: RequestContext;
}
