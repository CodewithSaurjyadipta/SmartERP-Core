import { Router } from 'express';
import { createCustomerSchema, updateCustomerSchema } from '@smarterp/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { companyContext } from '../../middleware/company-context.middleware';
import { customerController } from './customer.controller';

// ============================================================
// Customer Routes — /api/v1/customers
// ============================================================

const router = Router();

// Apply auth check and company context to all routes
router.use(authenticate as any);
router.use(companyContext as any);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);

router.post(
  '/',
  validate(createCustomerSchema),
  customerController.createCustomer
);

router.put(
  '/:id',
  validate(updateCustomerSchema),
  customerController.updateCustomer
);

router.delete('/:id', customerController.deleteCustomer);

export default router;
