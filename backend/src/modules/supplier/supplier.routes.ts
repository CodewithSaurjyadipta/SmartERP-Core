import { Router } from 'express';
import { createSupplierSchema, updateSupplierSchema } from '@smarterp/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { companyContext } from '../../middleware/company-context.middleware';
import { supplierController } from './supplier.controller';

// ============================================================
// Supplier Routes — /api/v1/suppliers
// ============================================================

const router = Router();

// Apply auth check and company context to all routes
router.use(authenticate as any);
router.use(companyContext as any);

router.get('/', supplierController.getSuppliers);
router.get('/:id', supplierController.getSupplierById);

router.post(
  '/',
  validate(createSupplierSchema),
  supplierController.createSupplier
);

router.put(
  '/:id',
  validate(updateSupplierSchema),
  supplierController.updateSupplier
);

router.delete('/:id', supplierController.deleteSupplier);

export default router;
