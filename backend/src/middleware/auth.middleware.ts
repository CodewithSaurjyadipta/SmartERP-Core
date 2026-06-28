import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/api-error';

// ============================================================
// JWT Authentication Middleware
// ============================================================

export interface JwtPayload {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Verifies the Bearer token from the Authorization header and
 * attaches the decoded `{ id, email }` payload to `req.user`.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
}
