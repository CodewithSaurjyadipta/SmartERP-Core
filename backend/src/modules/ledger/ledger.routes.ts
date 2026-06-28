import { Router } from 'express';
import { createLedgerSchema, updateLedgerSchema } from '@smarterp/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { companyContext } from '../../middleware/company-context.middleware';
import { ledgerController } from './ledger.controller';

// ============================================================
// Ledger Routes — /api/v1/ledgers
// ============================================================

const router = Router();

// Apply auth check and company context to all routes
router.use(authenticate as any);
router.use(companyContext as any);

router.get('/', ledgerController.getLedgers);
router.get('/:id', ledgerController.getLedgerById);

router.post(
  '/',
  validate(createLedgerSchema),
  ledgerController.createLedger
);

router.put(
  '/:id',
  validate(updateLedgerSchema),
  ledgerController.updateLedger
);

router.delete('/:id', ledgerController.deleteLedger);

export default router;
