import { Request, Response, NextFunction } from 'express';
import { companyService } from './company.service';
import { successResponse, createdResponse } from '../../utils/api-response';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import type { CompanyRequest } from '../../middleware/company-context.middleware';

// ============================================================
// Company Controller
// ============================================================

export const companyController = {
  async getCompanies(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const companies = await companyService.getCompaniesForUser(authReq.user.id);
      successResponse(res, companies);
    } catch (error) {
      next(error);
    }
  },

  async getCompany(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;
      const company = await companyService.getCompanyById(compReq.companyId);
      successResponse(res, company);
    } catch (error) {
      next(error);
    }
  },

  async createCompany(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const company = await companyService.createCompany(authReq.user.id, authReq.body);
      createdResponse(res, company);
    } catch (error) {
      next(error);
    }
  },

  async updateCompany(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const compReq = req as unknown as CompanyRequest;

      // Verify user role is OWNER or ADMIN
      if (compReq.userRole !== 'OWNER' && compReq.userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only company owners or administrators can modify settings',
          },
        });
        return;
      }

      const company = await companyService.updateCompany(compReq.companyId, compReq.body);
      successResponse(res, company);
    } catch (error) {
      next(error);
    }
  },
};
