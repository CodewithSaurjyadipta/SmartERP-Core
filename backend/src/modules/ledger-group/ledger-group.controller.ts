import { Request, Response, NextFunction } from 'express';
import { ledgerGroupService } from './ledger-group.service';
import { successResponse, createdResponse } from '../../utils/api-response';
import type { CompanyRequest } from '../../middleware/company-context.middleware';

// ============================================================
// Ledger Group Controller
// ============================================================

export const ledgerGroupController = {
  async getGroups(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const groups = await ledgerGroupService.getGroups(compReq.companyId);
      successResponse(res, groups);
    } catch (error) {
      next(error);
    }
  },

  async getGroupsTree(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const tree = await ledgerGroupService.getGroupsTree(compReq.companyId);
      successResponse(res, tree);
    } catch (error) {
      next(error);
    }
  },

  async createGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const newGroup = await ledgerGroupService.createGroup(
        compReq.companyId,
        compReq.user.id,
        compReq.body
      );
      createdResponse(res, newGroup);
    } catch (error) {
      next(error);
    }
  },

  async updateGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const updated = await ledgerGroupService.updateGroup(
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

  async deleteGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      await ledgerGroupService.deleteGroup(compReq.companyId, compReq.user.id, id);
      successResponse(res, { message: 'Ledger group successfully deleted' });
    } catch (error) {
      next(error);
    }
  },
};
