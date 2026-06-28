import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { db } from '../config/db';
import type { AuthenticatedRequest } from './auth.middleware';
import type { CompanyRole } from '@smarterp/shared';

// ============================================================
// Company Context Middleware
// ============================================================

export interface CompanyRequest extends AuthenticatedRequest {
  companyId: string;
  userRole: CompanyRole;
}

/**
 * Extracts X-Company-Id header, validates it, and checks if
 * the authenticated user has access to it. If valid, attaches
 * companyId and userRole to the request object.
 */
export async function companyContext(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const companyId = req.headers['x-company-id'] as string;

  if (!companyId) {
    return next(ApiError.badRequest('Missing X-Company-Id header'));
  }

  // Basic UUID v4 validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(companyId)) {
    return next(ApiError.badRequest('Invalid X-Company-Id format'));
  }

  try {
    // Check user_companies table
    const mapping = await db('user_companies')
      .where({
        user_id: req.user.id,
        company_id: companyId,
      })
      .first();

    if (!mapping) {
      return next(ApiError.forbidden('You do not have access to this company'));
    }

    // Attach company context
    const compReq = req as CompanyRequest;
    compReq.companyId = companyId;
    compReq.userRole = mapping.role as CompanyRole;

    next();
  } catch (error) {
    next(error);
  }
}
