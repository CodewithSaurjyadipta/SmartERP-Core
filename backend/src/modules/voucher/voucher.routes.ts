import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { companyContext } from '../../middleware/company-context.middleware';
import { voucherController } from './voucher.controller';

// ============================================================
// Voucher Routes — /api/v1/vouchers
// ============================================================

const router = Router();

// Apply auth check and company context to all routes
router.use(authenticate as any);
router.use(companyContext as any);

router.get('/', voucherController.getVouchers);
router.get('/:id', voucherController.getVoucherById);
router.post('/', voucherController.createVoucher);
router.post('/:id/post', voucherController.postDraft);
router.post('/:id/cancel', voucherController.cancelVoucher);
router.post('/:id/reverse', voucherController.reverseVoucher);
router.get('/:id/audit', voucherController.getAuditTrail);
router.get('/:id/invoice', voucherController.getInvoiceDto);
router.get('/:id/pdf', voucherController.getInvoicePdf);

export default router;
