import { Request, Response, NextFunction } from 'express';
import { ledgerService } from '../ledger/ledger.service';
import { ledgerGroupRepository } from '../ledger-group/ledger-group.repository';
import { successResponse, createdResponse } from '../../utils/api-response';
import { ApiError } from '../../utils/api-error';
import type { CompanyRequest } from '../../middleware/company-context.middleware';

// ============================================================
// Customer Controller (Ledger Wrapper for Sundry Debtors)
// ============================================================

export const customerController = {
  async getCustomers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const customers = await ledgerService.getLedgers(compReq.companyId, {
        isSystemGroupNames: ['Sundry Debtors'],
      });
      successResponse(res, customers);
    } catch (error) {
      next(error);
    }
  },

  async getCustomerById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;
      const ledger = await ledgerService.getLedgerById(compReq.companyId, id);

      // Verify that this ledger is in the Sundry Debtors group
      const group = await ledgerGroupRepository.findById(compReq.companyId, ledger.ledgerGroupId);
      if (!group || group.name !== 'Sundry Debtors') {
        throw ApiError.notFound('Customer not found');
      }

      successResponse(res, ledger);
    } catch (error) {
      next(error);
    }
  },

  async createCustomer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      
      // Resolve the system Sundry Debtors group ID
      const debtorGroup = await ledgerGroupRepository.findByName(compReq.companyId, 'Sundry Debtors');
      if (!debtorGroup) {
        throw ApiError.badRequest('Sundry Debtors ledger group not found. Ensure seeding is complete.');
      }

      // Inject the group ID
      const customerData = {
        ...compReq.body,
        ledgerGroupId: debtorGroup.id,
      };

      const newCustomer = await ledgerService.createLedger(
        compReq.companyId,
        compReq.user.id,
        customerData
      );

      createdResponse(res, newCustomer);
    } catch (error) {
      next(error);
    }
  },

  async updateCustomer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;

      // Verify customer membership
      const ledger = await ledgerService.getLedgerById(compReq.companyId, id);
      const group = await ledgerGroupRepository.findById(compReq.companyId, ledger.ledgerGroupId);
      if (!group || group.name !== 'Sundry Debtors') {
        throw ApiError.notFound('Customer not found');
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

  async deleteCustomer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const id = compReq.params.id as string;

      // Verify customer membership
      const ledger = await ledgerService.getLedgerById(compReq.companyId, id);
      const group = await ledgerGroupRepository.findById(compReq.companyId, ledger.ledgerGroupId);
      if (!group || group.name !== 'Sundry Debtors') {
        throw ApiError.notFound('Customer not found');
      }

      await ledgerService.deleteLedger(compReq.companyId, compReq.user.id, id);
      successResponse(res, { message: 'Customer successfully deleted' });
    } catch (error) {
      next(error);
    }
  },
};
