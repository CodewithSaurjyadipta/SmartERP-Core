import { z } from 'zod';
import { gstinSchema, panSchema, phoneSchema, pincodeSchema } from './common.schema';

// ============================================================
// Company Schemas
// ============================================================

export const createCompanySchema = z.object({
  name: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(255)
    .trim(),
  legalName: z.string().max(255).trim().optional(),
  gstin: gstinSchema,
  pan: panSchema,
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  stateCode: z
    .string()
    .regex(/^\d{2}$/, 'State code must be 2 digits')
    .optional(),
  stateName: z.string().max(100).optional(),
  pincode: pincodeSchema,
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  financialYearStart: z.coerce.date(),
  booksFrom: z.coerce.date(),
  baseCurrency: z.string().length(3).default('INR'),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
