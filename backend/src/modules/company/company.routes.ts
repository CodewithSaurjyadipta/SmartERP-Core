import { Router } from 'express';
import { createCompanySchema, updateCompanySchema } from '@smarterp/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { companyContext } from '../../middleware/company-context.middleware';
import { companyController } from './company.controller';

// ============================================================
// Company Routes — /api/v1/companies
// ============================================================

const router = Router();

// Apply auth check globally to all company routes
router.use(authenticate as any);

/**
 * POST /api/v1/companies
 * @description Create a new company and auto-seed default settings
 * @access Authenticated
 */
router.post(
  '/',
  validate(createCompanySchema),
  companyController.createCompany
);

/**
 * GET /api/v1/companies
 * @description List all companies mapped to the authenticated user
 * @access Authenticated
 */
router.get(
  '/',
  companyController.getCompanies
);

/**
 * GET /api/v1/companies/:id
 * @description Get details of a specific company (id must match header context)
 * @access Authenticated + Company Context
 */
router.get(
  '/:id',
  companyContext as any,
  companyController.getCompany
);

/**
 * PUT /api/v1/companies/:id
 * @description Update details of a specific company
 * @access Authenticated + Company Context (Owner/Admin only)
 */
router.put(
  '/:id',
  companyContext as any,
  validate(updateCompanySchema),
  companyController.updateCompany
);

export default router;
