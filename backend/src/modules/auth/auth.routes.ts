import { Router } from 'express';
import { registerSchema, loginSchema, refreshTokenSchema } from '@smarterp/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rate-limiter.middleware';
import { authController } from './auth.controller';

// ============================================================
// Auth Routes — /api/v1/auth
// ============================================================

const router = Router();

/**
 * POST /api/v1/auth/register
 * @description Register a new user account
 * @access Public (rate-limited)
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * POST /api/v1/auth/login
 * @description Authenticate a user and return tokens
 * @access Public (rate-limited)
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * POST /api/v1/auth/refresh
 * @description Exchange a refresh token for new tokens
 * @access Public
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refresh
);

/**
 * POST /api/v1/auth/logout
 * @description Revoke the provided refresh token
 * @access Authenticated
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * GET /api/v1/auth/me
 * @description Get the authenticated user's profile
 * @access Authenticated
 */
router.get(
  '/me',
  authenticate,
  authController.me
);

export default router;
