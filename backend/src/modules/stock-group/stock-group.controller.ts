import { Request, Response, NextFunction } from 'express';
import { stockGroupService } from './stock-group.service';
import { successResponse, createdResponse } from '../../utils/api-response';
import type { CompanyRequest } from '../../middleware/company-context.middleware';

// ============================================================
// Stock Group Controller
// ============================================================

export const stockGroupController = {
  async getStockGroups(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const groups = await stockGroupService.getStockGroups(compReq.companyId);
      successResponse(res, groups);
    } catch (error) {
      next(error);
    }
  },

  async getStockGroupsTree(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const tree = await stockGroupService.getStockGroupsTree(compReq.companyId);
      successResponse(res, tree);
    } catch (error) {
      next(error);
    }
  },

  async createStockGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const newGroup = await stockGroupService.createStockGroup(
        compReq.companyId,
        compReq.user.id,
        compReq.body
      );
      createdResponse(res, newGroup);
    } catch (error) {
      next(error);
    }
  },

  async updateStockGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const updated = await stockGroupService.updateStockGroup(
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

  async deleteStockGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      await stockGroupService.deleteStockGroup(compReq.companyId, compReq.user.id, id);
      successResponse(res, { message: 'Stock category group successfully deleted' });
    } catch (error) {
      next(error);
    }
  },
};
