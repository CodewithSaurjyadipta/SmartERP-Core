import { Request, Response, NextFunction } from 'express';
import { ledgerService } from '../ledger/ledger.service';
import { ledgerGroupRepository } from '../ledger-group/ledger-group.repository';
import { successResponse, createdResponse } from '../../utils/api-response';
import { ApiError } from '../../utils/api-error';
import type { CompanyRequest } from '../../middleware/company-context.middleware';

// ============================================================
// Supplier Controller (Ledger Wrapper for Sundry Creditors)
// ============================================================

export const supplierController = {
  async getSuppliers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const suppliers = await ledgerService.getLedgers(compReq.companyId, {
        isSystemGroupNames: ['Sundry Creditors'],
      });
      successResponse(res, suppliers);
    } catch (error) {
      next(error);
    }
  },

  async getSupplierById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const ledger = await ledgerService.getLedgerById(compReq.companyId, id);

      // Verify that this ledger is in the Sundry Creditors group
      const group = await ledgerGroupRepository.findById(compReq.companyId, ledger.ledgerGroupId);
      if (!group || group.name !== 'Sundry Creditors') {
        throw ApiError.notFound('Supplier not found');
      }

      successResponse(res, ledger);
    } catch (error) {
      next(error);
    }
  },

  async createSupplier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      
      // Resolve the system Sundry Creditors group ID
      const creditorGroup = await ledgerGroupRepository.findByName(compReq.companyId, 'Sundry Creditors');
      if (!creditorGroup) {
        throw ApiError.badRequest('Sundry Creditors ledger group not found. Ensure seeding is complete.');
      }

      // Inject the group ID
      const supplierData = {
        ...compReq.body,
        ledgerGroupId: creditorGroup.id,
      };

      const newSupplier = await ledgerService.createLedger(
        compReq.companyId,
        compReq.user.id,
        supplierData
      );

      createdResponse(res, newSupplier);
    } catch (error) {
      next(error);
    }
  },

  async updateSupplier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;

      // Verify supplier membership
      const ledger = await ledgerService.getLedgerById(compReq.companyId, id);
      const group = await ledgerGroupRepository.findById(compReq.companyId, ledger.ledgerGroupId);
      if (!group || group.name !== 'Sundry Creditors') {
        throw ApiError.notFound('Supplier not found');
      }

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

  async deleteSupplier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;

      // Verify supplier membership
      const ledger = await ledgerService.getLedgerById(compReq.companyId, id);
      const group = await ledgerGroupRepository.findById(compReq.companyId, ledger.ledgerGroupId);
      if (!group || group.name !== 'Sundry Creditors') {
        throw ApiError.notFound('Supplier not found');
      }

      await ledgerService.deleteLedger(compReq.companyId, compReq.user.id, id);
      successResponse(res, { message: 'Supplier successfully deleted' });
    } catch (error) {
      next(error);
    }
  },
};
