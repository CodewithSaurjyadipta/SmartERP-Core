import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error';
import { errorResponse } from '../utils/api-response';
import { logger } from '../utils/logger';

// ============================================================
// Global Error Handler Middleware
// ============================================================

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── ApiError (known application errors) ────────────────
  if (err instanceof ApiError) {
    logger.warn('ErrorHandler', `${err.code} — ${err.message}`);
    errorResponse(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // ── Zod Validation Errors ──────────────────────────────
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    logger.warn('ErrorHandler', 'Validation error', details);
    errorResponse(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details);
    return;
  }

  // ── Database Unique Violations (Postgres code 23505) ────
  if ((err as any).code === '23505') {
    logger.warn('ErrorHandler', `Duplicate constraint violation: ${err.message}`);
    const details = (err as any).detail; // e.g. "Key (company_id, name)=(..., stocks) already exists."
    errorResponse(res, 409, 'CONFLICT', `A duplicate record already exists: ${details || err.message}`);
    return;
  }

  // ── Unknown / Unexpected Errors ────────────────────────
  logger.error('ErrorHandler', 'Unhandled error', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
