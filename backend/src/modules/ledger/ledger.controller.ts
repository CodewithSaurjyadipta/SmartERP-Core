import { Request, Response, NextFunction } from 'express';
import { ledgerService } from './ledger.service';
import { successResponse, createdResponse } from '../../utils/api-response';
import type { CompanyRequest } from '../../middleware/company-context.middleware';

// ============================================================
// Ledger Controller
// ============================================================

export const ledgerController = {
  async getLedgers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const { ledgerGroupId, isSystemGroupName } = compReq.query;
      
      const filters: any = {};
      if (ledgerGroupId) filters.ledgerGroupId = ledgerGroupId as string;
      if (isSystemGroupName) {
        filters.isSystemGroupNames = Array.isArray(isSystemGroupName)
          ? (isSystemGroupName as string[])
          : [isSystemGroupName as string];
      }

      const ledgers = await ledgerService.getLedgers(compReq.companyId, filters);
      successResponse(res, ledgers);
    } catch (error) {
      next(error);
    }
  },

  async getLedgerById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const ledger = await ledgerService.getLedgerById(compReq.companyId, id);
      successResponse(res, ledger);
    } catch (error) {
      next(error);
    }
  },

  async createLedger(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const newLedger = await ledgerService.createLedger(
        compReq.companyId,
        compReq.user.id,
        compReq.body
      );
      createdResponse(res, newLedger);
    } catch (error) {
      next(error);
    }
  },

  async updateLedger(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const updated = await ledgerService.updateLedger(
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

  async deleteLedger(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      await ledgerService.deleteLedger(compReq.companyId, compReq.user.id, id);
      successResponse(res, { message: 'Ledger account successfully deleted' });
    } catch (error) {
      next(error);
    }
  },
};
