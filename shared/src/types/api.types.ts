// ============================================================
// Standard API Response Types
// ============================================================

/** Wrapper for all successful API responses */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

/** Wrapper for all error API responses */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Union type for any API response */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;
