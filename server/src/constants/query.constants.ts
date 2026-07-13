export const PAGINATION_QUERY_KEYS = ['page', 'limit'] as const;

export const SORT_QUERY_KEYS = ['sort', 'sortBy', 'sortOrder', 'order', 'orderBy'] as const;

export const SEARCH_QUERY_KEYS = ['q', 'search', 'searchMode', 'searchFields'] as const;

export const RESERVED_QUERY_KEYS = new Set<string>([
  ...PAGINATION_QUERY_KEYS,
  ...SORT_QUERY_KEYS,
  ...SEARCH_QUERY_KEYS,
]);
