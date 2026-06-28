import { z } from 'zod';

// ============================================================
// Unit Schemas
// ============================================================

export const createUnitSchema = z.object({
  name: z
    .string()
    .min(2, 'Unit name must be at least 2 characters')
    .max(50)
    .trim(),
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(10)
    .trim(),
  decimalPlaces: z.coerce
    .number()
    .int()
    .min(0, 'Decimal places cannot be negative')
    .max(4, 'Decimal places cannot exceed 4')
    .default(0),
  isActive: z.boolean().optional(),
});

export const updateUnitSchema = createUnitSchema.partial();

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;

// ============================================================
// Tax Rate (GST) Schemas
// ============================================================

export const createTaxRateSchema = z.object({
  name: z
    .string()
    .min(2, 'Tax rate name must be at least 2 characters')
    .max(100)
    .trim(),
  hsnSacCode: z
    .string()
    .max(8)
    .regex(/^\d*$/, 'HSN/SAC must be digits only')
    .optional()
    .or(z.literal('')),
  taxType: z.enum(['GST', 'EXEMPT', 'NIL']).default('GST'),
  cgstRate: z.coerce.number().min(0).max(100).default(0),
  sgstRate: z.coerce.number().min(0).max(100).default(0),
  igstRate: z.coerce.number().min(0).max(100).default(0),
  cessRate: z.coerce.number().min(0).max(100).default(0),
  isActive: z.boolean().optional(),
});

export const updateTaxRateSchema = createTaxRateSchema.partial();

export type CreateTaxRateInput = z.infer<typeof createTaxRateSchema>;
export type UpdateTaxRateInput = z.infer<typeof updateTaxRateSchema>;

// ============================================================
// Stock Group Schemas
// ============================================================

export const createStockGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Stock group name must be at least 2 characters')
    .max(255)
    .trim(),
  parentId: z.string().uuid('Invalid parent ID').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const updateStockGroupSchema = createStockGroupSchema.partial();

export type CreateStockGroupInput = z.infer<typeof createStockGroupSchema>;
export type UpdateStockGroupInput = z.infer<typeof updateStockGroupSchema>;

// ============================================================
// Stock Item Schemas
// ============================================================

export const createStockItemSchema = z.object({
  name: z
    .string()
    .min(2, 'Item name must be at least 2 characters')
    .max(255)
    .trim(),
  stockGroupId: z.string().uuid('Invalid Stock Group ID').optional().or(z.literal('')),
  unitId: z.string().uuid('Invalid Unit ID').optional().or(z.literal('')),
  taxRateId: z.string().uuid('Invalid Tax Rate ID').optional().or(z.literal('')),
  hsnCode: z
    .string()
    .max(8)
    .regex(/^\d*$/, 'HSN must be digits only')
    .optional()
    .or(z.literal('')),
  
  // Opening stock values (static balance, not dynamic quantity tracker)
  openingQty: z.coerce.number().default(0),
  openingRate: z.coerce.number().default(0),
  openingValue: z.coerce.number().default(0),
  
  // Pricing bounds
  standardSellingPrice: z.coerce.number().optional().or(z.literal('')),
  standardPurchasePrice: z.coerce.number().optional().or(z.literal('')),
  mrp: z.coerce.number().optional().or(z.literal('')),
  
  // Replenishment alerts
  reorderLevel: z.coerce.number().default(0),
  minimumQty: z.coerce.number().default(0),
  isActive: z.boolean().optional(),
});

export const updateStockItemSchema = createStockItemSchema.partial();

export type CreateStockItemInput = z.infer<typeof createStockItemSchema>;
export type UpdateStockItemInput = z.infer<typeof updateStockItemSchema>;
