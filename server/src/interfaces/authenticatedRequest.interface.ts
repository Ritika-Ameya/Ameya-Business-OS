import type { Request } from 'express';

import type { RequestUser } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}
