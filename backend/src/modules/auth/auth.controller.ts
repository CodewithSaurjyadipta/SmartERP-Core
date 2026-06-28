import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { successResponse, createdResponse, noContentResponse } from '../../utils/api-response';
import type { AuthenticatedRequest } from './auth.types';

// ============================================================
// Auth Controller — HTTP request/response handling
// ============================================================

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      createdResponse(res, result);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      successResponse(res, result);
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const tokens = await authService.refreshToken(refreshToken);
      successResponse(res, tokens);
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      await authService.logout(refreshToken);
      noContentResponse(res);
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req as AuthenticatedRequest;
      const profile = await authService.getProfile(user.id);
      successResponse(res, profile);
    } catch (err) {
      next(err);
    }
  },
};
