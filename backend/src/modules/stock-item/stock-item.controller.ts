import { Request, Response, NextFunction } from 'express';
import { stockItemService } from './stock-item.service';
import { successResponse, createdResponse } from '../../utils/api-response';
import type { CompanyRequest } from '../../middleware/company-context.middleware';

// ============================================================
// Stock Item Controller
// ============================================================

export const stockItemController = {
  async getStockItems(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const items = await stockItemService.getStockItems(compReq.companyId);
      successResponse(res, items);
    } catch (error) {
      next(error);
    }
  },

  async getStockItemById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const item = await stockItemService.getStockItemById(compReq.companyId, id);
      successResponse(res, item);
    } catch (error) {
      next(error);
    }
  },

  async createStockItem(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const newItem = await stockItemService.createStockItem(
        compReq.companyId,
        compReq.user.id,
        compReq.body
      );
      createdResponse(res, newItem);
    } catch (error) {
      next(error);
    }
  },

  async updateStockItem(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const updated = await stockItemService.updateStockItem(
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

  async deleteStockItem(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      await stockItemService.deleteStockItem(compReq.companyId, compReq.user.id, id);
      successResponse(res, { message: 'Stock item successfully deleted' });
    } catch (error) {
      next(error);
    }
  },
};
