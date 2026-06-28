import { Request, Response, NextFunction } from 'express';
import { taxRateService } from './tax-rate.service';
import { successResponse, createdResponse } from '../../utils/api-response';
import type { CompanyRequest } from '../../middleware/company-context.middleware';

// ============================================================
// Tax Rate Controller
// ============================================================

export const taxRateController = {
  async getTaxRates(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const taxRates = await taxRateService.getTaxRates(compReq.companyId);
      successResponse(res, taxRates);
    } catch (error) {
      next(error);
    }
  },

  async getTaxRateById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const taxRate = await taxRateService.getTaxRateById(compReq.companyId, id);
      successResponse(res, taxRate);
    } catch (error) {
      next(error);
    }
  },

  async createTaxRate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const newTaxRate = await taxRateService.createTaxRate(
        compReq.companyId,
        compReq.user.id,
        compReq.body
      );
      createdResponse(res, newTaxRate);
    } catch (error) {
      next(error);
    }
  },

  async updateTaxRate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const updated = await taxRateService.updateTaxRate(
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

  async deleteTaxRate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      await taxRateService.deleteTaxRate(compReq.companyId, compReq.user.id, id);
      successResponse(res, { message: 'Tax rate successfully deleted' });
    } catch (error) {
      next(error);
    }
  },
};
