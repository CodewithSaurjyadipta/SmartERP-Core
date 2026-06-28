import { Router } from 'express';
import { createLedgerGroupSchema, updateLedgerGroupSchema } from '@smarterp/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { companyContext } from '../../middleware/company-context.middleware';
import { ledgerGroupController } from './ledger-group.controller';

// ============================================================
// Ledger Group Routes — /api/v1/ledger-groups
// ============================================================

const router = Router();

// Apply auth check and company context to all routes
router.use(authenticate as any);
router.use(companyContext as any);

router.get('/', ledgerGroupController.getGroups);
router.get('/tree', ledgerGroupController.getGroupsTree);

router.post(
  '/',
  validate(createLedgerGroupSchema),
  ledgerGroupController.createGroup
);

router.put(
  '/:id',
  validate(updateLedgerGroupSchema),
  ledgerGroupController.updateGroup
);

router.delete('/:id', ledgerGroupController.deleteGroup);

export default router;
