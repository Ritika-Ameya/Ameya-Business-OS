import type { RequestContext } from './context.types';

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export {};
