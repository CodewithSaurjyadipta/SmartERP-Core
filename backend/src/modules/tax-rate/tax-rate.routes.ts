import { Router } from 'express';
import { createTaxRateSchema, updateTaxRateSchema } from '@smarterp/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { companyContext } from '../../middleware/company-context.middleware';
import { taxRateController } from './tax-rate.controller';

// ============================================================
// Tax Rate Routes — /api/v1/tax-rates
// ============================================================

const router = Router();

// Apply auth check and company context to all routes
router.use(authenticate as any);
router.use(companyContext as any);

router.get('/', taxRateController.getTaxRates);
router.get('/:id', taxRateController.getTaxRateById);

router.post(
  '/',
  validate(createTaxRateSchema),
  taxRateController.createTaxRate
);

router.put(
  '/:id',
  validate(updateTaxRateSchema),
  taxRateController.updateTaxRate
);

router.delete('/:id', taxRateController.deleteTaxRate);

export default router;
