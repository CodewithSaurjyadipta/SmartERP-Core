import { z } from 'zod';
import { gstinSchema, panSchema, phoneSchema, pincodeSchema } from './common.schema';

// ============================================================
// Ledger Group Schemas
// ============================================================

export const createLedgerGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Ledger group name must be at least 2 characters')
    .max(255)
    .trim(),
  parentId: z.string().uuid('Invalid parent ID').optional().or(z.literal('')),
  nature: z.enum(['ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSE']),
  affectsGp: z.boolean().default(false),
  sequenceOrder: z.coerce.number().default(100),
  isActive: z.boolean().optional(),
});

export const updateLedgerGroupSchema = createLedgerGroupSchema.partial();

export type CreateLedgerGroupInput = z.infer<typeof createLedgerGroupSchema>;
export type UpdateLedgerGroupInput = z.infer<typeof updateLedgerGroupSchema>;

// ============================================================
// Ledger Schemas
// ============================================================

export const createLedgerSchema = z.object({
  name: z
    .string()
    .min(2, 'Ledger name must be at least 2 characters')
    .max(255)
    .trim(),
  ledgerGroupId: z.string().uuid('Invalid Ledger Group ID'),
  openingBalance: z.coerce.number().default(0),
  openingBalanceType: z.enum(['DEBIT', 'CREDIT']).optional().or(z.literal('')),
  
  // Party / Contact fields (optional, used for customers/suppliers)
  contactName: z.string().max(255).optional().or(z.literal('')),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal('')),
  gstin: gstinSchema,
  pan: panSchema,
  addressLine1: z.string().max(255).optional().or(z.literal('')),
  addressLine2: z.string().max(255).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  stateCode: z
    .string()
    .regex(/^\d{2}$/, 'State code must be 2 digits')
    .optional()
    .or(z.literal('')),
  stateName: z.string().max(100).optional().or(z.literal('')),
  pincode: pincodeSchema,
  gstRegistrationType: z
    .enum(['REGULAR', 'COMPOSITION', 'UNREGISTERED', 'CONSUMER'])
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const updateLedgerSchema = createLedgerSchema.partial();

export const createCustomerSchema = createLedgerSchema.omit({ ledgerGroupId: true });
export const updateCustomerSchema = createCustomerSchema.partial();

export const createSupplierSchema = createLedgerSchema.omit({ ledgerGroupId: true });
export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateLedgerInput = z.infer<typeof createLedgerSchema>;
export type UpdateLedgerInput = z.infer<typeof updateLedgerSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
