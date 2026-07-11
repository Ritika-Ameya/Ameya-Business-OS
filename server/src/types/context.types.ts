export interface RequestUser {
  id: string;
  email: string;
  role: string;
}

export interface RequestContextMetadata {
  [key: string]: unknown;
}

export interface RequestContext {
  requestId: string;
  timestamp: string;
  user?: RequestUser;
  metadata: RequestContextMetadata;
}
