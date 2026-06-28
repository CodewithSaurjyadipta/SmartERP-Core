import { Router } from 'express';
import { createUnitSchema, updateUnitSchema } from '@smarterp/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { companyContext } from '../../middleware/company-context.middleware';
import { unitController } from './unit.controller';

// ============================================================
// Unit Routes — /api/v1/units
// ============================================================

const router = Router();

// Apply auth check and company context to all routes
router.use(authenticate as any);
router.use(companyContext as any);

router.get('/', unitController.getUnits);
router.get('/:id', unitController.getUnitById);

router.post(
  '/',
  validate(createUnitSchema),
  unitController.createUnit
);

router.put(
  '/:id',
  validate(updateUnitSchema),
  unitController.updateUnit
);

router.delete('/:id', unitController.deleteUnit);

export default router;
