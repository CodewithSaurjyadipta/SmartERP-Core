import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/api-error';

// ============================================================
// Zod Validation Middleware
// ============================================================

/**
 * Returns Express middleware that validates `req[source]` against
 * the given Zod schema. On success the parsed (cleaned) data
 * replaces the raw value; on failure an ApiError.badRequest is thrown.
 */
export function validate(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw ApiError.badRequest('Validation failed', details);
    }

    // Replace raw data with parsed & cleaned data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional: overwriting req[source] with cleaned data
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
}
