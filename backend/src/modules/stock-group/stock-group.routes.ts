import { Router } from 'express';
import { createStockGroupSchema, updateStockGroupSchema } from '@smarterp/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { companyContext } from '../../middleware/company-context.middleware';
import { stockGroupController } from './stock-group.controller';

// ============================================================
// Stock Group Routes — /api/v1/stock-groups
// ============================================================

const router = Router();

// Apply auth check and company context to all routes
router.use(authenticate as any);
router.use(companyContext as any);

router.get('/', stockGroupController.getStockGroups);
router.get('/tree', stockGroupController.getStockGroupsTree);

router.post(
  '/',
  validate(createStockGroupSchema),
  stockGroupController.createStockGroup
);

router.put(
  '/:id',
  validate(updateStockGroupSchema),
  stockGroupController.updateStockGroup
);

router.delete('/:id', stockGroupController.deleteStockGroup);

export default router;
