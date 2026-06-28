import { Router } from 'express';
import { createStockItemSchema, updateStockItemSchema } from '@smarterp/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { companyContext } from '../../middleware/company-context.middleware';
import { stockItemController } from './stock-item.controller';

// ============================================================
// Stock Item Routes — /api/v1/stock-items
// ============================================================

const router = Router();

// Apply auth check and company context to all routes
router.use(authenticate as any);
router.use(companyContext as any);

router.get('/', stockItemController.getStockItems);
router.get('/:id', stockItemController.getStockItemById);

router.post(
  '/',
  validate(createStockItemSchema),
  stockItemController.createStockItem
);

router.put(
  '/:id',
  validate(updateStockItemSchema),
  stockItemController.updateStockItem
);

router.delete('/:id', stockItemController.deleteStockItem);

export default router;
