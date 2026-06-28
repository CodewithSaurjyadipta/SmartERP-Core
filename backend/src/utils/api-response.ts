import { Response } from 'express';
import type { PaginationMeta } from '@smarterp/shared';

// ============================================================
// Standard API Response Helpers
// ============================================================

export function successResponse<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta
) {
  const response: { success: true; data: T; meta?: PaginationMeta } = {
    success: true,
    data,
  };
  if (meta) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
}

export function createdResponse<T>(res: Response, data: T) {
  return successResponse(res, data, 201);
}

export function noContentResponse(res: Response) {
  return res.status(204).send();
}

export function errorResponse(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
}
