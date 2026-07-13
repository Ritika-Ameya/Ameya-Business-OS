export const MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  CONFLICT: 'Resource conflict',
  INTERNAL_ERROR: 'Internal server error',
  ROUTE_NOT_FOUND: 'Route not found',
} as const;

export type MessageKey = keyof typeof MESSAGES;
