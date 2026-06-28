import { Request, Response, NextFunction } from 'express';
import { unitService } from './unit.service';
import { successResponse, createdResponse } from '../../utils/api-response';
import type { CompanyRequest } from '../../middleware/company-context.middleware';

// ============================================================
// Unit Controller
// ============================================================

export const unitController = {
  async getUnits(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const units = await unitService.getUnits(compReq.companyId);
      successResponse(res, units);
    } catch (error) {
      next(error);
    }
  },

  async getUnitById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const unit = await unitService.getUnitById(compReq.companyId, id);
      successResponse(res, unit);
    } catch (error) {
      next(error);
    }
  },

  async createUnit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const newUnit = await unitService.createUnit(
        compReq.companyId,
        compReq.user.id,
        compReq.body
      );
      createdResponse(res, newUnit);
    } catch (error) {
      next(error);
    }
  },

  async updateUnit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const updated = await unitService.updateUnit(
        compReq.companyId,
        compReq.user.id,
        id,
        compReq.body
      );
      successResponse(res, updated);
    } catch (error) {
      next(error);
    }
  },

  async deleteUnit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      await unitService.deleteUnit(compReq.companyId, compReq.user.id, id);
      successResponse(res, { message: 'Unit successfully deleted' });
    } catch (error) {
      next(error);
    }
  },
};
